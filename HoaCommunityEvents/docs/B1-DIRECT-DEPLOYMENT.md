# HOA release on Basic B1

Updated 2026-09-04. User decision: retain B1 and remove staging. This supersedes the slot-based readiness document and implementation plans. No S1 upgrade, staging slot, or slot swap is required.

## Verified status

- Release PR: https://github.com/Victor-CS-Core/hoa-practice-project/pull/2. Direct-B1 revision `d07acfc` passed GitHub Actions CI run `33919378896`, including frontend and backend checks and combined publication. Each later merge must pass CI again.
- Subscription CS-Development (`63ff70e2-5f51-44e4-9f81-872b235bd537`), tenant `2f4f9a6a-e785-4cd5-bcc8-bd9d8c05ee96`, resource group `cs-dev-research`.
- `hoa-events-prod` on `hoa-events-plan`: Linux .NET 10, B1, one instance, HTTPS-only. Always On is enabled and `/health` configured. Keep B1 and one instance for the process-local SSE broker.
- Production database and Cloudinary settings exist; seed flags are false. SQL server `cs-research`, database `free-sql-db-1935027`, has seven-day backup retention, a 12-hour differential interval, and local redundancy. Successful restore has not been rehearsed.
- GitHub main requires a PR and both CI checks, including for admins; force pushes and deletion are disabled. Both release environments allow only main. The private repository's billing plan rejects required-reviewer Environment rules (API 422); environments therefore do not provide independent reviewer approval. The explicit manual workflow confirmation is the active release authorization gate. There is only one collaborator, so the PR rule requires zero additional approving reviews; adding an independent reviewer is a future governance decision.
- The production app name and identity-validated production publish profile are configured as Environment secrets. `production-database` uses `PRODUCTION_MIGRATION_MODE=external`, with no SQL secret copied to GitHub. Read-only production migration history matches all five source migrations through `20260611170153_AddImageZoomAndAvatarFocus`; there is no pending EF migration for this revision.
- The existing production package was downloaded to a local rollback ZIP (9,556,895 bytes, 75 entries), with API DLL/runtime configuration verified. SHA-256: `C8F3823D5835693F93E523CF430D6D6897F7666200890465EF553162C053D7EF`. This proves artifact availability, not a successful rollback rehearsal.
- Local master-admin smoke results: login/current/admin access 200; logout without CSRF 400; logout with CSRF 204; current-user after logout 401. Production still runs the former split deployment; no production code release has occurred.

## Workflow

CI tests both applications and publishes a single package containing the API DLL and `wwwroot/index.html`, with a SHA-256 manifest and 30-day artifact retention. PR builds validate GitHub's merge result; release requires the exact successful push-to-main CI artifact.

Automatic CI completion verifies the artifact only. Release requires manual dispatch on main with `approve_production=true`, after explicit approval of the production release and database decision. The chain is `prepare → production_preflight → database_gate → deploy`. Preflight is a configuration check, not a staging deployment. It validates a production publish profile matching the app and rejects slot credentials. There is no slot-name input or slot variable.

The `production` and `production-database` Environments restrict branch access and scope release configuration. Required reviewers are unavailable on the current billing plan; do not describe them as separate human approvals. Manual dispatch with explicit confirmation controls entry into the release chain. Current main and trusted CI are rechecked at each gate and immediately before mutation. The deployment uses the verified CI package directly on the existing production app. It can briefly interrupt requests.

## Required tasks before release

| Owner | Task | Acceptance |
| --- | --- | --- |
| Repository administrator | Require PR review and frontend/backend CI checks on main. | Protected main and green revised CI. |
| Release administrator | Main-only environments are configured. Retain explicit manual release confirmation; independent required-reviewer protection requires a supported GitHub plan. | No automatic production mutation after CI; actual gate capabilities accurately recorded. |
| Release administrator | Set `AZURE_WEBAPP_NAME_PRODUCTION` and `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION` in `production` for the production app. | Identity validation succeeds; no slot credential or slot variable needed. |
| Database owner | Set `PRODUCTION_MIGRATION_MODE` to `workflow` or `external`; provide `AZURE_SQL_CONNECTION_STRING_PRODUCTION` only for workflow mode. | Reviewed database responsibility and migration evidence. |
| Azure administrator | Retain B1; enable Always On and `/health` in an approved release window; verify .NET 10, HTTPS, Production environment, Cloudinary, connection string, and disabled seeding. | Configuration read-back and health checks. |
| Database owner | Compare migration history, review release SQL, and rehearse backup restoration and migration on an approved disposable database. | Verified recovery point, restore result, and target migration. Database copies may incur cost. |
| Release operator | Preserve the currently deployed known-good package, checksum, and configuration before replacement. | Accessible recovery artifact and rehearsed redeployment; do not assume old CI artifacts still exist. |
| Product/release owner | Agree maintenance window and one-origin URL; approve production release. | Approval before dispatch; separate approval for DNS or legacy deletion. |

Workflow migrations restore/build Release before the final freshness check and run with `--configuration Release --no-build`; only that migration step receives SQL credentials. External mode acknowledges separately reviewed migration execution; it does not inspect database history automatically.

## Verification and rollback

Complete local combined-build testing and hosted CI before release; there is no Azure staging phase. Automated checks after deployment verify `/health`, root HTML, SPA deep-route HTML, and `/api/security/csrf`. Then use approved test accounts/data for cookie login/current/logout, CSRF rejection/success, roles, toggles, Cloudinary, persisted writes, SSE/reconnect, restart behavior, and logs. A failed smoke check fails the run but does not automatically roll back.

Rollback requires separately authorized redeployment of the preserved known-good package directly to the same app:

```powershell
az webapp deploy --subscription 63ff70e2-5f51-44e4-9f81-872b235bd537 --resource-group cs-dev-research --name hoa-events-prod --src-path <verified-known-good-package.zip> --type zip
```

Verify the package checksum and identity. The ZIP must contain published files at its root; do not supply the CI tar.gz as a ZIP. The normal workflow accepts only current main, so use the reviewed recovery procedure for an older artifact. Redeployment can interrupt service.

Handle database recovery separately; never blindly run EF Down migrations. Review compatibility before release. For the first combined-app cutover, recovery to the old API can also require restoring compatible legacy frontend traffic. Keep `hoa-events-frontend-prod` for the agreed rollback window; its old workflow stays deleted. DNS cutover and resource deletion require separate approval.

Production readiness is still unproven until configuration, recovery/migration rehearsal, known-good rollback artifact, approval, and runtime smoke checks are complete. No production deployment or upgrade was performed as part of this workflow change.
