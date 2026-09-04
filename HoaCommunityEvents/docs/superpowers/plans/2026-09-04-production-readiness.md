# HOA Combined BFF Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the HOA combined ASP.NET Core BFF release safe to stage from GitHub Actions, explicit about database migration ownership, protected by a production approval environment, and documented for the eventual Azure cutover.

**Architecture:** GitHub CI validates the application and the release-workflow contract. A successful trusted `main` CI run may prepare a combined publish artifact, but the deploy workflow targets a required non-production App Service slot and is protected by the GitHub `production` Environment. Production promotion, database execution authority, DNS cutover, and legacy resource deletion remain explicit external gates.

**Tech Stack:** GitHub Actions YAML, Node.js 22 validation script, ASP.NET Core/.NET 10, React/Vite, Azure App Service deployment slots, EF Core migrations.

**Spec:** `D:\dev\TigerTeam\Projects\HoaCommunityEvents\docs\PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`

## Global Constraints

- Work only on branch `release-combined-bff-readiness` in the isolated worktree.
- Do not push, merge, deploy, apply a database migration, change DNS, swap an Azure slot, or delete the legacy Static Web App without explicit user approval at that boundary.
- One `dotnet publish` remains the source of the combined API plus `wwwroot` frontend artifact.
- The deployment workflow must reject a missing or production-valued slot name; the automated deployment target is a staging slot.
- Database migration ownership must be explicitly `workflow` or `external`; it must never silently skip because a secret is missing.
- The deploy job must use a GitHub Environment named exactly `production`.
- Keep production at one App Service instance while the SSE broker is process-local.
- Never write secret values, publish-profile contents, connection strings, test credentials, or Azure access tokens to source, logs, reports, or documentation.
- Frontend baseline evidence is lint pass, 12 test files and 49 tests pass, and production build pass. Backend restore is currently blocked locally by the Windows TLS credential provider, so exact-SHA GitHub CI is the authoritative backend gate.

---

### Task 1: Make the staging deployment workflow safe by contract

**Files:**
- Create: `scripts/validate-production-workflow.mjs`
- Modify: `.github/workflows/deploy-api-azure.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: GitHub Environment `production`; environment variables `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` and `PRODUCTION_MIGRATION_MODE`; secrets `AZURE_WEBAPP_NAME_PRODUCTION`, `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`, and conditionally `AZURE_SQL_CONNECTION_STRING_PRODUCTION`.
- Produces: a deployment workflow that uploads the exact combined artifact, targets a required staging slot, uses an explicit migration mode, and performs unauthenticated combined-app smoke checks; a dependency-free Node contract validator invoked by CI.

- [ ] **Step 1: Create the failing workflow-contract validator**

Create `scripts/validate-production-workflow.mjs` with this content:

```js
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = new URL('../', import.meta.url);
const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, repositoryRoot)), 'utf8');

const deployWorkflow = read('.github/workflows/deploy-api-azure.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const legacyStaticWorkflow = fileURLToPath(
  new URL('.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml', repositoryRoot),
);

const requiredDeploymentFragments = [
  'environment:\n      name: production',
  'SLOT_NAME: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}',
  'MIGRATION_MODE: ${{ vars.PRODUCTION_MIGRATION_MODE }}',
  "if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}",
  'slot-name: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}',
  'uses: actions/upload-artifact@v4',
  'steps.deploy.outputs.webapp-url',
  '/api/security/csrf',
  'wwwroot/index.html',
];

const missing = requiredDeploymentFragments.filter(
  (fragment) => !deployWorkflow.includes(fragment),
);

if (missing.length > 0) {
  throw new Error(`Deployment workflow is missing required release controls:\n- ${missing.join('\n- ')}`);
}

if (existsSync(legacyStaticWorkflow)) {
  throw new Error('Legacy Azure Static Web Apps workflow must remain deleted.');
}

if (!ciWorkflow.includes('node scripts/validate-production-workflow.mjs')) {
  throw new Error('CI must run the production workflow contract validator.');
}

console.log('Production workflow contract is valid.');
```

- [ ] **Step 2: Run the validator and confirm that the current workflow fails the new contract**

Run from the repository root:

```powershell
node scripts/validate-production-workflow.mjs
```

Expected: nonzero exit with missing `environment`, staging-slot, explicit migration-mode, artifact-upload, and smoke-test fragments.

- [ ] **Step 3: Protect the deploy job and validate its release configuration**

In `.github/workflows/deploy-api-azure.yml`, add this directly under `deploy:`:

```yaml
    environment:
      name: production
```

Extend the job `env` block to include:

```yaml
      SLOT_NAME: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}
      MIGRATION_MODE: ${{ vars.PRODUCTION_MIGRATION_MODE }}
```

Replace the deployment-configuration validation step with a shell check that:

1. Requires the App Service name and publish profile.
2. Requires `SLOT_NAME` and rejects `production` case-insensitively.
3. Accepts only `workflow` or `external` for `MIGRATION_MODE`.
4. Requires `AZURE_SQL_CONNECTION_STRING_PRODUCTION` when the mode is `workflow`.
5. Writes no secret values.

Use this condition for the migration step:

```yaml
        if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'workflow' }}
```

Add a separate summary step for external migrations:

```yaml
      - name: Record external migration responsibility
        if: ${{ vars.PRODUCTION_MIGRATION_MODE == 'external' }}
        run: echo "Database migration is an approved external release gate." >> "$GITHUB_STEP_SUMMARY"
```

- [ ] **Step 4: Preserve a rollback artifact and deploy only to the staging slot**

Before the Azure deploy action, upload the combined publish directory:

```yaml
      - name: Preserve combined release artifact
        uses: actions/upload-artifact@v4
        with:
          name: hoa-bff-${{ env.DEPLOY_SHA }}
          path: ${{ runner.temp }}/hoa-bff-publish
          if-no-files-found: error
          retention-days: 30
```

Give the deploy step the ID `deploy` and add the required slot input:

```yaml
      - name: Deploy to Azure staging slot
        id: deploy
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME_PRODUCTION }}
          slot-name: ${{ vars.AZURE_WEBAPP_SLOT_NAME_PRODUCTION }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION }}
          package: ${{ runner.temp }}/hoa-bff-publish
```

- [ ] **Step 5: Add automated combined-app smoke checks for the staged URL**

After deployment, use `steps.deploy.outputs.webapp-url` and `curl` to retry the slot during warm-up, then require:

- `/health` returns HTTP 200.
- `/` returns HTML containing `<!doctype html`.
- `/events/release-readiness-check` returns the SPA HTML fallback.
- `/api/security/csrf` returns HTTP 200.

The step must fail when the action output URL is empty and must not perform login or mutate application data.

- [ ] **Step 6: Make CI run the dependency-free contract validator**

In the `backend` job of `.github/workflows/ci.yml`, after Node setup and before .NET restore, add:

```yaml
      - name: Validate production workflow contract
        run: node scripts/validate-production-workflow.mjs
```

- [ ] **Step 7: Run local contract and frontend verification**

Run:

```powershell
node scripts/validate-production-workflow.mjs
npm run lint --prefix HoaCommunityEvents/frontend
npm run test:run --prefix HoaCommunityEvents/frontend
npm run build --prefix HoaCommunityEvents/frontend
git diff --check
```

Expected: validator passes, lint passes, 12 Vitest files and 49 tests pass, Vite builds successfully, and `git diff --check` reports nothing.

- [ ] **Step 8: Commit Task 1**

```powershell
git add .github/workflows/deploy-api-azure.yml .github/workflows/ci.yml scripts/validate-production-workflow.mjs
git commit -m "ci: stage combined BFF behind release gates"
```

---

### Task 2: Align release documentation with the hardened workflow

**Files:**
- Create: `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`
- Create: `HoaCommunityEvents/docs/superpowers/plans/2026-09-04-production-readiness.md`
- Modify: `HoaCommunityEvents/README.md`

**Interfaces:**
- Consumes: Task 1's exact GitHub Environment name, variable names, secret names, staging-only deployment behavior, migration modes, artifact retention, and smoke-test behavior.
- Produces: operator-facing setup instructions and the repository copy of the audited release tasking.

- [ ] **Step 1: Add the audited readiness tasking to the release branch**

Read `D:\dev\TigerTeam\Projects\HoaCommunityEvents\docs\PRODUCTION-DEPLOYMENT-READINESS-TASKS.md` and create `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md` with the same audited evidence, P0/P1 tasks, smoke matrix, cutover steps, and rollback steps. Preserve secret names but never include secret values.

- [ ] **Step 2: Update the tasking to describe the new local safety controls**

In the repository copy, update the local-state and P0.1/P0.6 sections so they state:

- Branch `release-combined-bff-readiness` contains the release hardening.
- The deployment job uses GitHub Environment `production`.
- `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` is mandatory and must identify a non-production slot.
- `PRODUCTION_MIGRATION_MODE` is mandatory and must be `workflow` or `external`.
- Workflow mode requires `AZURE_SQL_CONNECTION_STRING_PRODUCTION`; external mode records the database migration as a separate release gate.
- The combined publish artifact is retained for 30 days.
- The workflow performs unauthenticated health, root, SPA-fallback, and CSRF smoke checks against the staging slot.
- Slot swap and every production-changing action still require explicit approval.

- [ ] **Step 3: Update the README deployment contract**

In `HoaCommunityEvents/README.md`, retain the existing architecture explanation but change the deployment section to explain:

- Successful trusted `main` CI stages the artifact; it does not automatically swap the slot into production.
- Configure GitHub Environment `production` with a required reviewer.
- Environment variable `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` must name the staging slot.
- Environment variable `PRODUCTION_MIGRATION_MODE` must be `workflow` or `external`.
- Workflow mode requires the SQL secret; external mode requires a separately verified migration before slot promotion.
- The publish profile must be scoped to the staging slot.
- The workflow retains the artifact for 30 days and runs only non-mutating smoke checks.
- A human-authorized slot swap and full authenticated smoke matrix complete the cutover.

- [ ] **Step 4: Verify terminology and repository cleanliness**

Run:

```powershell
rg -n "AZURE_WEBAPP_SLOT_NAME_PRODUCTION|PRODUCTION_MIGRATION_MODE|environment.*production|30 days|staging slot" HoaCommunityEvents/README.md HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md
git diff --check
git status --short
```

Expected: both documents use the exact names, no whitespace errors are reported, and only Task 2 documentation is uncommitted.

- [ ] **Step 5: Commit Task 2**

```powershell
git add HoaCommunityEvents/README.md HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md HoaCommunityEvents/docs/superpowers/plans/2026-09-04-production-readiness.md
git commit -m "docs: define combined BFF production release gate"
```

---

## External checkpoints after local implementation

These are not implementation tasks and must not be executed by an implementer subagent:

1. Ask for approval before pushing `release-combined-bff-readiness` to GitHub or opening a pull request.
2. After approval, push only the release branch and open a pull request; do not merge it.
3. Require exact-SHA CI to pass. This is also the authoritative backend verification because local NuGet restore is blocked by the Windows credential provider.
4. Configure the GitHub `production` Environment, variables, secrets, required reviewer, and branch protection through a repository administrator.
5. Recover Azure access and verify the actual App Service slot, runtime settings, health checks, one-instance SSE constraint, SQL database, backup, migration method, domain, and rollback operator.
6. Ask for separate explicit approval before staging deployment if it may touch a shared Azure slot or production database.
7. Ask again before a database migration, slot swap, DNS cutover, or legacy Static Web App deletion.
