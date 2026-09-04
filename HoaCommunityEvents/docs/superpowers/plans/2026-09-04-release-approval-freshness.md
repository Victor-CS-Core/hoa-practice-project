# HOA Release Approval Freshness Implementation Plan

> **Superseded by user decision:** Retain B1 and deploy directly without staging. See [current B1 runbook](../../B1-DIRECT-DEPLOYMENT.md). Do not execute slot creation or upgrade steps from this historical plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two final release-safety gaps by proving staging configuration before any production database mutation and revalidating the exact trusted release after every protected approval wait and immediately before mutation or staging deployment.

**Architecture:** Keep the exact CI artifact and separate approval model from the production-readiness work. Insert a `staging_preflight` job between `prepare` and `database_gate`; both `staging_preflight` and `deploy` reference GitHub Environment `production`, while `database_gate` references `production-database`. A repository-local composite action performs the same current-main and exact trusted-CI check in every protected job, with a second invocation immediately before database mutation and Azure staging deployment.

**Tech Stack:** GitHub Actions YAML, Bash, GitHub CLI/API, Node.js dependency-free workflow validation, checksum-pinned actionlint.

**Spec:** `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`

## Global Constraints

- Work only on branch `release-combined-bff-readiness` in its isolated worktree.
- Do not push, merge, deploy, apply a database migration, change DNS, swap an Azure slot, or delete an Azure resource.
- Preserve CI as the only producer of the SHA-256-verified combined BFF artifact.
- Preserve distinct GitHub Environments: `production` for staging preflight/deployment and `production-database` for database responsibility.
- A protected staging configuration preflight must succeed before `database_gate` becomes eligible.
- Revalidate current `main` and the exact successful trusted CI run after every Environment approval and again immediately before database mutation or staging deployment.
- The SQL connection secret remains scoped only to the actual migration step.
- Keep all third-party Actions pinned to the reviewed full commit SHAs already in the workflows.
- Keep slot swap, DNS cutover, production promotion, and legacy Static Web App deletion outside automation.
- Keep one production App Service instance while the SSE broker is process-local.
- Never write secret values, publish-profile contents, connection strings, credentials, or tokens to output or documentation.

---

### Task 1: Gate database work behind fresh staging preflight

**Files:**
- Create: `.github/actions/verify-release-freshness/action.yml`
- Modify: `.github/workflows/deploy-api-azure.yml`
- Modify: `scripts/validate-production-workflow.mjs`
- Modify: `HoaCommunityEvents/README.md`
- Modify: `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`
- Create: `HoaCommunityEvents/docs/superpowers/plans/2026-09-04-release-approval-freshness.md`

**Interfaces:**
- Consumes: `needs.prepare.outputs.deploy_sha`, `needs.prepare.outputs.ci_run_id`, `${{ github.repository }}`, and `${{ github.token }}`.
- Produces: local action `./.github/actions/verify-release-freshness`; job chain `prepare -> staging_preflight -> database_gate -> deploy`; two freshness checks in each job that can mutate the database or staging slot.

- [ ] **Step 1: Extend the validator first and demonstrate a red result**

Update `scripts/validate-production-workflow.mjs` so the expected release contract requires:

- A `staging_preflight` job with `needs: prepare`, GitHub Environment `production`, and only `actions: read` plus `contents: read` permissions.
- The preflight job checks out `needs.prepare.outputs.deploy_sha`, invokes `./.github/actions/verify-release-freshness`, and validates the App Service name, slot-scoped publish profile, and canonical non-production slot.
- `database_gate` depends on `[prepare, staging_preflight]`.
- `deploy` depends on `[prepare, staging_preflight, database_gate]`.
- Every protected job invokes the local freshness action after checkout.
- `database_gate` invokes it a second time directly before the conditional migration step.
- `deploy` invokes it a second time after artifact/configuration verification and directly before `Azure/webapps-deploy`.
- The local action checks current `main` and the exact CI run's SHA, branch, event, conclusion, repository, and workflow path without printing the token.
- The SQL secret still appears exactly once and only on the migration step.

Add negative fixtures that each make exactly one of these regressions and must be rejected:

- remove `staging_preflight`;
- remove its `production` Environment;
- remove staging configuration validation from preflight;
- bypass `staging_preflight` in `database_gate.needs`;
- bypass either prior job in `deploy.needs`;
- remove the post-approval freshness check from preflight;
- remove the immediate pre-migration freshness check;
- remove the immediate pre-deploy freshness check;
- weaken any one current-main or trusted-run assertion in the local action;
- move the migration before its final freshness check;
- move the Azure deploy action before its final freshness check.

Run:

```powershell
node --check scripts/validate-production-workflow.mjs
node scripts/validate-production-workflow.mjs
```

Expected: syntax passes and the contract validator fails against the current three-job workflow because `staging_preflight` and the reusable freshness action do not exist.

- [ ] **Step 2: Create the reusable freshness action**

Create `.github/actions/verify-release-freshness/action.yml` as a local composite action with required inputs `deploy-sha`, `ci-run-id`, `repository`, and `token`.

Its Bash step must:

1. Use `set -euo pipefail`.
2. Bind the token only through `GH_TOKEN` in that step.
3. Reject missing inputs without printing values.
4. Read `refs/heads/main` through `gh api` and require the returned SHA to equal `deploy-sha`.
5. Read `actions/runs/<ci-run-id>` and require all of:
   - `.head_sha == deploy-sha`;
   - `.head_branch == "main"`;
   - `.event == "push"`;
   - `.conclusion == "success"`;
   - `.head_repository.full_name == repository`;
   - `.path` begins with `.github/workflows/ci.yml`.
6. Emit only a success message containing the non-secret commit SHA.

Do not call Azure, download an artifact, or mutate any state.

- [ ] **Step 3: Insert the protected staging preflight before database authorization**

In `.github/workflows/deploy-api-azure.yml`, add `staging_preflight` after `prepare`:

```yaml
  staging_preflight:
    name: Approve and Validate Staging Configuration
    needs: prepare
    environment:
      name: production
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      actions: read
      contents: read
```

The ordered steps are:

1. Pinned checkout of `${{ needs.prepare.outputs.deploy_sha }}` with credentials disabled.
2. `Verify release freshness after staging-preflight approval` using the local action and all four exact inputs.
3. `Validate staging deployment configuration`, using only `AZURE_WEBAPP_NAME_PRODUCTION`, `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`, and `AZURE_WEBAPP_SLOT_NAME_PRODUCTION`. Canonicalize the slot, reject an empty value and case-insensitive `production`, and never print secret values.

This job performs no deployment and no database operation.

- [ ] **Step 4: Revalidate after database approval and immediately before mutation**

Change `database_gate.needs` to `[prepare, staging_preflight]`, add `actions: read`, and check out the exact release SHA before using the local freshness action.

Invoke the local action:

- once immediately after checkout, named `Verify release freshness after database approval`;
- again immediately before `Apply production database migrations`, named `Reconfirm release freshness before database mutation`.

The second check must occur after any .NET/tool setup so a newer `main` appearing during setup is rejected before `dotnet ef database update`. External migration mode still records the separately approved external gate and performs no mutation.

- [ ] **Step 5: Revalidate after staging approval and immediately before deployment**

Change `deploy.needs` to `[prepare, staging_preflight, database_gate]`, add `contents: read`, and check out the exact release SHA before invoking the local action.

Invoke the local action:

- once immediately after checkout, named `Verify release freshness after staging approval`;
- again after staging configuration, artifact digest, API DLL, and SPA entry verification but directly before `Deploy exact artifact to Azure staging slot`, named `Reconfirm release freshness before staging deployment`.

Continue to deploy only `${{ env.SLOT_NAME_CANONICAL }}` and never republish, swap, promote, or change DNS.

- [ ] **Step 6: Synchronize operator documentation**

Update `HoaCommunityEvents/README.md` and `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md` to state:

- GitHub evaluates Environment protection rules before each referencing job is sent to a runner.
- `production` is referenced once for a non-mutating staging configuration preflight and again for the actual staging deployment; both jobs must pass its protection rules.
- `production-database` remains a separate intervening approval.
- The release SHA/trusted CI run is revalidated after approvals and immediately before database mutation/staging deployment.
- Database mutation cannot begin until the protected staging configuration preflight proves the App Service name, slot-scoped publish profile, and non-production slot are configured.
- These checks do not prove the live Azure slot exists; that remains an external Azure ownership/readiness gate.

Add this follow-up plan file to the documentation commit. Keep every path repository-relative.

- [ ] **Step 7: Run focused verification**

Run from repository root:

```powershell
node --check scripts/validate-production-workflow.mjs
node scripts/validate-production-workflow.mjs
```

Run the same checksum-verified actionlint v1.7.12 procedure documented in the existing production-readiness plan against:

```text
.github/workflows/ci.yml
.github/workflows/deploy-api-azure.yml
```

Then run:

```powershell
git diff --check 060f8766f6b7291d1267fef48ca65afe81c85dbf
git status --short
```

Expected: Node syntax passes; every positive and negative fixture passes; actionlint reports zero findings; the branch range has no whitespace errors; only the six Task 1 paths are uncommitted.

- [ ] **Step 8: Commit the focused follow-up**

```powershell
git add .github/actions/verify-release-freshness/action.yml .github/workflows/deploy-api-azure.yml scripts/validate-production-workflow.mjs HoaCommunityEvents/README.md HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md HoaCommunityEvents/docs/superpowers/plans/2026-09-04-release-approval-freshness.md
git commit -m "ci: revalidate releases across approval gates"
```

---

## External checkpoint after Task 1

Do not push the branch until Task 1 receives a clean task review and clean whole-branch review. A push and pull request are shared external side effects and require explicit user approval. Hosted CI, GitHub Environment behavior, Azure configuration, database execution, and staging deployment remain unverified until their later approval gates.
