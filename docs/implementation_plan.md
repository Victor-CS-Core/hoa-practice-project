# HOA Community Events MVP - Implementation Plan

Build the full-stack MVP described in [docs/agent_build_instruction_hoa_events_mvp.yaml](docs/agent_build_instruction_hoa_events_mvp.yaml) on top of [generated/HoaCommunityEvents](generated/HoaCommunityEvents).

## Budget Target: Under 80 Hours

Estimated implementation: 58-68 hours.
Reserved buffer: 10-15 hours.
Total target: 68-80 hours.

## Current Scaffold Baseline

Current scaffold status:

- Clean Architecture solution and project references exist and compile.
- Frontend Vite app compiles.
- Core business features are not implemented yet (auth, events CRUD, attendance, profile, SignalR workflows).

Implementation rule:

- Backend business logic stays in application services.
- No CQRS and no MediatR.
- Controllers remain thin.

## Scope Optimization

These constraints keep delivery inside budget while preserving MVP outcomes:

- Defer advanced pagination UI and metadata, but keep minimal server-side pagination support (`page`, `pageSize`) to avoid costly retrofit.
- Do not add Zod for MVP. Use React Hook Form plus backend FluentValidation.
- Use `sonner` for notifications instead of a custom toast system.
- Use URL-based image fields only in MVP (no upload pipeline yet).
- Use one profile page with inline edit mode.
- Keep one shared error page component.
- For SignalR, use React Query invalidation first, not manual cache patching.
- Keep attendee management in event details for MVP.

## Required Decisions Before Build

These decisions must be confirmed before feature coding:

- Database local strategy: SQL Server local instance, Docker SQL Server, or LocalDB.
- Admin seed identity for development.
- Frontend UI approach: custom Tailwind components only (recommended for speed).
- Runtime fallback: if net10 tooling is unstable in your environment, pin all backend projects to net9 immediately.

## Security and Configuration Rules

- Never commit real connection strings, token keys, or production credentials.
- Use environment variables or user-secrets for local sensitive values.
- Keep only template values in `.env.example`.
- Require admin password rotation for non-local environments.

## Delivery Strategy

Use vertical slices instead of large phase-only execution. Each slice ends with a passing verification gate.

## Execution Board

Use this board as the single source of truth for progress.

Status legend:

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked

State transition rules:

- Allowed transitions only: `[ ] -> [~] -> [x]` and `[!] -> [~]`.
- A slice cannot be marked `[x]` unless its verification gate passes.
- Only one slice may be `[~]` at a time.
- If a slice gate fails twice, mark it `[!]`, record blocker, and add mitigation before continuing.

Update cadence:

- Update this board at the end of each work session.
- Record actual hours and blockers immediately.
- Do not mark a slice done until its verification gate passes.

Agent execution constraints:

- Keep exactly one active slice and one active sub-task.
- Work in small edit batches, then validate immediately.
- Update `Gate Status` and `Notes` after each validation run.
- Do not start dependent slices before prerequisites are `[x]`.

### Slice Tracker

| Slice                                   | Status | Owner  | Depends On       | Est. Hours | Actual Hours | Gate Status | Notes                                                                                                             |
| --------------------------------------- | ------ | ------ | ---------------- | ---------: | -----------: | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Phase 0.5 - Environment and Foundations | [~]    | Victor | None             |        3-5 |          1.7 | In progress | Solution builds on net10; full local SQL Server selected and connectivity verified; secret loading still pending. |
| Slice A - Authentication                | [ ]    | Victor | Phase 0.5        |      10-12 |            0 | Not run     | Waiting for Phase 0.5 gate.                                                                                       |
| Slice B - Event Read                    | [ ]    | Victor | Slice A          |       8-10 |            0 | Not run     | Waiting for Slice A gate.                                                                                         |
| Slice C - Admin Event CRUD              | [ ]    | Victor | Slice B          |      10-12 |            0 | Not run     | Waiting for Slice B gate.                                                                                         |
| Slice D - Attendance and Realtime       | [ ]    | Victor | Slice B, Slice C |       8-10 |            0 | Not run     | Waiting for Slice B and C gates.                                                                                  |
| Slice E - Profile                       | [ ]    | Victor | Slice A          |        6-8 |            0 | Not run     | Waiting for Slice A gate.                                                                                         |
| Hardening and Release Readiness         | [ ]    | Victor | Slice A-E        |       8-10 |            0 | Not run     | Starts after all feature slices are done.                                                                         |

### Gate Checklist

- [ ] Phase 0.5 gate passed
- [ ] Slice A gate passed
- [ ] Slice B gate passed
- [ ] Slice C gate passed
- [ ] Slice D gate passed
- [ ] Slice E gate passed
- [ ] Hardening gate passed

### Blockers Log

| Date       | Slice | Blocker                   | Impact | Mitigation                          | Owner  | Status |
| ---------- | ----- | ------------------------- | ------ | ----------------------------------- | ------ | ------ |
| 2026-06-09 | N/A   | None currently identified | N/A    | Continue with Phase 0.5 gate checks | Victor | Closed |

### Decision Log

| Date       | Decision          | Options Considered                           | Chosen           | Why                                                                                                          | Owner  |
| ---------- | ----------------- | -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| 2026-06-09 | Runtime target    | net10, net9                                  | net10            | Current solution builds successfully on net10 in this environment.                                           | Victor |
| 2026-06-09 | Local DB strategy | SQL Server local, Docker SQL Server, LocalDB | SQL Server local | SQL Server default instance is installed/running and local Windows-auth connection was verified with sqlcmd. | Victor |

### Daily Session Checklist

- [ ] Select one active slice only.
- [ ] Define today's acceptance target before coding.
- [ ] Complete implementation tasks.
- [ ] Run the slice verification gate.
- [ ] Update status, actual hours, notes, and blockers.
- [ ] Update README run instructions if behavior changed.

### Naming and Conventions (Agent Guardrails)

- DTO classes end with `Dto`.
- Validator classes end with `Validator`.
- Service methods use `VerbEntityAsync` naming.
- Controllers do not access DbContext directly.
- Role names use centralized constants.
- Business-rule conflicts return HTTP 409.

### Recovery Protocol

If a slice stalls:

- Attempt 1: split the slice into smaller executable tasks and retry.
- Attempt 2: reduce non-essential scope while preserving MVP outcomes.
- Attempt 3: mark `[!]`, log blocker, and proceed with dependency-safe work.

## Phase 0.5 - Environment and Foundations (3-5h)

Goal: remove tooling and environment uncertainty before feature work.

Tasks:

- Confirm .NET SDK and fallback policy (`net10` or `net9`).
- Confirm DB connectivity and migration path.
- Define local secret loading approach.
- Replace template weather endpoint and wire base API infrastructure skeleton.
- Add solution-level runbook notes to [generated/HoaCommunityEvents/README.md](generated/HoaCommunityEvents/README.md).

Deliverables:

- Backend starts successfully.
- DB connection validated.
- Secret strategy documented.

Verification gate:

```bash
cd generated/HoaCommunityEvents
dotnet --info
dotnet build HoaCommunityEvents.slnx
```

Expected outcomes:

- `dotnet --info` completes and reports installed SDK details.
- `dotnet build` exits with code 0.

Runbook (copy/paste):

```bash
cd generated/HoaCommunityEvents
dotnet --info
dotnet build HoaCommunityEvents.slnx
```

## Slice A - Authentication Vertical Slice (10-12h)

Goal: complete register/login/current user with protected frontend route.

Backend tasks:

- Domain entities for users and roles.
- Persistence DbContext with Identity.
- Token service and auth application service.
- Auth endpoints: register, login, current user.
- Role assignment (`resident`, `hoa_admin`) and seed admin in development.

Frontend tasks:

- Auth store (`login`, `register`, `logout`, `getCurrentUser`).
- Login and register pages with React Hook Form.
- Route protection and redirect behavior.
- Axios token handling and 401 flow.

Verification gate:

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx
dotnet run --project API
# Swagger: register/login/current user

cd frontend
npm run build
```

Expected outcomes:

- Register/login/current-user endpoints succeed with expected auth behavior.
- Protected routes redirect unauthenticated users correctly.
- Build commands exit with code 0.

Runbook (copy/paste):

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx
dotnet run --project API

cd frontend
npm run build
```

## Slice B - Event Read Vertical Slice (8-10h)

Goal: public event listing and event detail with filter/sort and minimal pagination.

Backend tasks:

- Event and EventAttendance entities.
- Event query service (`list`, `details`) with category/status filtering and start-date sorting.
- Minimal pagination support (`page`, `pageSize`).
- Event DTOs and validators.

Frontend tasks:

- Event list page and detail page.
- Filter controls and query-string state.
- Query hooks for list/detail.

Verification gate:

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx

cd frontend
npm run build
npm run lint
```

Expected outcomes:

- Event list/detail endpoints return expected payload shape.
- Filter and sort behavior is reflected in API and UI.
- Build and lint commands exit with code 0.

Runbook (copy/paste):

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx

cd frontend
npm run build
npm run lint
```

## Slice C - Admin Event CRUD Vertical Slice (10-12h)

Goal: hoa_admin can create, edit, cancel, and delete events.

Backend tasks:

- Admin-only event mutation endpoints.
- Validation for create/edit.
- Conflict-safe status transitions.

Frontend tasks:

- Event create/edit form page.
- Admin-only controls on details page.
- Delete confirmation flow.

Verification gate:

- Confirm non-admin receives forbidden response on admin routes.
- Confirm event lifecycle transitions in Swagger and UI.

Expected outcomes:

- Non-admin requests to admin routes are denied.
- Admin create/edit/cancel/delete actions persist and reflect in UI.

Runbook (copy/paste):

```text
1. Login as non-admin and call admin endpoints -> expect forbidden.
2. Login as hoa_admin and perform create/edit/cancel/delete.
3. Verify list/details reflect lifecycle changes.
```

## Slice D - Attendance and Realtime Vertical Slice (8-10h)

Goal: residents can join/leave and all clients see live attendee count updates.

Backend tasks:

- Attendance join/leave endpoints with conflict rules:
  - already joined -> 409
  - full event -> 409
  - cancelled or ended event -> 409
  - leave when not joined -> 409
- SignalR hub and group methods.
- Broadcast updated attendee count from attendance service.

Frontend tasks:

- Join/leave actions.
- SignalR client hook for event room.
- React Query invalidation on attendee update event.

Verification gate:

- Two-tab realtime test for live count updates.
- Conflict scenarios verified in Swagger and UI.

Expected outcomes:

- Two-tab attendee counts stay synchronized via SignalR.
- Join/leave conflict scenarios return HTTP 409 with clear UI feedback.

Runbook (copy/paste):

```text
1. Open two tabs on the same event details page.
2. Join/leave in tab A and verify live count update in tab B.
3. Attempt duplicate/full/cancelled/ended joins and verify 409 behavior.
```

## Slice E - Profile Vertical Slice (6-8h)

Goal: users can view and edit own profile safely.

Backend tasks:

- Profile read endpoint by username.
- Profile edit endpoint for current user only.
- Validator for profile updates.

Frontend tasks:

- Profile page with inline edit mode.
- Update mutations and optimistic UI feedback.

Verification gate:

- User can edit own profile.
- User cannot edit another user profile.

Expected outcomes:

- Own profile updates persist and re-render.
- Cross-user profile edit attempts are blocked.

Runbook (copy/paste):

```text
1. Login as user A and edit user A profile -> expect success.
2. Attempt editing user B profile as user A -> expect forbidden/blocked.
```

## Hardening and Release Readiness (8-10h)

Goal: stabilize, verify, and document.

Tasks:

- Global exception middleware with consistent error contract.
- Swagger bearer auth setup and endpoint grouping.
- CORS policy finalization for local dev.
- Final pass on mobile responsiveness.
- Update [generated/HoaCommunityEvents/README.md](generated/HoaCommunityEvents/README.md) with exact run steps and environment variables.

Automated checks:

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx

cd frontend
npm run build
npm run lint
```

Expected outcomes:

- All automated checks exit with code 0.
- No unresolved high-severity blockers remain.

Runbook (copy/paste):

```bash
cd generated/HoaCommunityEvents
dotnet build HoaCommunityEvents.slnx

cd frontend
npm run build
npm run lint
```

Manual checklist:

- Auth: register, login, logout, token persistence.
- Events: list, detail, create/edit/cancel/delete (admin).
- Attendance: join/leave and all conflict rules.
- SignalR: two-tab attendee count sync.
- Profiles: view and edit own profile.
- Routing: protected routes and admin guards.
- Error UX: 401/403/404/500 handling.
- Responsive behavior on mobile and desktop.

## Risks and Mitigations

- SDK/runtime mismatch.
  - Mitigation: decide net10/net9 in Phase 0.5 and do not switch later.
- DB startup failures.
  - Mitigation: verify DB connectivity before first migration.
- Scope creep in frontend polish.
  - Mitigation: lock UX scope to MVP features until all slices pass.
- Realtime complexity.
  - Mitigation: start with simple invalidation model, no advanced client cache patching.

## Time Allocation Summary

| Workstream                              | Hours |
| --------------------------------------- | ----- |
| Phase 0.5 - Environment and Foundations | 3-5   |
| Slice A - Authentication                | 10-12 |
| Slice B - Event Read                    | 8-10  |
| Slice C - Admin Event CRUD              | 10-12 |
| Slice D - Attendance and Realtime       | 8-10  |
| Slice E - Profile                       | 6-8   |
| Hardening and Release Readiness         | 8-10  |
| Buffer                                  | 10-15 |
| Total                                   | 68-80 |

## Definition of Done

MVP is done when all are true:

- All slices pass their verification gates.
- Automated checks pass with no errors.
- Manual checklist passes.
- No sensitive values are committed.
- README runbook is complete and accurate.
