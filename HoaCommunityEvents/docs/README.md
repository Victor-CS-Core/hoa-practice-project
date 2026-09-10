# HOA documentation

Reviewed September 10, 2026 against local source and workflow definitions. Live release evidence is explicitly dated; this was not a new cloud audit.

| Read this | Purpose |
| --- | --- |
| [Codebase guide](HOA-CODEBASE-GUIDE.md) | Technologies, source folders, security mechanisms, and request flows |
| [Presenter cheat sheet](PRESENTER-CHEAT-SHEET.md) | A meeting-length explanation of the architecture |
| [B1 deployment runbook](B1-DIRECT-DEPLOYMENT.md) | Prepare, approve, verify, and recover a combined-app release |
| [Recorded release status](RELEASE-STATUS.md) | Deployed, verified, failed, waived, and untested work |
| [Accessibility checkpoint](ACCESSIBILITY-RELEASE-CHECKPOINT.md) | Implemented fixes and remaining assessment limits |

## Diagrams

Each view in `diagrams/` has editable Mermaid (`.mmd`), SVG, and PNG versions:

- [Platform](diagrams/platform-bff-clean-architecture.svg): BFF, browser tools, backend layers, and storage. Connections show responsibilities, not exclusively project references.
- [Authentication](diagrams/cookie-auth-csrf-sequence.svg): login, current-user renewal, CSRF, and logout.
- [Attendance](diagrams/sse-attendance-invalidation-sequence.svg): SQL save, SSE notice, cache invalidation, and refetch.

When behavior changes, edit the Mermaid source and regenerate both exports together. Superseded migration/staging plans are no longer operating instructions; their useful decisions are summarized in the release record and guide.

## Project boundaries

Open `D:\dev\TigerTeam\Projects\HoaCommunityEvents` for the main app. The enclosing Git root is `D:\dev\TigerTeam\Projects`; `.github/` and `scripts/` live there. The [learning companion](https://hoa-community-events-codebase-guide.ktr0nn.chatgpt.site/) is a separate site. Editing these files does not republish it.
