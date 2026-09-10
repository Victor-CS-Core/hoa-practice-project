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

## Deployment on Basic B1

The combined React/ASP.NET Core application deploys directly to the existing Azure App Service on B1. There is no staging slot, plan upgrade, or slot swap.

GitHub Actions CI tests both applications and packages the combined output with a SHA-256 manifest. Automatic CI completion verifies that artifact only. A production release requires manual dispatch on main with approve_production=true. The production and production-database Environments restrict branches and scope configuration; the current private-repository plan does not support required reviewers, so they do not provide independent human approval. The workflow validates the production publish profile, checks release freshness, and deploys the exact successful main CI artifact without republishing. Slot-scoped profiles are rejected.

The production Environment requires AZURE_WEBAPP_NAME_PRODUCTION and AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION. No slot variable is required. The database Environment requires PRODUCTION_MIGRATION_MODE (workflow or external); only workflow mode receives AZURE_SQL_CONNECTION_STRING_PRODUCTION in the migration step. Release restore/build occurs before the last freshness check, and EF executes with --configuration Release --no-build.

Direct deployment can briefly interrupt service. Smoke checks run against production after deployment. Recovery uses a verified previous package redeployed to the same app; preserve that artifact and review database compatibility before release. No automatic rollback or database reversal occurs.

See the [documentation index](docs/README.md), [B1 deployment runbook](docs/B1-DIRECT-DEPLOYMENT.md), and [dated release record](docs/RELEASE-STATUS.md) for current instructions and recorded verification limits. Production deployment, database migration, DNS cutover, and legacy deletion still require explicit approval.

## Architecture diagrams

- **Combined BFF, Clean Architecture, and storage:** [rendered SVG](docs/diagrams/platform-bff-clean-architecture.svg) · [rendered PNG](docs/diagrams/platform-bff-clean-architecture.png) · [Mermaid source](docs/diagrams/platform-bff-clean-architecture.mmd)
- **Cookie login/current/logout and CSRF sequence:** [rendered SVG](docs/diagrams/cookie-auth-csrf-sequence.svg) · [rendered PNG](docs/diagrams/cookie-auth-csrf-sequence.png) · [Mermaid source](docs/diagrams/cookie-auth-csrf-sequence.mmd)
- **SSE attendance invalidation sequence:** [rendered SVG](docs/diagrams/sse-attendance-invalidation-sequence.svg) · [rendered PNG](docs/diagrams/sse-attendance-invalidation-sequence.png) · [Mermaid source](docs/diagrams/sse-attendance-invalidation-sequence.mmd)

## Historical terminology

JWT stored by browser JavaScript, a SignalR event hub, and a separately hosted Static Web Apps frontend describe the former architecture only. They are not the current source design. Superseded implementation plans were removed from working documentation; Git history preserves them. The release record retains the useful decisions.
