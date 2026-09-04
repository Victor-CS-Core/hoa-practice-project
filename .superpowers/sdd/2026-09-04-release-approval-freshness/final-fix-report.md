# Final release-gate correction report

## Result

The single final fix wave closes all four whole-branch review findings without pushing, deploying, migrating a real database, or changing GitHub/Azure state.

## Design and files

- `.github/workflows/deploy-api-azure.yml`
  - Both protected staging-configuration checks parse the nonempty profile safely and prove its encoded deployment username matches the configured App Service plus canonical non-production slot.
  - Workflow migration restores and builds the API/EF project in Release before the final freshness check and without the SQL secret.
  - The immediately adjacent secret-bearing command uses `dotnet ef database update --configuration Release --no-build`.
- `scripts/validate_azure_publish_profile.py`
  - Uses Python stdlib `xml.etree.ElementTree`; it never logs XML, username, password, or secret values.
  - Mirrors Azure/webapps-deploy's identity rule: strip leading `$`, uppercase, split on `__`, compare app segment 0 and slot segment 1.
  - Rejects missing/empty inputs, malformed XML, wrong app, wrong slot, and production targets.
- `.github/workflows/ci.yml` and `scripts/validate-production-workflow.mjs`
  - CI runs the Python self-tests.
  - The structural contract enforces frontend install/lint/test/build, backend restore/build/test/publish/package verification/package/upload, exact workflow-scope `contents: read`, no job permission override, profile-validation wiring, EF preparation/order/flags, and protected-step adjacency.
  - The positive contract and 79 negative fixtures pass.
- `HoaCommunityEvents/README.md` and `HoaCommunityEvents/docs/PRODUCTION-DEPLOYMENT-READINESS-TASKS.md`
  - Describe structural profile identity proof precisely and retain live Azure ownership/slot existence as an external gate.
- `HoaCommunityEvents/docs/superpowers/plans/2026-09-04-production-readiness.md`
  - Prominently marks the older three-job plan superseded by the focused approval-freshness plan.

Reference implementation: <https://github.com/Azure/webapps-deploy/blob/master/src/ActionInputValidator/Validations.ts>.

## Verification

- Python self-tests: 7 tests passed (`OK`).
- Runtime synthetic valid-profile check: passed with only `Azure staging publish-profile identity validated.` printed.
- `node --check scripts/validate-production-workflow.mjs`: exit 0.
- `node scripts/validate-production-workflow.mjs`: `Production workflow contract and all 79 negative fixtures are valid.`
- actionlint v1.7.12: official Windows amd64 archive SHA-256 `6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9` matched GitHub release metadata; both changed workflows produced zero findings.
- Read-back: one SQL migration-secret reference, two publish-profile identity-validator invocations, Release restore/build precede the final database freshness check, and `--configuration Release --no-build` is on the adjacent migration step.
- `git diff --check`: passed after this report was added.

## Commit

This report is included in the correction commit. Its exact resulting SHA is reported in the agent handoff because embedding a Git commit's own SHA in that commit's contents would change the SHA.
