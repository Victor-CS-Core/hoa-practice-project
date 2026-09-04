# HOA Community Events: professor-style codebase guide

This guide is for a presenter who is new to web development but needs to explain this project accurately and confidently. It was traced from the current implementation, tests, and workflows. It does not treat an older slide or migration note as evidence of current behavior.

Unless a path starts with `.github/`, paths in this guide are relative to `HoaCommunityEvents/`. Workflow paths beginning with `.github/` are relative to the enclosing Git repository root.

The mission is simple: be able to answer two questions for every part of the platform:

1. **What job does it do?**
2. **How does this code make it happen?**

Use the companion [Presenter Cheat Sheet](PRESENTER-CHEAT-SHEET.md) for a meeting-length summary. Each diagram is available as editable Mermaid source and as a rendered image:

- **Combined BFF, Clean Architecture, and storage:** [Mermaid source](diagrams/platform-bff-clean-architecture.mmd) · [rendered SVG](diagrams/platform-bff-clean-architecture.svg) · [rendered PNG](diagrams/platform-bff-clean-architecture.png)
- **Cookie authentication and CSRF sequence:** [Mermaid source](diagrams/cookie-auth-csrf-sequence.mmd) · [rendered SVG](diagrams/cookie-auth-csrf-sequence.svg) · [rendered PNG](diagrams/cookie-auth-csrf-sequence.png)
- **SSE attendance invalidation sequence:** [Mermaid source](diagrams/sse-attendance-invalidation-sequence.mmd) · [rendered SVG](diagrams/sse-attendance-invalidation-sequence.svg) · [rendered PNG](diagrams/sse-attendance-invalidation-sequence.png)

Open the platform's [full-size rendered SVG](diagrams/platform-bff-clean-architecture.svg) when studying the overview; keeping it out of the normal-width page prevents its edge labels from shrinking into an unreadable thumbnail.

---

## 1. The whole platform in one mental model

The browser displays a React application. When the page needs trusted data, it calls the ASP.NET Core API. The API checks security, runs a use case, asks Entity Framework Core to read or write SQL, and returns JSON. The same ASP.NET Core application also serves the built React files in production, which is why it acts as a **Backend for Frontend**, or BFF.

```text
Person
  -> React page and form
  -> TanStack Query hook
  -> Axios HTTP client
  -> ASP.NET Core middleware
  -> controller or SSE endpoint
  -> Infrastructure service
  -> EF Core DbContext
  -> Azure SQL
```

Cloudinary is a second storage system with a different job. Azure SQL stores structured facts such as a user, event, attendance row, image URL, and crop position. Cloudinary stores and delivers the actual image bytes.

The architectural headline is:

> Separate source layers for clarity, one same-origin production application for simpler security and deployment.

### The four kinds of browser state

Knowing where state lives prevents many explanations from becoming confused.

| Kind of state | Owner | Example | Current code |
| --- | --- | --- | --- |
| Authentication credential | Browser cookie jar, issued and validated by ASP.NET Core | Encrypted Identity ticket | `IdentityServiceExtensions.cs` |
| Current-user UI state | MobX | `user`, `loadingUser`, `isAdmin` | `frontend/src/app/stores/authStore.ts` |
| Server data in the browser | TanStack Query | Event list, event detail, attendees, profile | `frontend/src/hooks/` |
| Temporary form state | React state or React Hook Form | Typed event title, selected image, crop zoom | Feature form components |

The cookie is not the same thing as the MobX `user`. The cookie is the credential the server trusts. The MobX object is only a convenient browser representation returned by `/api/account/current`.

---

## 2. Beginner vocabulary, with official definitions

### Frontend, backend, API, and HTTP

- **Frontend:** code that runs in the browser and renders what a person sees. Here it is everything under `frontend/`.
- **Backend:** trusted server code. Here it is the .NET solution under `backend/`.
- **HTTP:** the request/response protocol used by the browser and server. A request has a method, URL, headers, optional body, and cookies. A response has a status, headers, and optional body. See the [HTTP Semantics standard](https://www.rfc-editor.org/rfc/rfc9110).
- **API:** a defined set of server endpoints that code can call. Most endpoints in this project begin with `/api`.
- **JSON:** the text data format used for API request and response bodies. See the [JSON standard](https://www.rfc-editor.org/rfc/rfc8259).
- **SPA, or single-page application:** the browser loads one HTML shell and React changes views without downloading a new HTML document for every route. React Router owns that client-side navigation. See the [React documentation](https://react.dev/learn) and [React Router documentation](https://reactrouter.com/start/data/routing).
- **BFF, or Backend for Frontend:** a backend tailored to one frontend experience. This BFF serves the React build and its API from one origin. See Microsoft's [Backends for Frontends pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends).

### ASP.NET Core terms

- **Middleware:** an ordered component in the server request pipeline. It can inspect a request, short-circuit it, or pass it to the next component and inspect the response on the way back. See [ASP.NET Core Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-10.0).
- **Controller:** an HTTP adapter. It matches a route and verb, receives bound input, calls application services, and converts results into HTTP responses. See [Create web APIs with controllers](https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0).
- **Dependency injection, or DI:** a container creates objects and supplies their dependencies. A controller asks for `IEventService`; startup registration decides which class implements it. See [Dependency injection in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-10.0).
- **DTO, or Data Transfer Object:** a class that describes data crossing a boundary. A DTO is deliberately smaller and safer than exposing a database entity directly. See Microsoft's discussion of [DTOs and over-posting](https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api?view=aspnetcore-10.0#prevent-over-posting).
- **Entity:** a persistent business object with identity, such as an `Event`, `AppUser`, or `EventAttendance`.
- **Policy:** a named authorization rule. This project has `AdminOnly` and `ResidentOrAdmin`.
- **Claims principal:** the server-side object describing the authenticated identity and its claims, such as user ID, name, and roles. See [.NET claims-based identity](https://learn.microsoft.com/en-us/dotnet/standard/security/claims-and-identity-model).

### Data and browser terms

- **EF Core, or Entity Framework Core:** the object-relational mapper. It translates LINQ expressions into database operations, tracks changed entities, and commits them with `SaveChangesAsync`. See the [EF Core overview](https://learn.microsoft.com/en-us/ef/core/).
- **Migration:** a versioned description of a database schema change. Files under `backend/src/Persistence/Migrations/` create or update tables, columns, indexes, and relationships. See [EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).
- **Cookie:** a small value stored by the browser and sent on matching requests. Here the important cookie contains a protected authentication ticket. See [ASP.NET Core cookie authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0).
- **CSRF:** cross-site request forgery, an attack that abuses the browser's automatic cookie sending to submit an unwanted write. See [ASP.NET Core antiforgery guidance](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0).
- **SSE, or server-sent events:** a long-lived HTTP response in which the server sends named text events to the browser. See the [WHATWG server-sent events standard](https://html.spec.whatwg.org/multipage/server-sent-events.html).
- **EventSource:** the browser API that opens and automatically reconnects an SSE stream. It is used in `frontend/src/hooks/useEventStream.ts`.
- **Cache:** a local copy kept to avoid repeating work. TanStack Query caches JSON returned by the API. Azure SQL remains the source of truth.
- **Invalidation:** marking cached data stale because something may have changed. TanStack Query can then refetch. See [TanStack Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).
- **Bundle:** deployable browser files produced from the frontend source and its imports. Vite starts at `index.html`, follows the module graph, transforms the code, and emits optimized assets to `dist`. See [Vite production builds](https://vite.dev/guide/build).
- **WebApplicationFactory:** ASP.NET Core's integration-test host. It boots the real `Program` in a test server and gives tests an `HttpClient`. See [ASP.NET Core integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0).

---

## 3. Learn the folders by responsibility

### Top level

```text
HoaCommunityEvents/
  backend/       Trusted .NET server and backend tests
  frontend/      Browser application and browser tests
  docs/          Human and generated architecture knowledge
  graphify-out/  Generated code-relationship graph
```

The frontend and backend remain separate **source projects** because they use different compilers, dependency managers, test tools, and development loops. They are no longer separate **production applications**: .NET publishing builds the frontend and includes it in the BFF artifact.

That distinction answers the common question, “Why are frontend and backend separate, and can they be one app?” They are already one deployed app while remaining cleanly separated source folders. Physically moving React files into the API project or replacing React with Razor would not make the runtime more unified; it would mostly mix toolchains and make development harder.

### Backend projects

| Folder | Rule of thumb | Representative files |
| --- | --- | --- |
| `backend/src/Domain/` | Core persisted concepts and constants | `Entities/Event.cs`, `Entities/AppUser.cs`, `Entities/EventAttendance.cs`, `Common/AppRoles.cs` |
| `backend/src/Application/` | Boundary contracts: what use cases accept, return, and require | `DTOs/`, `Validators/`, `Common/Interfaces/`, `Common/Realtime/EventUpdate.cs` |
| `backend/src/Persistence/` | How the relational database is modeled and evolved | `Data/AppDbContext.cs`, `Migrations/`, `Data/SeedData.cs` |
| `backend/src/Infrastructure/` | Implementations that use Identity, EF Core, Cloudinary, and channels | `Services/`, `Realtime/InMemoryEventUpdateBroker.cs` |
| `backend/src/API/` | The executable web host and HTTP boundary | `Program.cs`, `Controllers/`, `Middleware/`, `Endpoints/`, `Extensions/` |
| `backend/tests/API.Tests/` | In-process server and lower-level broker tests | `ApiTestFactory.cs`, account/event/SSE/hosting tests |

### Project dependency direction

The actual project references are:

```text
API -> Application
API -> Infrastructure
Infrastructure -> Application
Infrastructure -> Persistence
Persistence -> Domain
Application -> Domain
```

This is a pragmatic Clean Architecture arrangement:

- The API knows the public contracts and installs concrete infrastructure.
- Application interfaces let controllers depend on capabilities such as `IEventService`, not on implementation details.
- Infrastructure implements those capabilities and uses Persistence.
- Persistence owns EF Core and the SQL model.
- Domain contains the business entities.

One deliberate practical exception is `AppUser : IdentityUser`. The Domain project therefore references the ASP.NET Core shared framework. This is not a perfectly framework-free domain, but it avoids duplicating the Identity user model for a modest application.

### Frontend folders

| Folder | Responsibility | Representative files |
| --- | --- | --- |
| `frontend/src/main.tsx` | Browser entry point that creates the React root and installs top-level providers | `main.tsx` |
| `frontend/src/app/` | App-wide plumbing after startup | router, layout, `agent.ts`, MobX store, QueryClient |
| `frontend/src/features/` | Product screens grouped by feature | `auth/`, `events/`, `profiles/`, `home/` |
| `frontend/src/hooks/` | TanStack Query adapters and realtime hook | `useEvents.ts`, `useAttendance.ts`, `useEventStream.ts`, `useProfile.ts` |
| `frontend/src/components/design-system/` | Reusable visual and accessible primitives | buttons, inputs, switch, dialogs, design-system reference page |
| `frontend/src/types/` | TypeScript versions of API shapes | `event.ts`, `profile.ts`, `user.ts`, `attendee.ts` |
| `frontend/src/test/` | Vitest browser-like setup | `setup.ts` |
| `frontend/tests/e2e/` | Playwright user journeys | auth, profiles, admin, attendance, routing, accessibility |

### Other frontend technologies and where they actually run

- **React Router:** route definitions and lazy page loading in `frontend/src/app/router/routes.tsx`; navigation guards in `ProtectedRoute.tsx`.
- **MobX:** current-user UI state only, in `frontend/src/app/stores/authStore.ts` and `store.ts`.
- **React Hook Form:** login, registration, and event form field management in `LoginPage.tsx`, `RegisterPage.tsx`, and `AdminEventForm.tsx`. The profile form uses React local state instead.
- **Tailwind CSS:** utility classes and design tokens assembled through `frontend/src/index.css` and `frontend/src/styles/design-system.css`.
- **Radix UI:** accessible behavior underneath dialog and dropdown primitives in `frontend/src/components/design-system/ui/`.
- **Lucide:** SVG icon components across navigation and feature components.
- **Milkdown:** a rich-text design-system primitive in `rich-text-field.tsx` and the design-system example. Current product event/profile forms do not use that rich-text editor.
- **AutoMapper:** the package is referenced by the Application project, but current production code does not call `IMapper`; mappings are explicit object initializers in services. Do not claim AutoMapper drives current DTO mapping.

---

## 4. How ASP.NET Core starts and processes a request

The composition root is `backend/src/API/Program.cs`. A **composition root** is the one place where the application chooses concrete implementations and assembles the runtime.

### Build phase

1. `WebApplication.CreateBuilder(args)` creates configuration, logging, hosting, and a DI service collection.
2. `AddApplicationServices(...)` registers controllers, antiforgery, validation, OpenAPI, rate limits, CORS, EF Core, use-case services, Cloudinary, and the SSE broker.
3. `AddIdentityServices(...)` registers Identity users/roles, cookie authentication, and authorization policies.
4. `builder.Build()` creates the executable application.
5. `ValidateStartupConfiguration()` rejects unsafe production seed configuration.

DI lifetimes matter:

- `Scoped` services such as `AppDbContext`, `AccountService`, and `EventService` are created once per HTTP request.
- `Singleton` `InMemoryEventUpdateBroker` is created once per server process so different requests can publish to current streams.

### Request pipeline order

Middleware order is code, not decoration. The source order in `Program.cs` is:

| Order | Component | How it behaves |
| --- | --- | --- |
| Development only | OpenAPI and Swagger | Exposes API descriptions and the interactive page only in Development. |
| 1 | `ExceptionMiddleware` | Wraps downstream application work, logs unexpected errors, and returns a standard JSON 500 unless the response already started. A client-aborted stream is not treated as a server failure. |
| 2 | `UseHttpsRedirection` | Redirects HTTP to HTTPS when the host provides an HTTPS port. |
| 3 | `UseDefaultFiles` | Rewrites a root static-file request to a default document such as `index.html`. |
| 4 | `UseStaticFiles` | Serves published Vite assets and short-circuits when a file exists. |
| 5 | `UseCors("Frontend")` | Applies configured cross-origin rules. Same-origin production normally needs no cross-origin exception; this remains useful for development/transition. |
| 6 | `UseRateLimiter` | Enforces the global and named request limits. |
| 7 | `UseAuthentication` | Reads and validates the Identity cookie and sets `HttpContext.User`. |
| 8 | `UseAuthorization` | Evaluates the policy attached to the selected endpoint. |
| 9 | Controllers and SSE | Maps attribute-routed controllers and the event-stream minimal endpoint. |
| 10 | `/health` | Returns `{ "status": "ok" }`. |
| 11 | `/api/{**path}` catch-all | Returns a JSON `not_found` envelope for an unknown API route. |
| 12 | SPA fallback | Returns `index.html` for an unknown non-API route so React Router can handle deep links. |

`Map...` calls describe which endpoint wins; they do not all execute at startup. The API catch-all must remain before the SPA fallback or a misspelled API URL could incorrectly return HTML with status 200.

### Rate-limit details

`backend/src/API/Extensions/ApplicationServiceExtensions.cs` configures:

- Global: 120 requests per minute per remote IP.
- Login/register: 8 requests per minute per remote IP.
- Upload signature: 10 requests per minute per remote IP **in the current middleware order**.

The upload policy's callback is written as “authenticated name, otherwise remote IP,” but `Program.cs` calls `UseRateLimiter()` before `UseAuthentication()`. At the moment the limiter chooses its partition, `HttpContext.User` has not been reconstructed from the cookie, so the effective key is the remote IP. Authentication and the `ResidentOrAdmin` policy still run later before `UploadsController` can issue a signature. Moving authentication before rate limiting would activate per-user partitions, but that is not the current implementation.

No queue is allowed, so excess requests receive 429 instead of consuming server memory while waiting.

---

## 5. Controllers, services, DTOs, validation, and EF Core

Think of one request as moving through specialists:

```text
Controller = speaks HTTP
DTO and validator = define acceptable boundary data
Service = performs the use case
EF Core DbContext = speaks to SQL
Entity = persistent business state
```

### Controllers: the HTTP boundary

Controllers inherit `BaseApiController`, which supplies `[ApiController]`, the `api/[controller]` route convention, and a standard `ApiErrorResponse` helper.

| Controller/endpoint | Main job | Security |
| --- | --- | --- |
| `SecurityController` | Return an antiforgery request token | Anonymous GET |
| `AccountController` | Register, login, current user, logout, user admin | Public entry actions; role policies for the rest |
| `EventsController` | List/detail and admin event lifecycle | Reads allow anonymous API access; writes require admin |
| `AttendanceController` | Join, leave, list attendees | Resident/admin; attendee list adds admin policy |
| `ProfilesController` | Read/update profiles | Resident/admin; service enforces own-profile updates |
| `UploadsController` | Create scoped signed Cloudinary parameters | Resident/admin plus signature rate limit |
| `EventStreamEndpoints` | Stream attendance notices for one event | Resident/admin |

The frontend routes are more restrictive than a few read APIs: `ProtectedRoute` requires a browser session for event pages even though event GET endpoints are marked anonymous. The server attributes are the security authority; frontend guards are navigation/experience controls.

### DTOs: the boundary shapes

Examples under `backend/src/Application/DTOs/`:

- `LoginDto` accepts email and password.
- `UserDto` returns display name, username, email, role, and optional profile URL. It never returns a password, password hash, cookie, or authentication token.
- `CreateEventDto` and `EditEventDto` accept event fields and optional image/crop metadata.
- `EventDto` returns event details plus computed attendee state.
- `UpdateProfileDto` accepts profile text and optional avatar/banner metadata.
- `PagedResultDto<T>` returns page metadata around a list.

DTOs prevent accidental exposure and over-posting. A caller cannot send arbitrary `AppUser` database properties just because those properties exist on the entity.

### Validation

FluentValidation classes under `backend/src/Application/Validators/` define input rules. `AddFluentValidationAutoValidation()` discovers them, and `[ApiController]` participates in model validation. `InvalidModelStateResponseFactory` in `ApplicationServiceExtensions.cs` turns validation failures into a predictable JSON envelope:

```json
{
  "code": "validation_failed",
  "message": "Validation failed.",
  "details": { "Title": ["Title is required."] },
  "traceId": "..."
}
```

That envelope lets React display field-specific feedback without parsing an exception string.

### Services

Interfaces live in Application and implementations live in Infrastructure:

| Interface | Implementation | Main collaborators |
| --- | --- | --- |
| `IAccountService` | `Infrastructure/Services/Identity/AccountService.cs` | `UserManager`, `SignInManager` |
| `IProfileService` | `Infrastructure/Services/Profiles/ProfileService.cs` | `UserManager`, Cloudinary cleanup |
| `IEventService` | `Infrastructure/Services/EventService.cs` | `AppDbContext`, Cloudinary cleanup |
| `IAttendanceService` | `Infrastructure/Services/AttendanceService.cs` | `AppDbContext`, SSE publisher |
| `ICloudinaryAssetService` | `CloudinaryAssetService.cs` | Cloudinary SDK |
| SSE publisher/subscriber | `Realtime/InMemoryEventUpdateBroker.cs` | .NET channels |

Controllers depend on the interface, which makes their intent readable and allows test substitution. The implementation owns the concrete framework calls.

### EF Core and SQL

`backend/src/Persistence/Data/AppDbContext.cs` inherits `IdentityDbContext<AppUser>`. That one context contains both ASP.NET Identity tables and product tables:

- `Events`
- `EventAttendances`
- Identity users, roles, claims, logins, tokens, and join tables supplied by Identity

Important relational rules are configured in `OnModelCreating`:

- One user can attend one event only once: unique index on `(EventId, UserId)`.
- Deleting an event cascades to its attendance rows.
- Deleting a user cascades to that user's attendance rows.
- Deleting an event host is restricted while events reference that user.
- Crop positions and zoom values have defaults.

In a read service, LINQ such as `Where`, `Include`, `OrderBy`, `Skip`, `Take`, and `Select` becomes SQL through the SQL Server EF provider. `AsNoTracking()` avoids tracking when the objects are only being read. In a write service, EF tracks entity changes until `SaveChangesAsync()` sends them in a transaction.

The migrations under `backend/src/Persistence/Migrations/` are the database history. They are applied locally with `dotnet ef database update` and optionally by the Azure deployment workflow when its SQL secret is configured.

### Follow this request: load the event list

1. `frontend/src/features/events/EventListPage.tsx` calls `useEvents(filter)`.
2. `frontend/src/hooks/useEvents.ts` creates query key `['events', filter]` and query function `Events.list(filter)`.
3. `frontend/src/app/api/agent.ts` calls Axios with `GET /api/events` and serializes the filter as query parameters.
4. In development, `frontend/vite.config.ts` proxies the path to the .NET HTTPS host. In production, the browser calls the same ASP.NET origin directly.
5. Middleware applies limits and attempts authentication. `EventsController.GetEvents` allows anonymous API access but uses any available user claims to personalize attendance state.
6. `EventService.GetEventsAsync` composes an EF query, applies filters and pagination, and projects entities into `EventDto` objects.
7. EF Core sends SQL and materializes a `PagedResultDto<EventDto>`.
8. ASP.NET serializes it as JSON. Axios parses the body. TanStack Query caches it under the query key.
9. React re-renders the list from `data.items`.

### Follow this request: create an event

1. An admin submits `AdminEventForm.tsx` inside the admin dashboard.
2. `useCreateEvent()` calls `Events.create(values)`.
3. The Axios interceptor ensures a CSRF request token exists, then sends `POST /api/events` with the CSRF header; the browser automatically adds its cookies.
4. Antiforgery validation runs before the controller action. Authentication reconstructs the principal. `AdminOnly` checks its role claims.
5. `[ApiController]` binds JSON into `CreateEventDto`; FluentValidation checks it.
6. `EventsController.CreateEvent` gets the authenticated user ID and asks whether this user has the special master-admin claim.
7. `EventService.CreateEventAsync` creates an `Event` entity with `Pending` status and saves it.
8. The controller returns 201 and the new `EventDto`.
9. TanStack Query invalidates `['events']`, causing active event lists to refetch.

---

## 6. Cookie authentication: construction, protection, sending, reconstruction, current user, and logout

### First, what changed conceptually?

The browser no longer receives a credential in JSON and does not store one in JavaScript-accessible storage. The server issues an encrypted Identity cookie. Because it is `HttpOnly`, JavaScript cannot read it. The browser attaches it to matching requests, and ASP.NET Core validates it.

This is the main security benefit: a script injection has a harder time stealing a reusable credential because the credential is not available through `localStorage` or `document.cookie`. Cookie authentication does require CSRF protection because browsers send cookies automatically; this project implements that protection explicitly.

### Identity configuration

`backend/src/API/Extensions/IdentityServiceExtensions.cs`:

- Uses `AddIdentityCore<AppUser>()` with unique emails.
- Registers roles, `SignInManager`, and EF Core Identity stores.
- Configures password requirements and lockout: five failures, 15 minutes.
- Makes the Identity application cookie the authentication scheme.
- Names the cookie `HoaCommunityEvents.Auth`.
- Sets `HttpOnly=true` and `SameSite=Lax`.
- Requires secure transport outside Development.
- Sets an eight-hour lifetime with sliding expiration.
- Converts login/access-denied redirects into API-friendly 401/403 responses.

### The exact login sequence

Open the full [rendered SVG sequence](diagrams/cookie-auth-csrf-sequence.svg), its [rendered PNG](diagrams/cookie-auth-csrf-sequence.png), or the editable [Mermaid source](diagrams/cookie-auth-csrf-sequence.mmd).

1. `LoginPage.tsx` gives the form values to `authStore.login`.
2. `AuthStore.login` calls `Account.login` in `agent.ts`.
3. Because login is a `POST`, the Axios request interceptor first calls `GET /api/security/csrf` when no request token is cached.
4. The final login request reaches `AccountController.Login` as a `LoginDto` after antiforgery and validation pass.
5. `AccountService.LoginAsync` finds the user by email and calls:

   ```csharp
   PasswordSignInAsync(user, dto.Password, isPersistent: false, lockoutOnFailure: true)
   ```

6. Identity compares the submitted password to the stored password hash. A password hash is a one-way verifier; the application does not decrypt a stored password.
7. On success, Identity's principal factory builds a `ClaimsPrincipal` containing the user identity and role claims.
8. The cookie handler serializes the authentication ticket and protects it with ASP.NET Core Data Protection. “Protects” means confidentiality and tamper detection: the browser cannot meaningfully edit a role or user ID without invalidating the ticket. See [ASP.NET Core Data Protection](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction?view=aspnetcore-10.0).
9. The response includes a `Set-Cookie` header. The JSON body is only `UserDto`; it has no credential property.
10. The browser stores the cookie according to its flags. Axios does not manually read or construct the authentication cookie.
11. `AuthStore` puts the returned `UserDto` into MobX and clears TanStack Query's cache so data from the previous identity cannot leak into the new session.

Registration follows the same finish: Identity creates the user, assigns `resident`, calls `SignInAsync`, and the cookie handler issues the session cookie.

### How later requests become authenticated

1. The browser sees a request to the matching origin/path and adds `Cookie: HoaCommunityEvents.Auth=...` automatically.
2. `UseAuthentication()` invokes the Identity cookie handler.
3. The handler validates and unprotects the ticket.
4. It reconstructs `HttpContext.User`, a `ClaimsPrincipal` with identity and role claims.
5. Identity's security-stamp validator periodically rechecks that the user is still valid in the Identity store. The integration test shortens that interval to zero and proves a deleted user's cookie is rejected.
6. `UseAuthorization()` evaluates endpoint policy requirements against `HttpContext.User`.
7. The controller can read the user ID with `FindFirstValue(ClaimTypes.NameIdentifier)` or ask `UserManager.GetUserAsync(User)` for the database record.

### How current-user restoration works

Refreshing a page clears in-memory JavaScript state but not an unexpired browser cookie. `AppLayout.tsx` calls `authStore.getCurrentUser()` during startup:

```text
AppLayout -> AuthStore -> Account.current
          -> GET /api/account/current
          -> authentication cookie principal
          -> AccountService.GetCurrentUserAsync
          -> Identity renews the ticket from current database roles
          -> UserDto
```

`GetCurrentUserAsync` calls `SignInManager.RefreshSignInAsync` before returning the DTO. That renewal matters after an administrator changes another user's role: the next `/account/current` request returns the database role and replaces the older cookie claims, so the UI and the next server authorization decision agree. If the server returns 401, `AuthStore` sets `user = null`. `ProtectedRoute` then navigates to `/login`. There is no “decode a token in the browser” fallback.

### How logout works

1. Desktop and mobile logout handlers await `authStore.logout()`.
2. Axios sends `POST /api/account/logout` with the auth cookie and CSRF header.
3. The `ResidentOrAdmin` policy must pass.
4. `AccountService.LogoutAsync` calls `SignInManager.SignOutAsync()`.
5. Identity sends a cookie-expiration response.
6. Only after server sign-out succeeds does MobX clear `user`; TanStack Query is cleared and navigation moves to login.

If the server cannot sign out, the layout deliberately keeps the visible session instead of pretending logout succeeded.

### What `HttpOnly`, `SameSite`, `Secure`, and sliding expiration mean

- `HttpOnly`: browser JavaScript cannot read the cookie. The browser can still send it.
- `Secure`: the browser sends it only over HTTPS. Development relaxes this to support local HTTP test hosts.
- `SameSite=Lax`: reduces cross-site cookie sending while allowing normal top-level navigation behavior.
- Eight-hour lifetime: the ticket expires after the configured period.
- Sliding expiration: active sessions can receive a renewed expiration when the cookie handler decides the session is far enough through its window.

### 401 versus 403

- **401 Unauthorized** means no acceptable authenticated identity was present. Despite the name, read it as “not signed in.”
- **403 Forbidden** means authentication succeeded, but the identity lacks the required permission, such as `hoa_admin`.

---

## 7. CSRF: why it exists and how every unsafe request is protected

### The threat

Suppose a resident is signed in. A malicious site cannot read the HOA cookie, but it may try to make the resident's browser submit a form to the HOA API. Because browsers automatically send cookies, the API might mistake that unwanted request for the resident's choice. That is CSRF.

The defense requires a second value that a foreign site cannot simply cause the browser to attach as a custom header.

### Server implementation

`backend/src/API/Extensions/ApplicationServiceExtensions.cs` registers antiforgery with:

- Header name `X-CSRF-TOKEN`.
- Cookie name `HoaCommunityEvents.Antiforgery`.
- `HttpOnly=true`.
- `SameSite=Strict`.
- `Secure` outside Development.
- Global `AutoValidateAntiforgeryTokenAttribute` on controllers.

`backend/src/API/Controllers/SecurityController.cs` calls `IAntiforgery.GetAndStoreTokens(HttpContext)`. It stores the cookie token in the response and returns only the corresponding request token as JSON.

Unsafe controller methods—`POST`, `PUT`, `PATCH`, and `DELETE`—are validated automatically. Safe reads such as `GET` are not. A missing or mismatched pair returns 400 before the business action runs.

### Browser implementation

`frontend/src/app/api/agent.ts` keeps the request token only in module memory:

1. For an unsafe method, the request interceptor calls `getCsrfToken()`.
2. If a token exists, it reuses it.
3. If several writes begin together, `csrfTokenRequest ??=` makes them share one bootstrap promise rather than send duplicate GETs.
4. Axios puts the returned token into `X-CSRF-TOKEN`.
5. The browser independently attaches the HttpOnly antiforgery cookie.
6. The server validates that the header token and cookie token belong together and match the current security context.

Login, registration, and logout call `resetCsrfTokenCache()` because the identity changed. A generation counter prevents an older in-flight bootstrap result from repopulating the cache after reset.

### Why the antiforgery cookie is HttpOnly if JavaScript needs a token

JavaScript does not read the cookie. It receives the paired **request token** in the JSON response and sends that value as a header. The browser protects and sends the cookie half. ASP.NET Core checks both halves.

### Swagger

`backend/src/API/OpenApi/AntiforgeryOperationFilter.cs` documents `X-CSRF-TOKEN` on unsafe operations. In Development, a tester first calls `/api/security/csrf`, keeps the response cookie in the browser, and pastes the returned request token into the Swagger header field.

---

## 8. Roles, policies, and where they run

### The roles

`backend/src/Domain/Common/AppRoles.cs` defines exactly two roles:

- `resident`
- `hoa_admin`

Identity stores roles and user-role membership in SQL tables. `SeedData.cs` creates the roles when bootstrap seeding is explicitly enabled. Normal registration assigns `resident`. Admin promotion uses `UserManager.AddToRoleAsync` and removes the resident role.

An already-issued cookie contains the role claims from its last sign-in or renewal. The target user's next `/api/account/current` request renews that ticket from the current database membership before the browser enters an admin route. This avoids the confusing state where the DTO says admin but the following server policy still evaluates an older resident-only ticket. It does not push a new cookie into a browser that makes no request; immediate global revocation would require a separate session-control design.

There is also an `is_master_admin=true` **claim**. It is not a third role. It protects special operations such as deleting another admin and allows creation of an event in the past. `SeedData` grants that claim to the bootstrapped master admin.

### The policies

`IdentityServiceExtensions.cs` registers:

```text
AdminOnly       -> require hoa_admin
ResidentOrAdmin -> require resident OR hoa_admin
```

Attributes such as `[Authorize(Policy = AuthorizationPolicies.AdminOnly)]` attach a named policy to a controller action. `UseAuthorization()` evaluates it on the server after authentication reconstructs the principal. If the role is absent, the action never runs.

### Frontend role checks are not the security boundary

`ProtectedRoute` and `authStore.isAdmin` hide or redirect UI routes. That improves experience, but browser code can be modified by the person running it. Server policies are the real enforcement. A resident who manually calls `POST /api/events` still receives 403.

### Where a role travels

```text
Identity role row in SQL
  -> Identity builds role claims at sign-in
  -> claims are protected inside the authentication ticket
  -> cookie is sent by browser
  -> authentication reconstructs ClaimsPrincipal
  -> authorization policy checks IsInRole
  -> controller runs or returns 403
```

---

## 9. Axios and TanStack Query: why both stay

This is the most important “apparent redundancy” question.

### Axios is the HTTP transport

Official reference: [Axios request configuration](https://axios-http.com/docs/req_config) and [Axios interceptors](https://axios-http.com/docs/interceptors).

The Axios instance in `frontend/src/app/api/agent.ts` knows how to:

- Prepend the relative base URL `/api`.
- Choose an HTTP method through helpers such as `get`, `post`, `put`, `patch`, and `delete`.
- Encode a plain object as a JSON body for a write.
- Serialize a filter object into query parameters for a list read.
- Ask the browser transport to include credentials with `withCredentials: true`.
- Run the CSRF request interceptor before unsafe requests.
- Parse JSON into `response.data`.
- Reject non-success responses as `AxiosError` objects.
- Mark `sessionStorage.sessionExpired` when a protected request receives 401. This marker is only a one-time UI message; it is not an authentication credential.

How Axios builds `GET /api/events?page=2`:

1. `Events.list(filter)` calls the `getWithParams` wrapper with `'/events'`.
2. Axios combines `baseURL: '/api'` and `url: '/events'`.
3. It serializes defined filter properties into the query string.
4. The browser resolves the relative URL against the current origin.
5. The browser adds matching cookies. Axios does not extract or invent the Identity cookie.
6. The transport sends the HTTP request and Axios converts the response into a resolved or rejected promise.

### TanStack Query is the server-state manager

Official reference: [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview).

Hooks in `frontend/src/hooks/` know how to:

- Give data a stable cache address, called a `queryKey`.
- Run an Axios-returning promise as the `queryFn` or `mutationFn`.
- Expose `data`, `isLoading`, `isError`, and mutation pending state to React.
- Share cached server data among components using the same key.
- Avoid a component-specific `useEffect`/`useState` fetch implementation.
- Mark related keys stale after a successful write or SSE notice.
- Refetch active stale queries and cause React to re-render with fresh data.
- Disable a query until required input exists, for example `enabled: !!id`.

### Exact trace: event detail

```text
EventDetailsPage.tsx
  -> useEvent(id) in useEvents.ts
  -> useQuery with key ['event', id]
  -> Events.detail(id) in agent.ts
  -> Axios GET /api/events/{id}
  -> EventsController.GetEvent
  -> EventService.GetEventAsync
  -> AppDbContext / Azure SQL
  -> EventDto JSON
  -> Axios response.data
  -> TanStack cache ['event', id]
  -> React render
```

### Could one library do both?

- Axios alone can fetch data, but it does not provide the application's query cache, query-key matching, loading lifecycle, mutation orchestration, or invalidation/refetch policy. Every page would have to rebuild those behaviors.
- TanStack Query does not dictate a transport. It requires a promise-returning function. That function can use Axios, native `fetch`, or another client.
- Native `fetch` could replace Axios, but the project would still need a wrapper for base URLs, JSON/error normalization, CSRF bootstrap, and typed endpoint functions.

### Ponytail decision

The smallest correct solution is to keep the working Axios transport and TanStack Query server-state layer. Replacing Axios during the cookie/SSE migration would create a second migration, more test churn, and no user-facing benefit. Revisit only if measured bundle, platform, or maintenance costs justify it.

### MobX does not replace either one

MobX stores the current `User` and derived UI facts such as `isLoggedIn` and `isAdmin`. TanStack Query stores remote resource snapshots. Axios moves HTTP data. Keeping those responsibilities distinct makes invalidation and logout cache clearing explicit.

---

## 10. Vite in development and in the .NET production bundle

### What Vite does in development

`npm run dev` starts Vite. Vite treats `frontend/index.html` as source, loads `/src/main.tsx`, and serves browser modules with fast updates during development.

`frontend/vite.config.ts` installs:

- React transformation.
- Tailwind integration.
- `@` alias to `src`.
- Vitest's jsdom setup.
- Proxies for `/api` and `/health` to `https://localhost:7011` with local-certificate verification disabled.

The [Vite proxy](https://vite.dev/config/server-options.html#server-proxy) means the browser talks to the Vite origin. Vite forwards matching paths to .NET. From the browser's perspective, the app and API remain one origin, which keeps cookie behavior aligned with production.

### How the production build works

`npm run build` performs two steps:

1. `tsc -b` type-checks/builds the TypeScript projects.
2. `vite build` starts from `index.html`, follows static and dynamic imports, transforms TypeScript/JSX/CSS, splits lazy routes into chunks, and writes optimized hashed assets to `frontend/dist/`.

Hashed filenames let browsers cache assets safely because changed content gets a new filename. Route `lazy(...)` calls in `routes.tsx` create natural code-splitting boundaries.

### How .NET packages the frontend

`backend/src/API/HoaCommunityEvents.API.csproj` defines `BuildFrontendForPublish` after `ComputeFilesToPublish`:

1. Run `npm ci` in `frontend/` for a lockfile-exact install.
2. Run `npm run build`.
3. Include every `dist/**` file under publish `wwwroot/**`.

At runtime, `UseDefaultFiles()` and `UseStaticFiles()` serve that output. `MapFallbackToFile("index.html")` supports a direct visit to a React route such as `/events/123`. The earlier `/api/{**path}` catch-all guarantees an unknown API call receives JSON 404 rather than the SPA shell.

### Why this is a BFF improvement

- One public origin means no browser token handling.
- Cookies and CSRF use normal same-origin behavior.
- Frontend and API versions ship in one artifact.
- Deep-route and API-fallback behavior is controlled by one host.
- CORS is no longer the normal production path.

The frontend is still a separate folder because Vite/TypeScript and .NET have different development concerns. “One application” does not require “one folder.”

---

## 11. SSE: how live attendance updates work

### What SSE sends

SSE is a UTF-8 text stream. A simplified record looks like:

```text
event: attendance-changed
data: {"eventId":"...","eventName":"attendance-changed"}

```

The blank line ends one record. `TypedResults.ServerSentEvents` in `EventStreamEndpoints.cs` serializes `EventUpdate` and uses `EventName` as the event type. See [.NET server-sent event results](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.typedresults.serversentevents?view=aspnetcore-10.0).

### Stream connection

1. `EventDetailsPage.tsx` calls `useEventStream(id)`.
2. The hook creates `new EventSource('/api/events/{id}/stream')`.
3. Because the URL is relative and same-origin, the browser includes the Identity cookie.
4. Authentication reconstructs the principal and `ResidentOrAdmin` authorizes the endpoint.
5. The endpoint asks `IEventService.GetEventAsync` to verify that the event exists and is visible to this caller. Missing or hidden events return JSON 404 without creating a broker bucket.
6. Only then does the endpoint call `SubscribeAsync(eventId, context.RequestAborted)` on the singleton broker.
7. ASP.NET keeps the HTTP response open and writes updates as they arrive.

### Broker mechanics

`backend/src/Infrastructure/Realtime/InMemoryEventUpdateBroker.cs` uses:

- Outer `ConcurrentDictionary` keyed by event ID.
- Inner `ConcurrentDictionary` keyed by a unique subscription ID.
- One bounded `Channel<EventUpdate>` per subscriber.
- Capacity one with `DropOldest`.
- `TryWrite`, so a slow/disconnected browser cannot block an attendance write.

Why capacity one is enough: the event is not the new attendance list. It only says, “Your cached snapshot may be stale; refetch.” If five notices arrive before the browser reads, the newest one carries the same meaning.

The broker intentionally retains an empty dictionary for an event after the last subscriber leaves. This avoids a subtle remove-versus-subscribe race at the cost of one small empty dictionary per real, caller-visible event streamed during that process lifetime. The endpoint's existence/visibility check prevents arbitrary GUID requests from creating retained buckets.

### Publish after commit

`AttendanceService.JoinEventAsync` and `LeaveEventAsync`:

1. Validate the event/attendance rules.
2. Modify the EF entity set.
3. Await `SaveChangesAsync()`.
4. Count current attendees.
5. Publish `new EventUpdate(eventId, "attendance-changed")`.

Publishing only after the SQL commit matters. A browser should never be told to refetch data that failed to save.

### Browser invalidation

`useEventStream.ts` listens only for `attendance-changed`. It invalidates:

- `['event', eventId]`
- `['events']`
- `['attendees', eventId]`

TanStack Query refetches active matches. The JSON API, not the SSE payload, remains authoritative.

Those keys map to two controller paths: `['event', eventId]` and any active `['events', ...]` list refetch through `EventsController` at `GET /api/events/{id}` or `GET /api/events`; the admin-only `['attendees', eventId]` query refetches through `AttendanceController` at `GET /api/attendance/{eventId}`.

### Reconnect and cleanup

The native EventSource reconnects automatically after a dropped connection. The first `open` means the initial stream connected and causes no refetch. A later `open` means a reconnect, so the hook invalidates all three keys to recover anything missed while offline.

When the component unmounts or the event ID changes, the hook removes both event listeners and closes the EventSource. On the server, `RequestAborted` cancels the async enumeration; the broker's `finally` removes that subscription and completes its channel. `ExceptionMiddleware` recognizes a client-aborted cancellation and does not log it as a 500.

### The single-instance limit

The broker lives in one process's memory. If two App Service instances are running:

- Resident A may write attendance on instance 1.
- Resident B's stream may be connected to instance 2.
- Instance 2's broker never sees instance 1's in-memory publish.

Therefore production must use one API instance until events are distributed through shared infrastructure.

### Credible alternatives

| Option | Strength | Cost/trade-off | When to choose |
| --- | --- | --- | --- |
| Current SSE | Native browser API, simple one-way notices, ordinary HTTP | Process-local broker currently limits scale | One-instance MVP with server-to-browser updates only |
| Polling with TanStack Query | Simplest distributed model; no long-lived connection | Repeated requests even when nothing changes; update delay | Low traffic or infrastructure that cannot hold streams |
| Raw WebSockets | Full duplex and compact | Connection protocol, reconnect, auth, fan-out, and scale logic become application work | High-frequency two-way interaction such as chat or collaboration |
| SignalR | Higher-level .NET hubs, groups, reconnect support, multiple transports | Extra client/server dependency and operational complexity; a backplane/service is still needed for scale | Rich bidirectional .NET realtime features |
| Azure Web PubSub or managed SignalR | Managed connection fan-out across instances | Cloud service cost and platform coupling | Multi-instance production requiring managed realtime delivery |

SSE was selected because attendance only needs a one-way “data changed” notice. It avoids a larger realtime abstraction for an MVP.

---

## 12. Azure SQL and Cloudinary: two stores with different jobs

### What Azure SQL stores

The production `DefaultConnection` is expected to target Azure SQL, the managed SQL Server-compatible database. See [Azure SQL Database overview](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql).

Through `AppDbContext`, it stores:

- User accounts, password hashes, security stamps, claims, roles, and user-role memberships.
- Events and lifecycle status.
- Attendance relationships.
- Display name and bio.
- Image URLs.
- Image crop positions and zoom values.

It does **not** store the uploaded JPEG/PNG/WebP bytes.

### What Cloudinary stores

Cloudinary stores the actual avatar, profile-banner, and event-banner files and serves them by URL. See [Cloudinary client-side uploading](https://cloudinary.com/documentation/client_side_uploading) and the [Upload API](https://cloudinary.com/documentation/image_upload_api_reference).

### Follow this request: upload an event image

1. `AdminEventForm.tsx` checks that the selected file is JPG, PNG, or WebP and no larger than 5 MB.
2. It calls `Uploads.getCloudinarySignature('event')` in `agent.ts`.
3. Axios obtains CSRF protection and sends `POST /api/uploads/cloudinary/signature` with the auth cookie.
4. `UploadsController` requires `ResidentOrAdmin`, rate-limits the call, identifies the user, chooses a user-scoped folder, generates a random public ID, and signs the sorted parameters plus the Cloudinary API secret with SHA-1 as required by this Cloudinary signature format.
5. The controller returns cloud name, public API key, timestamp, folder, public ID, and signature. It never returns the API secret.
6. The browser builds `FormData` and uses `fetch` to upload the image bytes directly to `https://api.cloudinary.com/.../image/upload`.
7. Cloudinary returns `secure_url`.
8. The form places that URL into `imageUrl` and later submits event JSON to the HOA API.
9. `EventService` stores the URL and crop values in SQL.

Direct browser upload keeps large image bytes off the App Service request path while preserving server-controlled authorization through the short-lived signature.

### Cleanup

When an event image is replaced/deleted or a profile image is replaced, `CloudinaryAssetService.DeleteIfOwnedAsync`:

1. Accepts only a Cloudinary URL matching the configured cloud.
2. Extracts the public ID from the URL.
3. Calls Cloudinary's destroy API with invalidation.
4. Logs a warning rather than failing the saved database change if media cleanup fails.

The database operation is authoritative; Cloudinary cleanup is best effort.

### Is Azure Storage used?

There is no Azure Blob Storage SDK, container configuration, or blob service in the repository. Azure SQL is the Azure data store. Azure App Service contains the deployed application and Vite static assets. Cloudinary is the user-media store.

---

## 13. Accessible image switches and submitted fields

### Why a switch instead of an “Enabled/Disabled” action button?

A switch communicates one persistent binary setting. Its current state is exposed through `aria-checked`, which assistive technology understands. See the [WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

`frontend/src/components/design-system/ui/switch.tsx` is intentionally small:

- Native `<button type="button">`, so Space and Enter activate it.
- `role="switch"`.
- `aria-checked={checked}`.
- Accessible name supplied by `aria-label` or `aria-labelledby`.
- Normal `disabled` behavior.
- Visible keyboard focus ring.
- `onCheckedChange(!checked)` after an unprevented click.

No dependency was added because a native button plus ARIA covers this control.

### Profile form behavior

`ProfileEditForm.tsx` has two local booleans initialized from whether a URL exists:

- `avatarEnabled` from `profileImageUrl`.
- `bannerEnabled` from `bannerImageUrl`.

Turning one off immediately:

- Clears its URL.
- Resets X/Y to 50 and zoom to 1.
- Clears selected upload file.
- Clears upload success/error feedback.
- Hides the editing controls and preview.

At Save, disabled fields are submitted as `undefined`:

| Switch | Submitted URL | Submitted crop fields |
| --- | --- | --- |
| Avatar off | `profileImageUrl: undefined` | X/Y/zoom undefined on first off; reset defaults if re-enabled |
| Profile banner off | `bannerImageUrl: undefined` | X/Y/zoom undefined on first off; reset defaults if re-enabled |

JavaScript JSON serialization omits `undefined` object properties. ASP.NET creates the DTO with nullable image properties unset; `ProfileService` writes a null URL and default crop values, then requests cleanup of the old owned Cloudinary URL.

### Event form behavior

`AdminEventForm.tsx` has `bannerEnabled` initialized from `initialValues.imageUrl`. Turning it off clears `imageUrl`, resets crop values, clears upload state, and submits image properties as undefined. `EventService` writes no URL and asks Cloudinary cleanup to delete the old owned image when the URL changed.

### Tests

- Primitive semantics: `frontend/src/components/design-system/ui/switch.test.tsx`.
- Profile form data/reset behavior: `frontend/src/features/profiles/components/ProfileEditForm.test.tsx`.
- Event form behavior: `frontend/src/features/events/components/AdminEventForm.test.tsx`.
- Browser flows: `frontend/tests/e2e/profile.spec.ts` and `event-image.admin.spec.ts`.

The important presenter sentence is:

> The switch is not cosmetic; it controls the exact nullable image fields sent to the API and clears stale upload state to prevent user confusion.

---

## 14. Testing strategy and WebApplicationFactory

### Backend integration tests

`backend/tests/API.Tests/ApiTestFactory.cs` inherits `WebApplicationFactory<Program>`. The public partial `Program` declaration at the end of `Program.cs` gives the test project an entry point.

The factory:

- Boots the real middleware, controllers, Identity configuration, service registrations, and endpoint mappings in a `TestServer`.
- Forces Development environment.
- Disables production/demo seeding.
- Supplies test Cloudinary configuration.
- Replaces the SQL Server DbContext registration with EF Core's named in-memory provider.
- Defaults the security-stamp validation interval to zero so invalidation can be tested immediately, while allowing a focused test to use the production-like 30-minute interval and prove explicit current-user renewal.
- Creates cookie-aware `HttpClient` instances.
- Provides `WithCsrfAsync`, which obtains the antiforgery pair and attaches the request-token header.
- Provides helpers to create roles/admins and delete a test user.

Important suites:

- `AccountIntegrationTests.cs`: cookie issuance, no token JSON, current user, logout, 401/403, tampered-cookie and deleted-user rejection, CSRF, and role-claim renewal after promotion.
- `EventsIntegrationTests.cs`: event read shape and protected creation with CSRF.
- `EventStreamIntegrationTests.cs`: anonymous rejection, valid authenticated SSE delivery, and unknown-event 404 without a subscription.
- `AttendanceRealtimeIntegrationTests.cs`: publish only after successful join/leave commit; rejected write emits nothing.
- `InMemoryEventUpdateBrokerTests.cs`: fan-out, event isolation, cleanup, concurrent cleanup, slow subscriber/drop-oldest, singleton registration.
- `SpaHostingIntegrationTests.cs`: deep React route receives HTML; unknown API receives JSON 404.
- `ExceptionMiddlewareTests.cs`: standard 500 behavior and harmless client-abort handling.

The EF in-memory provider is fast but does not prove every SQL Server behavior. The Azure cutover smoke test and migrations remain necessary.

### Frontend unit/component tests

Vitest runs in jsdom using `frontend/src/test/setup.ts`:

- `agent.test.ts` proves relative BFF URLs, cookie credentials, no bearer token, CSRF sharing, and reset-race safety.
- `authStore.test.ts` proves server-based current-user restoration and query-cache clearing on identity changes.
- `useEventStream.test.tsx` supplies a fake EventSource and proves URL, event filtering, invalidations, reconnect recovery, and cleanup.
- Switch/form tests prove accessible control semantics and submitted fields.
- Feature tests exercise list/dashboard behavior.

### Playwright browser tests

`frontend/playwright.config.ts` starts Vite at `127.0.0.1:4173` and runs Chromium. `frontend/tests/e2e/support/mockApi.ts` installs route handlers that model cookie sessions and require the CSRF header. The SSE route is intercepted so tests do not accidentally contact a live API.

These are user-flow tests for navigation, roles, auth, session expiry, profile images, event images, attendance, and accessibility. They are not a substitute for the backend integration suite; the two levels prove different boundaries.

### CI

`.github/workflows/ci.yml`:

- Restores, builds, and tests the .NET solution.
- Installs Node so the backend publish target can build the SPA.
- Publishes the combined BFF and asserts `wwwroot/index.html` exists.
- Separately runs frontend install, lint, unit tests, and build.

---

## 15. Deployment status and the hard cutover gate

### Target production shape

```text
Browser
  -> Azure App Service combined BFF
       -> serves Vite assets
       -> handles /api
       -> keeps one process-local SSE broker
       -> EF Core -> Azure SQL
  -> Cloudinary for image upload and delivery
```

### Current workflow state

- `.github/workflows/deploy-api-azure.yml` is manually triggered. It sets up .NET and Node, publishes the combined artifact, optionally applies migrations when the production SQL secret is present, and deploys to App Service.
- `.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml` still runs automatically on every push to `main`. It uploads `HoaCommunityEvents/frontend` with an empty `api_location`, so that legacy origin has no matching API deployment.
- The repository is prepared for the BFF deployment, but source changes alone do not prove the production App Service, secrets, DNS, or client-facing URL have been cut over.

### Do not treat this as an ordinary merge

The migrated browser uses same-origin `/api` for cookie login, CSRF, data, and SSE. An unattended merge to `main` would trigger the legacy Static Web Apps workflow and could publish this new frontend on an origin where those `/api` routes do not exist.

**Hard gate: do not merge this migration as an unattended `main` update.** First obtain release authority and coordinate the staging/BFF deployment, the smoke tests below, the client-facing domain switch, and the freeze or retirement of the automatic Static Web Apps workflow. Freezing the workflow stops new frontend-only uploads; it does not remove the already deployed legacy site.

### Required gate before disabling the old deployment

1. Deploy the combined artifact to a staging slot or chosen App Service.
2. Verify `/`, a deep React route, `/health`, and an unknown `/api` route.
3. Verify registration/login/current/logout with real cookies and CSRF.
4. Verify resident/admin policies and 401/403 behavior.
5. Verify EF migrations and real Azure SQL reads/writes.
6. Verify Cloudinary signature and direct upload.
7. Verify the SSE content type and attendance invalidation.
8. Keep the API at one instance while the broker is in memory.
9. With the release owner, freeze the automatic Static Web Apps workflow before the coordinated merge can publish a frontend-only build.
10. Switch the client-facing custom domain or URL to the verified App Service.
11. Merge and deploy only as part of that coordinated release, then confirm the running BFF matches the released commit.
12. Retire the former Static Web Apps workflow after the cutover is confirmed.

That is a hard gate because disabling the old frontend before the new origin is proven could create downtime, while merging first can automatically publish an API-dependent frontend to the API-less legacy origin.

---

## 16. Follow these requests end to end

### A. Restore a session after refresh

```text
AppLayout useEffect
  -> AuthStore.getCurrentUser
  -> Axios GET /api/account/current
  -> browser attaches Identity cookie
  -> UseAuthentication reconstructs principal
  -> ResidentOrAdmin policy
  -> AccountController.CurrentUser
  -> AccountService.GetCurrentUserAsync
  -> UserManager loads user and roles
  -> UserDto
  -> MobX user
  -> ProtectedRoute renders page
```

### B. Resident joins an event

```text
AttendanceActionCard
  -> useJoinEvent mutation
  -> Axios CSRF bootstrap if needed
  -> POST /api/attendance/{id}/join
  -> cookie authentication and ResidentOrAdmin policy
  -> AttendanceController
  -> AttendanceService rule checks
  -> EF adds EventAttendance and commits
  -> broker publishes attendance-changed
  -> mutation invalidates local event/list queries
  -> every connected event stream also invalidates detail/list/attendees
  -> TanStack Query refetches authoritative JSON
```

### C. Admin publishes an event

```text
Admin dashboard action
  -> usePublishEvent mutation
  -> Axios PATCH plus CSRF header and cookie
  -> antiforgery validation
  -> AdminOnly role policy
  -> EventsController.PublishEvent
  -> EventService checks state and end date
  -> status becomes Published and EF commits
  -> EventDto response
  -> ['events'] and ['event', id] invalidated
```

### D. Edit a profile and turn the banner off

```text
ProfileEditForm switch
  -> bannerEnabled becomes false
  -> URL/file/crop/upload feedback cleared
  -> Save emits no banner image properties
  -> useUpdateProfile mutation
  -> PUT /api/profiles/{username} with cookie and CSRF
  -> ProfileService verifies current user owns username
  -> AppUser banner URL becomes null, crop values default
  -> EF/Identity update SQL
  -> old owned Cloudinary image deletion attempted
  -> profile query invalidated and refetched
```

### E. Directly open `/events/123` in production

```text
GET /events/123
  -> no matching static file
  -> no /api catch-all match
  -> MapFallbackToFile returns wwwroot/index.html
  -> browser loads hashed Vite assets
  -> React Router matches events/:id
  -> ProtectedRoute checks restored current user
  -> EventDetailsPage fetches event and opens SSE
```

---

## 17. Five-minute client/boss pitch

### Minute 0–1: product

“This is an HOA community-events platform with two primary roles. Residents browse events, manage attendance, and maintain profiles. HOA administrators manage the event lifecycle, attendees, and users. The design focuses on clear resident workflows with policy-protected administration.”

### Minute 1–2: architecture

“The browser application is React and TypeScript. ASP.NET Core is the production BFF: it serves the React build and the API from one origin. The backend is split into API, Application, Domain, Infrastructure, and Persistence responsibilities. Entity Framework Core maps the domain data to SQL Server/Azure SQL.”

### Minute 2–3: security

“Authentication uses ASP.NET Core Identity cookies rather than a credential exposed to browser JavaScript. Identity protects the claims ticket, the browser sends the HttpOnly cookie, and middleware reconstructs the user and checks role policies. Writes use an antiforgery cookie-plus-header pair. The frontend restores identity through `/api/account/current` and clears cached server data whenever identity changes.”

### Minute 3–4: data and realtime

“Azure SQL stores accounts, roles, events, attendance, profiles, image URLs, and crop values. Cloudinary stores the image files. Signed browser uploads keep the Cloudinary secret on the server and image bytes off the API host. Attendance uses server-sent events as a lightweight invalidation signal; the browser then refetches authoritative JSON.”

### Minute 4–5: delivery and quality

“Vite provides fast frontend development and creates optimized production assets. The .NET publish target builds those assets into one App Service artifact and preserves React deep links without hiding API 404s. Backend behavior is covered through WebApplicationFactory integration tests, frontend behavior through Vitest, and user flows through Playwright. The remaining release gate is operational: a normal merge to `main` would still auto-deploy the frontend to the API-less legacy Static Web Apps origin, so the release owner must coordinate BFF staging, smoke tests, workflow freeze, domain switch, and the final merge rather than treating this as an unattended update.”

---

## 18. Questions you should be ready to answer

### “Is a cookie just another token?”

At a broad level it contains a protected authentication ticket, but the important architecture difference is custody. The server writes it as HttpOnly, the browser cookie mechanism sends it, and application JavaScript does not read or persist the credential. CSRF protection is therefore mandatory for writes.

### “Where does authorization actually happen?”

On the server in `UseAuthorization()` against named policies registered in `IdentityServiceExtensions.cs` and attached to controller actions/endpoints. Frontend route guards are convenience, not authority.

### “Why use Axios if TanStack Query can fetch?”

TanStack Query schedules and caches promise-returning operations; it does not require or replace the transport. Axios owns this app's URL, JSON, error, credential, and CSRF conventions. Removing it would mean writing a fetch wrapper while retaining TanStack Query.

### “Does SSE send the new attendee list?”

No. It sends an `attendance-changed` notice. TanStack Query invalidates cache keys and refetches the trusted JSON API. This keeps realtime messages small and avoids maintaining two competing data paths.

### “Why not SignalR?”

This feature is one-way and low-frequency. Native SSE meets it with less code and no client package. SignalR becomes attractive if the application needs bidirectional hubs, richer connection semantics, or a managed backplane.

### “Can this scale to multiple API instances today?”

Normal HTTP/SQL work can, but guaranteed cross-instance SSE notices cannot because the broker is in process. Keep one instance until a shared broker or managed realtime service distributes events.

### “What Azure storage holds the images?”

None in this implementation. Azure SQL holds image URLs/crop metadata. Cloudinary holds the image bytes. Azure App Service holds the deployed app's static build files.

### “Why is frontend code separate if the app is combined?”

Source organization and deployment topology are different decisions. Separate folders preserve the correct Vite/TypeScript and .NET toolchains. The publish target combines their outputs into one App Service application and origin.

### “What is WebApplicationFactory?”

It boots the actual ASP.NET Core entry point in an in-process test server. Tests can make realistic HTTP requests through middleware, cookies, CSRF, policies, controllers, and DI while replacing SQL Server with a fast test database.

### “How do the switches affect persisted data?”

They clear image state and cause optional URL/crop fields to be absent. The server writes a null URL/default crop values and attempts cleanup of the old owned Cloudinary asset. Their role/ARIA semantics also make the binary state understandable to assistive technology.

---

## 19. Historical architecture: do not describe this as current

The following are historical migration context only:

- A JWT credential returned to and stored by browser JavaScript.
- An Axios bearer-token interceptor.
- A SignalR hub and its former frontend realtime hook.
- A frontend intended to remain independently deployed on Azure Static Web Apps.

Current source uses Identity cookies, CSRF, native SSE/EventSource, and a combined ASP.NET Core BFF publish. Historical plan/spec files under `docs/superpowers/` intentionally mention the old state to explain the migration.

---

## 20. Primary-source reference shelf

- [.NET 10 documentation](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview)
- [ASP.NET Core fundamentals](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/?view=aspnetcore-10.0)
- [ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-10.0)
- [ASP.NET Core dependency injection](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-10.0)
- [ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-10.0)
- [Cookie authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0)
- [Data Protection](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction?view=aspnetcore-10.0)
- [Antiforgery](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0)
- [Role-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/roles?view=aspnetcore-10.0)
- [Policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0)
- [EF Core](https://learn.microsoft.com/en-us/ef/core/)
- [.NET channels](https://learn.microsoft.com/en-us/dotnet/core/extensions/channels)
- [ASP.NET Core integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
- [React](https://react.dev/learn)
- [React Router](https://reactrouter.com/start/data/routing)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/guide/)
- [Axios](https://axios-http.com/docs/intro)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [MobX](https://mobx.js.org/README.html)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
- [WHATWG server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
- [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview)
- [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql)
- [Cloudinary signed client-side uploads](https://cloudinary.com/documentation/client_side_uploading)

---

## 21. Retrieval practice: test whether you really know it

Close this guide and answer aloud:

1. What is the difference between the Identity cookie and the MobX user object?
2. Why does a login POST need CSRF protection before the user is signed in?
3. Which component creates the CSRF header, and which component validates it?
4. Where are role memberships stored, where are they carried, and where are they evaluated?
5. Why do Axios and TanStack Query both remain?
6. What does an SSE notice contain, and what makes the page current afterward?
7. Why is the SSE broker limited to one server instance?
8. What data is in Azure SQL, and what is in Cloudinary?
9. What happens to image fields and upload state when a switch is turned off?
10. How does `dotnet publish` end up with React files in `wwwroot`?
11. Why can `/events/123` return the SPA while `/api/missing` returns JSON 404?
12. What does WebApplicationFactory test that a controller unit test would miss?

If you can explain each answer and point to its file, you understand the codebase well enough to present it rather than merely repeat its technology list.
