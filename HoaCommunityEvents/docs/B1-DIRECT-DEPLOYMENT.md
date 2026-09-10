# Deploy the combined HOA app on Basic B1

Reviewed against repository workflows on September 10, 2026. This is the current procedure, not proof that operational checks have passed. See [release status](RELEASE-STATUS.md) for dated results and exceptions.

## Deployment model

- Keep Basic B1 and one App Service instance. The SSE broker is process-local; multiple instances do not share attendance notices.
- One .NET 10 App Service serves React assets, `/api`, `/health`, and SPA deep links. No staging slot, tier upgrade, or slot swap.
- The legacy Static Web Apps workflow is removed. This does not delete the Azure resource or change DNS.
- CI builds the combined artifact once. Deployment consumes that exact artifact instead of rebuilding it.

## Source of truth

These paths are relative to the enclosing Git repository (`D:\dev\TigerTeam\Projects`):

| File | Responsibility |
| --- | --- |
| `.github/workflows/ci.yml` | Frontend/backend checks, combined publish, checksum, 30-day artifact retention |
| `.github/workflows/deploy-api-azure.yml` | Artifact selection, confirmation, preflight, database decision, deployment, smoke checks |
| `.github/actions/verify-release-freshness/action.yml` | Recheck current main and the exact trusted successful CI run |
| `scripts/validate-production-workflow.mjs` | Validate release controls and negative fixtures |
| `scripts/validate_azure_publish_profile.py` | Validate production-app profile identity without printing credentials |

## Release authorization

A main push starts CI. Successful CI can trigger artifact preparation, but **CI completion alone does not deploy production**. After explicit approval, the operator manually dispatches the deployment workflow on main with `approve_production=true`.

```text
prepare -> production_preflight -> database_gate -> deploy
```

The workflow verifies current-main SHA, successful push-triggered CI, source repository, artifact identity, checksum, API DLL, and `wwwroot/index.html`. Freshness is rechecked after gates and immediately before migration/deployment. If main advances or an artifact expires, stop and use a fresh trusted CI result.

The `production` and `production-database` Environments scope configuration. At the last recorded configuration review, the repository plan did not support independent required-reviewer enforcement. Do not describe those Environments as separate human approvals. Manual confirmation is the active gate; recheck actual protection settings before release.

## Required configuration

Never include secret values in source or documentation.

| Location | Name | Purpose |
| --- | --- | --- |
| `production` secrets | `AZURE_WEBAPP_NAME_PRODUCTION` | Production App Service name |
| `production` secrets | `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION` | Profile for that production app; not slot credentials |
| `production-database` variable | `PRODUCTION_MIGRATION_MODE` | Required: `workflow` or `external` |
| `production-database` secret | `AZURE_SQL_CONNECTION_STRING_PRODUCTION` | Required only for workflow migration mode |
| App Service | `ConnectionStrings__DefaultConnection` | Runtime SQL connection |
| App Service | `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret`, `Cloudinary__UploadFolder` | Image service configuration |
| App Service | `Seed__EnableBootstrap=false`, `Seed__EnableDemoData=false` | Disable production seeding |

Verify .NET 10, Production environment, HTTPS-only, Always On, `/health`, and one instance in Azure. Reading source alone cannot establish live settings.

## Before dispatch

1. Merge through a PR with required checks and obtain successful CI for the exact current-main revision.
2. Review database compatibility and compare target migration history with source. Code changes alone do not establish migration need.
3. Preserve a known-good package, checksum, and secure configuration record. CI artifacts expire after 30 days.
4. Review a recoverable database point and restoration procedure. A configured backup is not a tested restore. Record any waived rehearsal specifically for this release.
5. Verify app settings, profile identity, hosting constraints, monitoring, and rollback ownership.
6. Agree a maintenance window and approve the release. Direct deployment can interrupt requests. DNS changes and legacy-resource deletion need separate approval.

## Database decision

`workflow` mode restores/builds the EF startup project in Release, rechecks freshness, and runs the migration with `--configuration Release --no-build`. Only the migration step receives SQL credentials.

`external` mode acknowledges separately handled database review/execution. It does not automatically inspect migration history or apply migrations. Record the reviewed target state, including a no-migration-needed decision when appropriate. September 7 used external mode and skipped workflow migration.

## After deployment

Automated checks cover `/health`, root HTML, a deep-route HTML response, and `/api/security/csrf`. Retries are bounded; failure does not automatically roll back. September 7 installed the package successfully but failed the immediate smoke check; see the release record instead of assuming a red run means the old package remains deployed.

Using approved accounts and disposable data, verify login/current/logout, CSRF rejection/success, resident/admin permissions, persisted changes, image switches, Cloudinary upload, SSE/reconnect, and restart/session behavior. Confirm expected entry assets and inspect logs. Record each result as passed, failed, not performed, or explicitly waived. Mocked browser tests do not replace production integration checks.

## Recovery

Stop new changes, determine the running package, and obtain approval to redeploy a checksum-verified known-good ZIP directly to the same App Service. Published files must be at the ZIP root; a CI tar.gz is not a deployment ZIP. The normal workflow accepts current main only, so use a reviewed recovery procedure for older packages.

Handle database recovery separately; never blindly execute EF Down migrations. Restoring a former API-only package can also require compatible legacy frontend traffic. Keep recovery resources for the agreed window; DNS and deletion are separate actions.

## Repository control checks

Run from the Git root:

```powershell
node scripts/validate-production-workflow.mjs
python scripts/validate_azure_publish_profile.py --self-test
```

These checks validate source controls, not live Azure health, credentials, database recovery, or user flows.
