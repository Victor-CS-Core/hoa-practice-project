# HOA Community Events

HOA Community Events is a resident and administrator portal for publishing community events, managing attendance, and maintaining member profiles. The production design is one ASP.NET Core **Backend for Frontend (BFF)**: it serves the React application and the `/api` routes from the same origin.

For a professor-style walkthrough, start with [The HOA Codebase Guide](docs/HOA-CODEBASE-GUIDE.md). For a meeting, use the [Presenter Cheat Sheet](docs/PRESENTER-CHEAT-SHEET.md).

## What the platform does

- Residents sign in, browse events, join or leave an event, and edit their profile.
- HOA administrators create, edit, publish, cancel, and delete events; inspect attendees; and manage users.
- Attendance changes produce an authenticated server-sent event (SSE) notice so open event pages refetch current data.
- Event, attendance, account, role, profile, image-URL, and crop-position records live in SQL Server or Azure SQL.
- Image files live in Cloudinary. The database stores their URLs and presentation metadata, not their bytes.

## Technology at a glance

| Area | Technology | Responsibility |
| --- | --- | --- |
| Browser UI | React 19, TypeScript 6, React Router, MobX | Pages, navigation, and current-session UI state |
| Server-state | TanStack Query | Fetch lifecycle, cache, loading/error state, and invalidation |
| HTTP transport | Axios | Relative URLs, JSON requests/responses, cookies, errors, and the CSRF header |
| Build | Vite 8 | Development server and optimized production assets |
| Web host/BFF | ASP.NET Core on .NET 10 | Static SPA hosting, API, cookies, CSRF, policies, middleware, and SSE |
| Data access | EF Core 10 | LINQ queries, change tracking, SQL commands, and migrations |
| Structured storage | SQL Server locally; Azure SQL in Azure | Identity tables, roles, events, attendance, profiles, image URLs, and crop values |
| Media storage | Cloudinary | Uploaded avatar, profile-banner, and event-banner image files |
| Tests | xUnit, WebApplicationFactory, Vitest, Playwright | Backend integration, frontend unit/component, and browser-flow checks |

## Repository structure

```text
HoaCommunityEvents/
  backend/
    HoaCommunityEvents.slnx
    src/
      API/              HTTP host, controllers, middleware, endpoint mapping
      Application/      DTOs, validators, service contracts, realtime contracts
      Domain/           Business entities and role constants
      Infrastructure/   Identity, event, attendance, profile, Cloudinary, SSE implementations
      Persistence/      EF Core DbContext, migrations, and seed logic
    tests/
      API.Tests/        In-process integration and broker tests
  frontend/
    src/main.tsx        Browser entry point and top-level providers
    src/app/            Router, layout, Axios client, MobX store, QueryClient
    src/features/       Product pages and feature components
    src/hooks/          TanStack Query and SSE hooks
    src/components/     Design-system and shared UI components
    src/types/          Browser-side API shapes
    tests/e2e/          Playwright browser flows and API mock
  docs/
    HOA-CODEBASE-GUIDE.md
    PRESENTER-CHEAT-SHEET.md
    diagrams/           Mermaid sources plus rendered SVG and PNG diagrams
```

This is pragmatic Clean Architecture. `Application` defines the contracts; `Infrastructure` implements them; `Persistence` owns EF Core; `API` wires and exposes everything; and `Domain` holds the core data model. `AppUser` inherits ASP.NET Core Identity's `IdentityUser`, so the Domain project deliberately references the ASP.NET Core shared framework.

## Request shape

```text
React page
  -> TanStack Query hook
  -> Axios agent
  -> ASP.NET Core middleware and controller
  -> Infrastructure service
  -> EF Core
  -> Azure SQL
```

Axios and TanStack Query are not duplicate request libraries here. Axios is the transport layer; TanStack Query manages the lifecycle and cache of data that came from the server. Replacing Axios with a new `fetch` wrapper during this migration would add churn without removing TanStack Query, so both remain intentionally.

## Security model

- ASP.NET Core Identity issues the encrypted `HoaCommunityEvents.Auth` cookie after registration or login.
- The cookie is `HttpOnly`, `SameSite=Lax`, secure outside Development, and has an eight-hour sliding lifetime.
- JavaScript never reads or stores the authentication credential. The browser sends the cookie automatically.
- `GET /api/account/current` reconstructs the UI session from server-validated identity data.
- Unsafe controller requests require a matching antiforgery cookie and `X-CSRF-TOKEN` header.
- `AdminOnly` and `ResidentOrAdmin` policies are evaluated by ASP.NET Core authorization before protected actions run.
- Failed sign-ins lock an account for 15 minutes after five attempts. Global, authentication, and upload-signature rate limits are also configured. Because rate limiting currently runs before cookie authentication, the upload-signature limiter's effective partition is the remote IP.

The exact implementation is in:

- `backend/src/API/Extensions/IdentityServiceExtensions.cs`
- `backend/src/API/Extensions/ApplicationServiceExtensions.cs`
- `backend/src/API/Controllers/AccountController.cs`
- `backend/src/API/Controllers/SecurityController.cs`
- `frontend/src/app/api/agent.ts`
- `frontend/src/app/stores/authStore.ts`

## Realtime attendance

`GET /api/events/{eventId}/stream` is an authenticated SSE stream. Before allocating a broker subscription, the endpoint verifies that the event exists and is visible to the caller; an unknown or hidden event returns JSON 404. After a successful attendance database commit, `AttendanceService` publishes an `attendance-changed` notice to the in-memory broker. The browser's native `EventSource` receives the notice and `useEventStream.ts` invalidates the event, event-list, and attendee query keys. TanStack Query then refetches the authoritative JSON.

The broker is process-local. Production must remain at one API instance until a shared backplane or managed realtime service is introduced. Raw WebSockets, SignalR, or polling are credible alternatives; the detailed trade-offs are in the codebase guide.

## Image controls and storage

The profile avatar, profile banner, and event banner use the reusable accessible switch in `frontend/src/components/design-system/ui/switch.tsx`. Turning a switch off clears its URL, resets crop values, clears pending upload feedback, and omits the image fields from the browser submission. The API therefore saves no image URL and removes a replaced owned Cloudinary asset when appropriate.

There is no Azure Blob Storage integration in this repository. Azure SQL stores structured data and Cloudinary stores user-uploaded image bytes. Published Vite files are packaged with the App Service application; they are application assets, not user media.

## Local development

Prerequisites: .NET 10 SDK, Node.js 22+, npm, and SQL Server/LocalDB.

From `HoaCommunityEvents/`, configure the local database connection:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<development SQL Server connection>" --project backend/src/API
dotnet ef database update --project backend/src/Persistence --startup-project backend/src/API
```

Cloudinary is optional for browsing and event management. To test uploads, also set `Cloudinary:CloudName`, `Cloudinary:ApiKey`, and `Cloudinary:ApiSecret` as user secrets.

Run the API with its HTTPS profile:

```bash
dotnet run --project backend/src/API --launch-profile https
```

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. `frontend/vite.config.ts` proxies `/api` and `/health` to `https://localhost:7011`, so browser cookies still appear same-origin during development.

Useful local endpoints:

- API health: `https://localhost:7011/health`
- Swagger in Development: `https://localhost:7011/swagger`
- CSRF bootstrap: `https://localhost:7011/api/security/csrf`

## Build and test

Backend:

```bash
dotnet restore backend/HoaCommunityEvents.slnx
dotnet build backend/HoaCommunityEvents.slnx --no-restore
dotnet test backend/HoaCommunityEvents.slnx --no-build
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

Combined production artifact:

```bash
dotnet publish backend/src/API/HoaCommunityEvents.API.csproj -c Release -o ./publish
```

The publish target runs a clean frontend install and build, then copies `frontend/dist/**` into the published app's `wwwroot`. ASP.NET Core serves static assets and returns `index.html` for non-API deep links. Unknown `/api/**` routes remain JSON 404 responses.

## Deployment status and cutover gate

- `.github/workflows/ci.yml` builds/tests both applications and verifies the combined publish contains `wwwroot/index.html`.
- `.github/workflows/deploy-api-azure.yml` stages the combined BFF to an **Azure App Service staging slot** after `CI` succeeds for a trusted `main` push in this repository. Pull-request, fork, failed, and cancelled CI runs cannot trigger deployment. A successful workflow never swaps a slot into production.
- The workflow checks out the exact commit that passed CI, not a later branch tip. It rejects stale commits and queues up to 100 pending production runs without replacing waiting deployments or cancelling an in-progress migration or deployment.
- Manual runs remain available through **Actions → Deploy HOA BFF to Azure App Service → Run workflow**. Select `main`; the current `main` commit must already have a successful push-triggered `CI` run. Manual dispatch does not bypass the CI gate or the protected GitHub Environment.
- Configure the GitHub Environment named `production` with a required reviewer. The deploy job uses that Environment, so staging deployment is approval-gated.
- One `dotnet publish` builds the API and Vite frontend together. The workflow verifies both `HoaCommunityEvents.API.dll` and `wwwroot/index.html`, retains the exact combined artifact for 30 days, then sends that folder only to the configured staging slot.
- The workflow runs only non-mutating, unauthenticated smoke checks against the staged URL: `/health`, `/`, a SPA deep route, and `/api/security/csrf`. It does not sign in or write application data.
- The historical frontend-only Static Web Apps workflow has been removed. No workflow uploads the migrated frontend alone to the old Static Web Apps origin. This source change does **not** delete the existing Azure Static Web Apps resource or change its domain.

Required GitHub Environment configuration:

| Variable or secret | Purpose |
| --- | --- |
| `AZURE_WEBAPP_SLOT_NAME_PRODUCTION` | Required Environment variable naming the staging slot. It must be nonempty and must not be `production`. |
| `PRODUCTION_MIGRATION_MODE` | Required Environment variable. It must be exactly `workflow` or `external`. |
| `AZURE_WEBAPP_NAME_PRODUCTION` | Secret naming the existing Azure App Service application. |
| `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION` | Secret containing a publish profile scoped to the staging slot. |
| `AZURE_SQL_CONNECTION_STRING_PRODUCTION` | Required secret only when `PRODUCTION_MIGRATION_MODE` is `workflow`; it is used to apply the reviewed migration before staging deployment. |

When `PRODUCTION_MIGRATION_MODE` is `external`, the workflow does not run a migration: a separately verified database migration is an explicit release gate before slot promotion. It never silently skips migration because a secret is missing.

The workflow migration secret is supplied only to the migration step. It does not configure the application's runtime database connection. App Service still needs its own `ConnectionStrings__DefaultConnection`, Cloudinary settings, Production environment, and .NET 10 runtime. Keep `Seed__EnableBootstrap` and `Seed__EnableDemoData` false. Keep one API instance until the process-local SSE broker is replaced with a shared backplane. GitHub's token has only repository-content and Actions read permissions; the publish profile provides the separate Azure deployment authority.

**Release gate:** once these workflow changes are pushed to GitHub's default branch, a successful trusted `main` CI run can stage the exact artifact after Environment approval. Before staging, confirm the target, slot-scoped publish profile, secrets, database backup/migration readiness, and release authority. A human-authorized slot swap and the full authenticated smoke matrix complete production cutover. Coordinate BFF login/current/logout, role, CSRF, deep-link, Cloudinary, database, and SSE smoke tests before switching the client-facing domain. Publishing source changes is not itself a slot swap, DNS change, or retirement of the old Azure resource.

## Architecture diagrams

- **Combined BFF, Clean Architecture, and storage:** [rendered SVG](docs/diagrams/platform-bff-clean-architecture.svg) · [rendered PNG](docs/diagrams/platform-bff-clean-architecture.png) · [Mermaid source](docs/diagrams/platform-bff-clean-architecture.mmd)
- **Cookie login/current/logout and CSRF sequence:** [rendered SVG](docs/diagrams/cookie-auth-csrf-sequence.svg) · [rendered PNG](docs/diagrams/cookie-auth-csrf-sequence.png) · [Mermaid source](docs/diagrams/cookie-auth-csrf-sequence.mmd)
- **SSE attendance invalidation sequence:** [rendered SVG](docs/diagrams/sse-attendance-invalidation-sequence.svg) · [rendered PNG](docs/diagrams/sse-attendance-invalidation-sequence.png) · [Mermaid source](docs/diagrams/sse-attendance-invalidation-sequence.mmd)

## Historical terminology

JWT stored by browser JavaScript, a SignalR event hub, and a separately hosted Static Web Apps frontend describe the former architecture only. They are not the current source design. Historical implementation plans under `docs/superpowers/` retain those words solely to record the migration.
