# Recorded production release and outstanding checks

Reviewed September 10, 2026. Observations below are from September 7; this documentation review did not redeploy or re-test production.

## Last recorded release

- [HOA application](https://hoa-events-prod-czd6cmg6fyhwcha7.eastus2-01.azurewebsites.net/).
- Revision `72a0b9f803c73e7356e741f7b9c12cee52ab07d1`.
- [Deployment run 34152344652](https://github.com/Victor-CS-Core/hoa-practice-project/actions/runs/34152344652).
- Combined React/ASP.NET Core artifact on Basic B1, one instance, no staging.
- Azure deployment succeeded. The overall run **failed** because the immediate smoke check received HTTP 404 responses. No automatic rollback occurred.
- Later independent basic checks passed. This is consistent with a startup transition, not proof of the exact cause of the earlier errors.

## Evidence and limits

| Area | Recorded result |
| --- | --- |
| Exact-main frontend/backend CI | Passed before release |
| Preparation, preflight, external database gate | Passed |
| Workflow EF migration | Skipped; external mode used |
| Later `/health`, `/`, deep route, `/api/security/csrf` | HTTP 200; page routes returned HTML |
| Entry assets | Matched expected artifact entries and returned 200 |
| Anonymous current-user / unknown API | HTTP 401 / JSON 404 |
| CSRF cookie | Secure and HttpOnly observed; values not recorded |
| Login page | Rendered in Chromium dark mode without page JavaScript errors |
| Authenticated production flows | Not performed: login/logout, writes, uploads, SSE, restart/session behavior |
| SQL restore rehearsal | Explicitly waived for this release, not passed |
| Screen-reader review | Explicitly waived for this release, not passed |
| DNS / legacy resource deletion | Not performed |

Local recorded tests were 49 frontend unit tests, 31 backend API tests, an earlier 37-test browser suite, and 19 focused accessibility/route tests after the final contrast change. These are dated results, not a fresh test run for today's checkout. Browser route mocks do not establish live SQL, Cloudinary, or SSE behavior.

## Follow-up work

1. Improve readiness polling to establish the new combined app's HTML/API readiness, not only a potentially earlier health response. Do not redeploy merely to turn a run green.
2. Run the approved authenticated smoke matrix in [the B1 runbook](B1-DIRECT-DEPLOYMENT.md#after-deployment).
3. Track accessibility gaps and the restoration waiver explicitly; reconsider them for each release.
4. Recheck cloud settings, branch protections, backup retention, and recovery artifacts before another release. Dated observations are not monitoring.
5. Obtain separate approval for custom-domain changes or legacy-resource retirement.

## Decisions retained from the completed migration

- Separate source folders; one same-origin BFF deployment.
- Identity cookies and CSRF instead of JavaScript-managed bearer credentials.
- Axios for HTTP; TanStack Query for cached server data.
- SSE for one-way attendance notices; shared messaging required before multi-process scale-out.
- Switches for persistent image settings, not destructive/workflow actions.
- Retain B1 and explicit direct-release approval. The earlier staging-slot proposal was rejected.

Obsolete execution plans and the JWT/SignalR architecture image were removed from working documentation on September 10. Earlier tracked versions remain in Git history. The current guide and runbook replace their instructions.
