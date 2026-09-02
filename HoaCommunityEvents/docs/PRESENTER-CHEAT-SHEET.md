# HOA Community Events presenter cheat sheet

Use this during the meeting. Use [HOA-CODEBASE-GUIDE.md](HOA-CODEBASE-GUIDE.md) when you need the full mechanism or source trail.

Paths are relative to `HoaCommunityEvents/` unless they begin with `.github/`, which is relative to the enclosing Git repository root.

## One-sentence description

HOA Community Events is a React and ASP.NET Core platform where residents manage event attendance and profiles, administrators manage events and users, Azure SQL stores structured records, Cloudinary stores image files, and authenticated SSE notices keep open event pages current.

## Architecture in 20 seconds

```text
React page
  -> TanStack Query manages server state
  -> Axios sends same-origin HTTP and CSRF headers
  -> ASP.NET Core BFF serves the SPA and /api
  -> controller calls an Infrastructure service
  -> EF Core reads/writes Azure SQL

Browser -> Cloudinary directly for signed image uploads
ASP.NET Core -> browser through SSE for attendance-change notices
```

Diagram: [rendered SVG](diagrams/platform-bff-clean-architecture.svg) · [rendered PNG](diagrams/platform-bff-clean-architecture.png) · [Mermaid source](diagrams/platform-bff-clean-architecture.mmd)

## Five-minute talk track

### 0:00–1:00 — Product

“The platform serves two roles. Residents sign in, browse community events, join or leave, and edit their profiles. HOA administrators manage event status, attendees, and users. The browser experience is React; trusted rules and data access stay in ASP.NET Core.”

### 1:00–2:00 — Structure

“The backend uses pragmatic Clean Architecture. API handles HTTP, Application defines DTOs, validators, and interfaces, Domain contains users/events/attendance and role names, Infrastructure implements the use cases, and Persistence owns EF Core and migrations. The frontend is feature-oriented under `src/features`, with app plumbing under `src/app` and server-state hooks under `src/hooks`.”

### 2:00–3:00 — Security

“Identity verifies the password and issues an encrypted HttpOnly cookie. The browser sends it automatically, authentication middleware reconstructs the claims principal, and authorization middleware checks named role policies before protected actions run. The frontend never stores the credential. All writes require a CSRF request token header paired with an HttpOnly antiforgery cookie.”

### 3:00–4:00 — Data and live updates

“Azure SQL stores identity, roles, events, attendance, profile data, image URLs, and crop values. Cloudinary stores the actual image bytes. Attendance uses SSE as a small ‘data changed’ notice. EventSource receives it, TanStack Query invalidates three cache keys, and the UI refetches authoritative JSON.”

### 4:00–5:00 — Build, tests, delivery

“Vite gives us the development server and optimized browser build. During `dotnet publish`, the API project runs the Vite build and puts it in `wwwroot`, producing one App Service artifact and origin. WebApplicationFactory tests real backend middleware and cookies, Vitest covers browser logic/components, and Playwright covers user journeys. A normal `main` merge still auto-deploys the frontend to the API-less legacy Static Web Apps origin, so release authority, BFF staging, smoke tests, workflow freeze, and domain switching must be coordinated before the merge.”

## Know these folders

| Folder | Say this |
| --- | --- |
| `backend/src/API` | “HTTP host: Program, middleware, controllers, policies, SSE route.” |
| `backend/src/Application` | “Boundary contracts: DTOs, validators, interfaces, event-update record.” |
| `backend/src/Domain` | “Persistent business concepts and role constants.” |
| `backend/src/Infrastructure` | “Concrete Identity, event, profile, attendance, Cloudinary, and SSE logic.” |
| `backend/src/Persistence` | “EF Core DbContext, database relationships, migrations, and seed logic.” |
| `backend/tests/API.Tests` | “In-process integration and broker tests.” |
| `frontend/src/main.tsx` | “Browser entry point: creates the React root and installs top-level providers.” |
| `frontend/src/app` | “Router, layout, Axios, MobX session UI state, and QueryClient.” |
| `frontend/src/hooks` | “TanStack Query operations and EventSource invalidation.” |
| `frontend/src/features` | “Pages and components organized by product feature.” |
| `frontend/src/components/design-system` | “Reusable accessible controls and design tokens.” |
| `frontend/tests/e2e` | “Playwright user flows with cookie/CSRF-aware API mocks.” |

## Security flow

```text
GET /api/security/csrf
  -> server stores antiforgery cookie
  -> returns request token JSON

POST /api/account/login
  -> Axios attaches X-CSRF-TOKEN
  -> browser attaches antiforgery cookie
  -> Identity verifies password hash
  -> builds user and role claims
  -> protects authentication ticket
  -> Set-Cookie HoaCommunityEvents.Auth, HttpOnly

GET /api/account/current
  -> browser attaches auth cookie
  -> UseAuthentication validates/unprotects it
  -> UseAuthorization checks policy
  -> current UserDto restores MobX state

POST /api/account/logout
  -> cookie plus CSRF pair
  -> SignOutAsync expires auth cookie
  -> MobX and TanStack caches clear
```

Point to:

- `backend/src/API/Extensions/IdentityServiceExtensions.cs`
- `backend/src/API/Controllers/AccountController.cs`
- `backend/src/Infrastructure/Services/Identity/AccountService.cs`
- `backend/src/API/Controllers/SecurityController.cs`
- `frontend/src/app/api/agent.ts`
- `frontend/src/app/stores/authStore.ts`

Diagram: [rendered SVG](diagrams/cookie-auth-csrf-sequence.svg) · [rendered PNG](diagrams/cookie-auth-csrf-sequence.png) · [Mermaid source](diagrams/cookie-auth-csrf-sequence.mmd)

## Middleware order

```text
Development Swagger/OpenAPI
-> exception handling
-> HTTPS redirection
-> default/static files
-> CORS
-> rate limiting
-> authentication
-> authorization
-> controllers and SSE
-> health
-> JSON /api catch-all
-> React index.html fallback
```

Best explanation: “Middleware is an ordered chain of gates. Authentication establishes who the caller is; authorization then decides whether that identity can enter the selected endpoint.”

The ordering changes the upload limiter's behavior: although its partition callback tries the authenticated name first, rate limiting runs before cookie authentication reconstructs the user. The effective upload-signature partition is therefore the remote IP; endpoint authentication still runs before a signature can be returned.

## Axios versus TanStack Query

| Axios | TanStack Query |
| --- | --- |
| Builds URL, method, params, and body | Decides when a server operation runs |
| Sends HTTP and parses JSON | Tracks loading, errors, and cached data |
| Exposes HTTP errors | Identifies data with query keys |
| Runs the CSRF request interceptor | Invalidates/refetches after writes or SSE |
| Requests cookies through browser credentials | Shares server snapshots across components |

Answer: “They are layers, not substitutes. TanStack Query needs a promise-returning transport; Axios is that transport. Axios alone does not provide the query cache. Replacing Axios with a new fetch wrapper during this migration would be churn, so the minimal correct decision is to keep both.”

Exact trace:

```text
EventDetailsPage
-> useEvent(id)
-> query key ['event', id]
-> Events.detail(id)
-> Axios GET /api/events/{id}
-> EventsController
-> EventService
-> EF Core / Azure SQL
-> EventDto JSON
-> Axios response.data
-> TanStack cache
-> React render
```

## SSE flow and limitation

```text
EventDetailsPage opens EventSource
-> GET /api/events/{id}/stream with cookie
-> broker creates one bounded channel subscription

Join/leave commits in SQL
-> AttendanceService publishes attendance-changed
-> broker fans out by event ID
-> EventSource listener receives notice
-> invalidates event, events, attendees query keys
-> event detail/list refetch through EventsController
-> enabled admin attendee-list refetch through AttendanceController
```

Important details:

- Publish occurs only after `SaveChangesAsync` succeeds.
- The stream carries an invalidation notice, not the complete attendee list.
- A bounded capacity-one drop-oldest channel prevents a slow client from blocking attendance.
- EventSource reconnects automatically; a reconnect invalidates all three keys to recover missed notices.
- Browser disconnect cancels the server stream and removes the subscription.
- The broker is process-local, so use one API instance until a shared backplane/managed service is added.

Alternatives: polling for maximum simplicity, raw WebSockets for custom two-way traffic, SignalR for higher-level .NET hubs, or Azure Web PubSub/managed SignalR for distributed connections.

Diagram: [rendered SVG](diagrams/sse-attendance-invalidation-sequence.svg) · [rendered PNG](diagrams/sse-attendance-invalidation-sequence.png) · [Mermaid source](diagrams/sse-attendance-invalidation-sequence.mmd)

## Storage answer

| Store | What it holds |
| --- | --- |
| Azure SQL | Accounts, password hashes, security stamps, roles, events, attendance, profile text, image URLs, crop positions, zoom |
| Cloudinary | Avatar, profile-banner, and event-banner image bytes and delivery URLs |
| App Service publish artifact | React HTML, JavaScript, CSS, and static application assets |

Answer: “No Azure Blob Storage integration exists in this codebase. Azure SQL stores structured records and media metadata. Cloudinary stores user-uploaded images.”

## Image upload and switch answer

Upload:

```text
Browser asks API for signed parameters
-> API authenticates, rate-limits, and signs with server-only Cloudinary secret
-> browser uploads image bytes directly to Cloudinary
-> Cloudinary returns secure URL
-> browser submits URL and crop values to API
-> EF Core stores those values in SQL
```

Switch:

“The reusable control is a button with `role=switch`, `aria-checked`, native keyboard behavior, disabled behavior, and focus styling. Turning it off clears URL/crop/file/feedback state and causes optional image properties to be omitted. The server saves no image URL and attempts cleanup of the replaced owned Cloudinary asset.”

Point to:

- `frontend/src/components/design-system/ui/switch.tsx`
- `frontend/src/features/profiles/components/ProfileEditForm.tsx`
- `frontend/src/features/events/components/AdminEventForm.tsx`
- `backend/src/API/Controllers/UploadsController.cs`
- `backend/src/Infrastructure/Services/CloudinaryAssetService.cs`

## Vite and production bundle answer

“In development, Vite starts from `index.html`, serves browser modules, and proxies `/api` and `/health` to .NET so cookies stay same-origin. In production, TypeScript is type-checked and Vite walks the import graph, splits lazy routes, and emits optimized hashed files to `dist`. The API project's publish target runs that build and copies it into `wwwroot`. ASP.NET serves those files; unknown non-API routes return `index.html`, while unknown `/api` routes return JSON 404.”

Point to:

- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/app/router/routes.tsx`
- `backend/src/API/HoaCommunityEvents.API.csproj`
- `backend/src/API/Program.cs`

## Test answer

“WebApplicationFactory boots the real ASP.NET entry point in a test server, including middleware, cookies, CSRF, policies, controllers, and DI. The test factory replaces SQL Server with EF's in-memory provider for speed. Vitest covers frontend modules/components; Playwright covers user journeys with a cookie/CSRF-aware mock API. CI also builds the combined artifact and verifies `wwwroot/index.html` exists.”

## Deployment status answer

“The repository and manual App Service workflow are prepared for a combined BFF artifact. That does not mean live cutover is complete. Every `main` push still triggers the frontend-only Static Web Apps workflow with no API, while the migrated frontend calls same-origin `/api`. Do not merge this as an unattended update. A release owner must coordinate BFF staging, real login/roles/CSRF/Azure SQL/Cloudinary/deep-route/SSE smoke tests, a freeze of the automatic SWA deployment, the client-facing domain switch, and the final merge/retirement.”

## Historical words to correct immediately

If someone says the current app uses any of these, clarify that they describe the former architecture:

- Browser-stored JWT
- Bearer-token Axios interceptor
- SignalR event hub
- Permanently separate Static Web Apps frontend deployment

Current: encrypted Identity cookie, CSRF header/cookie pair, native SSE/EventSource, and combined BFF publish.

## Rapid Q&A

**What does DTO mean?** Data Transfer Object: the safe request/response shape at a boundary.

**What does EF Core do?** It maps .NET entities and LINQ operations to SQL, tracks writes, and applies schema migrations.

**What is a controller?** The HTTP adapter that matches route/verb, accepts a DTO, calls a service, and returns a status plus JSON.

**What is middleware?** Ordered request gates shared by many endpoints.

**Where do roles run?** Stored in Identity SQL tables, carried as claims in the protected cookie ticket, and evaluated by ASP.NET authorization policies on the server.

**What is WebApplicationFactory?** A test host for the real ASP.NET `Program` and pipeline.

**Why not store images in SQL?** Databases are used for structured relationships and metadata; Cloudinary is optimized to store, transform, and deliver media.

**Why one App Service origin?** It simplifies cookie custody, CSRF, frontend/API version alignment, and production routing.

**What is the main scale warning?** The in-memory SSE broker does not distribute notices between multiple server processes.

## Last-minute self-check

Before presenting, explain aloud without looking:

1. Login, current user, and logout.
2. CSRF bootstrap and validation.
3. Axios versus TanStack Query.
4. Join event through SQL commit and SSE refetch.
5. Azure SQL versus Cloudinary.
6. Vite development proxy versus .NET production publish.
7. Role policy evaluation.
8. WebApplicationFactory.
9. Switch state to submitted fields.
10. The Azure cutover gate.
