# HOA Community Events — Production Deployment Readiness Tasks

**Audit date:** 2026-09-04
**Repository:** `Victor-CS-Core/hoa-practice-project`
**Decision:** **NOT READY TO DEPLOY TO PRODUCTION**

The combined frontend/backend application is implemented locally, but the reviewed release hardening is on branch `release-combined-bff-readiness` and has not reached GitHub. Live Azure resources still run the former split deployment. Complete the P0 tasks below before merging the combined-BFF changes to `main`.

## 1. What is implemented locally

- The tracked source is organized under `HoaCommunityEvents/frontend` and `HoaCommunityEvents/backend`, with API, Application, Domain, Infrastructure, Persistence, and tests separated.
- `dotnet publish` builds the Vite frontend and puts its output in the published application's `wwwroot` directory.
- One ASP.NET Core process serves static frontend content, API routes, `/health`, and the SPA fallback from one origin.
- The frontend uses relative `/api` URLs and cookie credentials; cookie authentication, CSRF protection, and `/api/security/csrf` are implemented locally.
- SSE replaces SignalR for the current notification requirement.
- CI verifies both applications, runs the release-contract validator and a checksum-pinned actionlint v1.7.12, performs the only release publish, and checks `HoaCommunityEvents.API.dll` plus `wwwroot/index.html`.
- CI packages `hoa-bff-<commit SHA>.tar.gz` with a SHA-256 manifest and retains the exact SHA-addressed artifact for 30 days before any database job can run. Every third-party `uses:` action in the release workflows is pinned to a reviewed full commit SHA.
- The hardened release workflow prepares and verifies that exact successful-CI artifact, requires a `production`-protected non-mutating staging configuration preflight before the separate `production-database` approval, and then requires `production` protection again before deploying only to a staging slot. It revalidates release freshness after approvals and immediately before database mutation or staging deployment, verifies the digest and required files again before deployment, and runs unauthenticated, non-mutating smoke checks on that slot.
- The legacy Azure Static Web Apps workflow is deleted locally.

Relevant local commits include `060f876` (trusted-main combined deployment), `f2737d7` (combined publish), `798069e` and `00c53b8` (serve/package SPA), `7ecf94d`, `99dd8f3`, and `811fb87` (cookie/CSRF BFF authentication), and `4ac4d2a` (project consolidation). The reviewed hardening branch is `release-combined-bff-readiness`.

## 2. Evidence from this audit

| Area | Verified state | Result |
|---|---|---|
| Local Git | The prior audit found local `main` at `060f876`, 32 commits ahead of `origin/main`. The reviewed release hardening is on `release-combined-bff-readiness`. | Blocker: code and hardening must be reviewed and merged through GitHub. |
| GitHub `main` | The prior remote `main` was `6e8d301` from 2026-06-19 and still had old paths, API-only deployment, and a Static Web Apps workflow. | Blocker: remote CI/CD must represent the combined architecture. |
| GitHub release controls | Configure Environments `production-database` and `production` with separate required reviewers. The `production` Environment protects both staging preflight and staging deployment jobs; `production-database` protects the intervening database job. Put `PRODUCTION_MIGRATION_MODE` on the database Environment and `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` on the staging Environment. | Required before staging. |
| GitHub secrets | App Service name and slot-scoped publish-profile secret names existed in the audit; values are not inspectable. Keep `AZURE_SQL_CONNECTION_STRING_PRODUCTION` only in `production-database`; it is required only for workflow migration mode and injected only into the actual migration step. | Validate configuration without exposing values. |
| Live App Service | `/health` answered, while `/`, SPA routes, and `/api/security/csrf` returned 404 during the audit. | Blocker: live app is API-only. |
| Live Static Web App | The legacy frontend served browser JavaScript pointing to the separate API. | Blocker: production remains split. |
| Azure access | The current CLI identity could not see the HOA App Service, Static Web App, or SQL resources. | Blocker: resource and rollback controls are unverified. |
| Frontend verification | `npm ci`, lint, 49 Vitest tests, and production build passed during the audit. | Pass; bundle warning is non-blocking. |
| Backend verification | Fresh restore/test was blocked by Windows credential-provider TLS authentication. | Unverified; exact-SHA GitHub CI is mandatory. |

Audited public endpoints were the legacy frontend `https://blue-moss-0d503960f.7.azurestaticapps.net/` and API-only App Service `https://hoa-events-prod-czd6cmg6fyhwcha7.eastus2-01.azurewebsites.net/`.

## 3. Release strategy

Do not push a local `main` directly to remote `main`. Push the reviewed release branch, open a pull request, and require clean CI on the exact SHA. While the pull request is open, recover Azure access and prepare the App Service, database, backups, protected release settings, and slot.

The release workflow promotes the immutable artifact produced by the exact successful trusted `main` CI run; deployment never republishes it. An unprotected preparation job confirms current `main`, validates the exact CI run and artifact digest, and then the `production` Environment protects a non-mutating configuration preflight. Only after that preflight proves the App Service name, slot-scoped publish profile, and canonical non-production slot are configured can the distinct `production-database` Environment approve workflow migration or an external migration release gate. The release SHA and trusted CI run are checked after each approval and immediately before database mutation or staging deployment. After the database gate, `production` protects the actual staging deployment again. GitHub evaluates protection rules before each referencing job is sent to a runner, so both `production` jobs must independently pass those rules. The workflow stages to a non-production App Service slot only and never swaps the slot. These source checks do not prove that the live slot exists; Azure ownership and readiness remain an external gate. A separately authorized human performs production promotion and the full authenticated smoke matrix. DNS cutover, database migration, slot swap, and legacy-resource deletion each remain explicit approval boundaries.

This ordering matters: the old Static Web App expects the former API/authentication behavior, while the new backend requires same-origin cookies and CSRF. Replacing only one side can interrupt login and authenticated actions.

## 4. P0 — required before production

### P0.1 — Protect the release in GitHub

**Owner:** Repository administrator

- Push `release-combined-bff-readiness` (or its reviewed successor) to a release branch, not directly to `main`, and require `CI` to pass on the exact SHA.
- Create GitHub Environment `production-database` with a required database reviewer; the intervening database gate job must use it.
- On `production-database`, configure `PRODUCTION_MIGRATION_MODE` with only `workflow` or `external` allowed. In `workflow` mode, configure `AZURE_SQL_CONNECTION_STRING_PRODUCTION` there; only the conditional migration step receives it and checks it for emptiness without printing its value. In `external` mode, the approved database job records the reviewed external migration as the release gate before staging.
- Create a distinct GitHub Environment `production` with a required staging reviewer. GitHub evaluates its protection rules before each referencing job is sent to a runner: both the non-mutating staging configuration preflight and the later staging deployment must reference it and pass its rules.
- On `production`, configure `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` as a required variable naming a non-production staging slot. The workflow rejects it when empty or `production` (case-insensitive) and deploys only the canonical validated value.
- On `production`, configure secrets `AZURE_WEBAPP_NAME_PRODUCTION` and `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`; the publish profile must be scoped to the staging slot.
- Confirm the staging preflight proves the App Service name, slot-scoped publish profile, and canonical non-production slot are configured before `production-database` becomes eligible. This validation does not prove the live Azure slot exists; verify that through the separate Azure ownership/readiness gate.
- Confirm CI preserves `hoa-bff-<commit SHA>` with its SHA-256 manifest for 30 days and the deployment workflow selects the exact successful trusted run for current `main`.
- Confirm every protected job revalidates that release after approval, and that the database and deployment jobs revalidate again immediately before their mutation.
- Review every full-SHA action pin and the fixed actionlint release version/checksum when dependency updates are proposed.
- Confirm branch protection requires pull requests and CI on `main`, and confirm the deleted Static Web Apps workflow is included in the pull request.

**Acceptance:** The pull request is reviewable; exact-SHA CI passes and preserves the artifact; both `production` jobs independently pass Environment protection; the staging preflight blocks database eligibility until configuration is valid; database responsibility requires the intervening `production-database` approval; freshness is checked at every required boundary; and no configuration can silently target production or silently skip a required migration decision.

### P0.2 — Recover and verify Azure ownership

**Owner:** Azure subscription administrator

- Identify the tenant, subscription, resource group, App Service plan, Web App, SQL server/database, and legacy Static Web App owning the public endpoints.
- Grant the release operator least-privilege read/configuration access.
- Verify `AZURE_WEBAPP_NAME_PRODUCTION` identifies that App Service and obtain a fresh slot-scoped profile for `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`.
- Record resource names, owners, support contacts, and rollback operator in the release ticket; never put credentials in this document or source.

**Acceptance:** The operator can inspect configuration, deployment history, SQL status, and perform or reverse an approved release.

### P0.3 — Configure the combined App Service

**Owner:** Azure application administrator

- Configure .NET 10, HTTPS, `ASPNETCORE_ENVIRONMENT=Production`, `/health`, and Always On where supported.
- Keep one instance while the SSE broker is process-local; shared backplane/service is required before horizontal scaling.
- Verify the target serves the published ASP.NET Core output without rebuilding or overwriting `wwwroot`.
- Create and use a `staging` slot; mark environment-specific configuration as slot settings where appropriate.

**Acceptance:** The staging slot starts, remains healthy, serves `/` and a deep route, and answers `/health` from one hostname.

### P0.4 — Configure production settings and secrets

**Owner:** Azure application administrator

Verify nonempty App Service values: `ConnectionStrings__DefaultConnection`, `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret`, `Cloudinary__UploadFolder=hoa-events`, `Seed__EnableBootstrap=false`, and `Seed__EnableDemoData=false`. Verify no `AdminSeed__*` values, secure HTTPS cookie settings, and no old JWT or frontend API base URL dependency. Keep secrets in App Service settings, Key Vault, or GitHub Environment secrets only.

**Acceptance:** The staging slot starts without missing-configuration errors, authentication cookies are secure, and no seed/admin credential is exposed.

### P0.5 — Prepare and apply the database migration safely

**Owner:** Database administrator or release engineer

- Confirm the production Azure SQL database; take and verify a recoverable backup/restore point.
- Compare `__EFMigrationsHistory` with `backend/src/Persistence`; generate and review an idempotent SQL script or EF migration bundle from the exact release SHA; test it against a production-like restored database.
- Choose and record one execution path in the separately approved `production-database` job: `workflow` supplies the protected SQL secret only to the actual migration step; `external` records a reviewed script/bundle run by a controlled identity as the release gate before staging.
- Do not begin either path until the protected staging configuration preflight has succeeded. In workflow mode, reconfirm current `main` and the exact trusted CI run immediately before `dotnet ef database update`.
- Do not give normal application runtime credentials permanent schema-owner access merely for migrations.

**Acceptance:** Backup is verified, migration output is reviewed/tested, execution ownership is recorded, and the target reaches the expected migration without data loss.

### P0.6 — Make deployment slot-aware and preserve rollback evidence

**Owner:** DevOps engineer

- Use the required non-production value of `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` and a publish profile scoped to that slot.
- Preserve the exact combined publish artifact and SHA-256 manifest in CI for 30 days before database authorization. Download it from the selected successful CI run, verify the digest plus `HoaCommunityEvents.API.dll` and `wwwroot/index.html`, deploy it without republishing, and retain the prior production slot until the observation window closes.
- After the deployment job passes its own `production` protection rules, revalidate current `main` and the exact trusted CI run; repeat that check directly after configuration and artifact verification and before the Azure deployment action.
- The workflow's unauthenticated checks must pass at the staging slot: `GET /health` returns 200; `GET /` returns application HTML; `/events/release-readiness-check` returns SPA fallback HTML; and `GET /api/security/csrf` returns 200. These checks must not redirect, sign in, or mutate data.
- Do not swap slots from the workflow. Slot swap and every production-changing action require explicit approval.

This automation has no in-place fallback: if a non-production App Service slot is unavailable, stop and revise the reviewed release procedure under separate authorization. Do not point this workflow at production.

**Acceptance:** The release has a rehearsed, approval-gated promotion step and executable rollback before staging deployment begins.

### P0.7 — Decide and prepare the production URL

**Owner:** Product owner and Azure/DNS administrator

- Choose the App Service hostname or a custom domain.
- For a custom domain, configure DNS ownership, TLS, HTTPS redirect, and binding before cutover.
- Ensure one HTTPS origin serves React and `/api`; do not send browser users to the old Static Web App.

**Acceptance:** The approved URL returns the React entry page and `/api` from one HTTPS origin with cookies on that origin.

## 5. Production smoke-test matrix

Run the automated unauthenticated rows first against staging, then run the full matrix against production after authorized promotion. Use approved test accounts/data and do not alter real resident data.

| Test | Expected result |
|---|---|
| `GET /health` | HTTP 200 JSON from ASP.NET Core. |
| `GET /` | HTTP 200 React application, not API 404. |
| Direct deep frontend route | HTTP 200 SPA fallback; intended page renders. |
| `GET /api/security/csrf` | HTTP 200; establishes expected CSRF/session prerequisites. |
| Approved test-account sign-in | Secure HttpOnly authentication cookie; no JWT in browser storage. |
| `GET /api/account/current` after sign-in | HTTP 200 expected user and roles. |
| Protected write without/current CSRF token | Rejected without token; succeeds and persists exactly once with current token. |
| Role-restricted routes | Unauthorized role gets 403; authorized role succeeds. |
| Event/profile banner toggle | Persists and UI reflects state. |
| Cloudinary banner upload/display | Upload returns reference and image renders. |
| SSE live update | Expected event arrives without refresh; reconnect works. |
| Application restart | Cookie lifetime behavior is correct and health returns 200. |
| Logs and telemetry | No connection-string, CSRF, cookie, migration, static-file, or unhandled exceptions. |

## 6. Cutover and rollback

### Cutover

1. Freeze unrelated production changes.
2. Confirm release SHA, exact successful CI run, preserved artifact digest, backup, migration decision, slot settings, and separate `production-database` and `production` reviewer approvals.
3. Complete the approved database gate, deploy the unchanged CI artifact to staging, and complete the automated staging checks plus approved staged verification.
4. Obtain separate explicit approval, then have the authorized human promote/swap the slot.
5. Run the full production smoke matrix and monitor health, HTTP errors, authentication, database, Cloudinary, and SSE through the observation window.

### Rollback

- With slots, the authorized operator swaps the previous production slot back.
- Without slots, redeploy the recorded known-good artifact under the approved recovery procedure.
- Treat database rollback separately; never blindly run EF `Down` migrations because reversal can lose data.
- Restore the legacy frontend route only if compatible with the backend being restored.
- Record reason, time, release SHA, database state, and operator actions.

## 7. P1 — complete immediately after cutover

- Keep the legacy Static Web App only for the agreed rollback window; keep its workflow disabled and keep normal user traffic away from it.
- After the rollback window, export required history/configuration and delete the legacy resource only with explicit approval.
- Update `docs/HOA-CODEBASE-GUIDE.md`, the companion learning site, and external links with the verified topology and production URL.
- Establish Application Insights alerts for health, HTTP 5xx, authentication, dependency/database failures, and abnormal SSE disconnects.
- Track Vite chunk optimization as performance work and replace process-local SSE with a shared backplane before scaling out.

## 8. Definition of ready

Production is ready only when the combined BFF is in a reviewed pull request with exact-SHA CI; CI preserves a digest-verified SHA-addressed artifact; all action pins and the actionlint checksum are reviewed; GitHub has distinct protected Environments `production-database` and `production`; the slot, scoped publish profile, migration decision, resources, runtime, app settings, HTTPS, health, and SSE one-instance constraint are verified; backup and reviewed migration are complete; the slot promotion and rollback procedure is approval-gated; one-origin URL is ready; the smoke matrix passes before and after promotion; and prior artifact/database recovery remains available through observation.

## References

- [Deploy to Azure App Service with GitHub Actions](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [Set up Azure App Service staging environments](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots)
- [Apply EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying)
