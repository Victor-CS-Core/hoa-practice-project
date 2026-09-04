# HOA Combined BFF Production Readiness Implementation Plan

> **Superseded:** This plan is retained as historical implementation context. The current approval chain and final release-safety requirements are defined in [2026-09-04-release-approval-freshness.md](2026-09-04-release-approval-freshness.md); do not execute this older three-job sequence.

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. All paths are repository-relative.

**Goal:** Make the combined ASP.NET Core and Vite BFF safe to stage from GitHub Actions by promoting the exact successful-CI artifact, separating database authorization from staging authorization, and preserving explicit human control over production promotion.

**Architecture:** CI performs the only release publish, verifies the API DLL and SPA entry point, packages a commit-SHA-addressed archive with a SHA-256 manifest, and retains it for 30 days. The deployment workflow verifies current `main` and the exact successful trusted CI run, verifies that run's artifact, passes through the separately protected `production-database` gate, then downloads and verifies the same artifact again before deploying it to the `production`-protected staging slot. No workflow swaps or promotes the slot.

**Tech stack:** GitHub Actions YAML, Node.js release-contract validation, actionlint v1.7.12, ASP.NET Core/.NET 10, React/Vite, Azure App Service deployment slots, and EF Core migrations.

**Spec:** `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`

## Global constraints

- Work only on branch `release-combined-bff-readiness` in its isolated worktree.
- Do not push, merge, deploy, execute a database migration, change DNS, swap a slot, promote to production, or mutate Azure resources while implementing this plan.
- Preserve the combined ASP.NET Core plus Vite BFF architecture.
- CI performs one release `dotnet publish`; deployment must never republish.
- CI must preserve the SHA-addressed artifact and digest before database authorization can run.
- Database authorization uses GitHub Environment `production-database`; staging authorization uses the distinct Environment `production`.
- `PRODUCTION_MIGRATION_MODE` is mandatory and exactly `workflow` or `external`.
- Only the conditional migration step may receive `AZURE_SQL_CONNECTION_STRING_PRODUCTION`, and it must check for an empty value without printing the value.
- `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` is mandatory. Validation exports one canonical non-production value and deployment must use `${{ env.SLOT_NAME_CANONICAL }}`.
- Keep production at one App Service instance while the SSE broker remains process-local.
- Never write secret values, publish-profile contents, connection strings, test credentials, or Azure tokens to source, logs, reports, or documentation.

## Task 1: Make CI the immutable artifact producer

**Files:**

- `.github/workflows/ci.yml`
- `scripts/validate-production-workflow.mjs`

1. Add explicit workflow permission `contents: read`.
2. Pin every `uses:` action to a reviewed full 40-character commit SHA.
3. Run `node scripts/validate-production-workflow.mjs` before restore.
4. Download the fixed actionlint v1.7.12 Linux archive, verify its published SHA-256, and lint both release workflow files.
5. Build and test normally, then perform the only combined-BFF release publish.
6. Verify both `HoaCommunityEvents.API.dll` and `wwwroot/index.html`.
7. Package `hoa-bff-${{ github.sha }}.tar.gz` and produce its `.sha256` manifest.
8. Upload artifact `hoa-bff-${{ github.sha }}` with `if-no-files-found: error` and `retention-days: 30`.

Acceptance: a successful CI run contains the exact artifact later eligible for staging, and no database work can precede artifact preservation.

## Task 2: Split trusted preparation, database authorization, and staging deployment

**File:** `.github/workflows/deploy-api-azure.yml`

### Prepare job

1. Keep the `workflow_run` guard restricted to a successful push to `main` from the same repository; keep manual dispatch restricted to `main`.
2. Grant only `actions: read` and `contents: read`.
3. Reject a `DEPLOY_SHA` that is not current `main`.
4. For a `workflow_run` event, use the exact triggering run ID. For manual dispatch, locate a successful push-triggered `CI` run for the exact current-main SHA.
5. Read back the selected run and verify workflow path, SHA, branch, event, completed/success state, head repository, and repository.
6. Download artifact `hoa-bff-<DEPLOY_SHA>` from that exact run.
7. Verify the SHA-256 manifest, extract the archive, and verify the API DLL and SPA entry point.
8. Expose only the verified SHA and CI run ID as job outputs.

### Database gate job

1. Depend on `prepare` and use Environment `production-database`.
2. Grant only `contents: read`.
3. Reject any migration mode other than `workflow` or `external`.
4. In `workflow` mode, check out the exact verified release SHA and set up .NET. Supply `AZURE_SQL_CONNECTION_STRING_PRODUCTION` only to the actual migration step, check it for emptiness there, and execute the reviewed EF migration.
5. In `external` mode, record in the job summary that the approved external migration is the release gate.

### Staging deploy job

1. Depend on both `prepare` and `database_gate` and use Environment `production`.
2. Grant only `actions: read`.
3. Validate the App Service name, slot-scoped publish profile, and required non-production slot.
4. Export the validated canonical slot once and pass exactly this value to Azure:

   ```yaml
   slot-name: ${{ env.SLOT_NAME_CANONICAL }}
   ```

5. Download `hoa-bff-<DEPLOY_SHA>` from the verified CI run, verify the digest and required files again, and deploy the extracted directory without `dotnet publish`.
6. Run only unauthenticated, non-mutating checks for `/health`, `/`, the SPA deep route, and `/api/security/csrf`; reject redirects and non-200 responses.
7. Do not add slot swap, production promotion, DNS, database, or Azure resource mutation steps.

Acceptance: the three jobs form `prepare -> database_gate -> deploy`, with distinct approvals and an unchanged, digest-verified CI artifact reaching staging.

## Task 3: Enforce the trust chain with dependency-free validation

**File:** `scripts/validate-production-workflow.mjs`

The validator must enforce:

- the trusted `workflow_run` main/success/push/repository guard;
- least-privilege permissions;
- current-main and exact successful-CI run verification;
- exact SHA artifact naming and exact run ID download;
- SHA-256 manifest generation and verification;
- API DLL and `wwwroot/index.html` checks;
- upload missing-file failure and 30-day retention;
- `prepare -> database_gate -> deploy` dependencies;
- distinct `production-database` and `production` Environments;
- SQL secret occurrence only on the conditional migration step;
- canonical staging slot usage;
- no deployment republish, upload, slot swap, or promotion;
- reviewed 40-character action pins; and
- actionlint validation of both workflow files.

Add mutation fixtures for each high-risk control and require every fixture to fail validation for the intended reason.

Acceptance: the real workflows pass, while mutations covering trust, permissions, artifact identity/digest/retention, job ordering/environments, secret scope, republishing, action pins, schema checking, redirects, and HTML checks are rejected.

## Task 4: Align documentation and verify

**Files:**

- `HoaCommunityEvents/README.md`
- `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`
- `HoaCommunityEvents/docs/superpowers/plans/2026-09-04-production-readiness.md`

Document immutable artifact promotion, both approval Environments, SQL secret scope, action pins, checksum-pinned actionlint, staging-only automation, one-instance SSE, and separately authorized human production promotion.

Run from the repository root:

```powershell
node scripts/validate-production-workflow.mjs
node --check scripts/validate-production-workflow.mjs
$actionlintVersion = '1.7.12'
$actionlintSha256 = '6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9'
$actionlintDir = Join-Path ([System.IO.Path]::GetTempPath()) ('hoa-actionlint-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $actionlintDir | Out-Null
gh release download "v$actionlintVersion" --repo rhysd/actionlint --pattern "actionlint_${actionlintVersion}_windows_amd64.zip" --dir $actionlintDir
$actionlintArchive = Join-Path $actionlintDir "actionlint_${actionlintVersion}_windows_amd64.zip"
if ((Get-FileHash -Algorithm SHA256 $actionlintArchive).Hash.ToLowerInvariant() -ne $actionlintSha256) { throw 'actionlint checksum mismatch' }
Expand-Archive $actionlintArchive (Join-Path $actionlintDir 'bin')
& (Join-Path $actionlintDir 'bin/actionlint.exe') .github/workflows/ci.yml .github/workflows/deploy-api-azure.yml
git diff --check 060f8766f6b7291d1267fef48ca65afe81c85dbf..HEAD
```

Do not rerun frontend tests unless frontend code changes. Backend compilation remains governed by exact-SHA Linux CI if the documented Windows NuGet TLS credential-provider failure persists.

Before committing, inspect the complete diff for accidental application changes, secret exposure, mutable action refs, deployment publishing, slot promotion, and Environment-name drift. After committing, rerun the validator, syntax check, terminology scans, and branch-range `git diff --check`.

## External checkpoints

1. Ask before pushing the release branch or opening a pull request; do not merge it.
2. Require exact-SHA GitHub CI to pass.
3. Have a repository administrator configure `production-database` and `production` with separate reviewers and correctly scoped variables/secrets.
4. Recover Azure access and verify the actual staging slot, runtime settings, health checks, one-instance constraint, database, backup, domain, and rollback operator.
5. Ask separately before any staging deployment or database execution.
6. Ask again before slot swap, production promotion, DNS cutover, or legacy-resource deletion.
