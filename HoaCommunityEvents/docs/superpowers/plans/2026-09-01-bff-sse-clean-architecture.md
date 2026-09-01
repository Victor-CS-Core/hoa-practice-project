# HOA Community Events BFF, SSE, and Clean Structure Implementation Plan

> Execute this plan test-first. Keep each behavioral change small, run its focused tests, then run the full suite before deployment. Use the Ponytail skill when it becomes available in the next turn to challenge unnecessary abstractions and preserve the smallest design that meets this specification.

**Goal:** Reorganize the repository, consolidate production behind the ASP.NET Core BFF, replace JWT/localStorage auth with secure cookies and CSRF protection, replace SignalR with SSE, standardize binary image controls as accessible switches, and update all learning/deployment materials.

**Architecture:** React remains in `frontend/`; the five Clean Architecture projects and integration tests move under `backend/`. ASP.NET Core serves the production Vite build and same-origin API. Identity issues encrypted cookies, ASP.NET antiforgery protects writes, and a process-local broker streams attendance invalidations to native EventSource clients.

**Tech stack:** .NET 10, ASP.NET Core Identity/cookies/antiforgery/typed SSE, EF Core 10, React 19, TypeScript 6, Vite 8, Axios, TanStack Query, Vitest, xUnit, Azure App Service, Azure SQL, Cloudinary.

---

## Task 1: Establish a green baseline and record the move map

**Inspect:** all current projects, tests, workflows, and `git status`.

1. Run `dotnet test HoaCommunityEvents.slnx` from the repository folder.
2. Run `npm run lint`, `npm run test:run`, and `npm run build` from `frontend/`.
3. Record any pre-existing failures without changing unrelated files.
4. Confirm the only planned moves are:
   - `API` -> `backend/src/API`
   - `Application` -> `backend/src/Application`
   - `Domain` -> `backend/src/Domain`
   - `Infrastructure` -> `backend/src/Infrastructure`
   - `Persistence` -> `backend/src/Persistence`
   - `API.Tests` -> `backend/tests/API.Tests`
   - `HoaCommunityEvents.slnx` -> `backend/HoaCommunityEvents.slnx`

## Task 2: Move the .NET projects without changing behavior

**Modify:** `backend/HoaCommunityEvents.slnx`, every moved `.csproj`, root `README.md`, and parent `.github/workflows/ci.yml`.

1. Move the seven targets with `git mv`; do not move `frontend`, `docs`, `graphify-out`, or repository metadata.
2. Update solution paths to `src/*` and `tests/API.Tests`.
3. Update project references:
   - API -> `../Application`, `../Infrastructure`
   - Application -> `../Domain`
   - Infrastructure -> `../Application`, `../Persistence`
   - Persistence -> `../Domain`
   - API.Tests -> `../../src/API`
4. Update CI restore/build/test paths to `HoaCommunityEvents/backend/HoaCommunityEvents.slnx`.
5. Run `dotnet restore backend/HoaCommunityEvents.slnx`, `dotnet build backend/HoaCommunityEvents.slnx --no-restore`, and `dotnet test backend/HoaCommunityEvents.slnx --no-build`.
6. Commit only the structural move and path corrections.

## Task 3: Write failing cookie-session integration tests

**Modify:** `backend/tests/API.Tests/AccountIntegrationTests.cs`, `backend/tests/API.Tests/ApiTestFactory.cs`, `backend/tests/API.Tests/EventsIntegrationTests.cs`.

1. Replace token assertions with tests that require:
   - registration and login responses contain no `token` property;
   - login returns an authentication `Set-Cookie` header;
   - the same cookie-aware client can call `/api/account/current`;
   - `/api/account/logout` invalidates the session;
   - anonymous protected requests return 401 with no redirect.
2. Add `GET /api/security/csrf` helper support that captures the request token while the test client's cookie container retains the antiforgery cookie.
3. Add tests proving unsafe API calls without `X-CSRF-TOKEN` return 400 and the same calls with a valid token reach normal auth/validation behavior.
4. Run only `AccountIntegrationTests` and confirm the new tests fail for the intended JWT/current logout behavior.

## Task 4: Replace JWT generation and validation with Identity cookies

**Delete:**

- `backend/src/Application/Common/Interfaces/ITokenService.cs`
- `backend/src/Application/Common/Options/JwtOptions.cs`
- `backend/src/Infrastructure/Services/Identity/TokenService.cs`

**Move:**

- `backend/src/Application/Services/AccountService.cs` -> `backend/src/Infrastructure/Services/Identity/AccountService.cs`
- `backend/src/Application/Services/ProfileService.cs` -> `backend/src/Infrastructure/Services/Profiles/ProfileService.cs`

**Modify:**

- `backend/src/API/Extensions/IdentityServiceExtensions.cs`
- `backend/src/API/Extensions/ApplicationServiceExtensions.cs`
- `backend/src/API/Controllers/AccountController.cs`
- `backend/src/Application/Common/Interfaces/IAccountService.cs`
- `backend/src/Infrastructure/Services/Identity/AccountService.cs`
- `backend/src/Infrastructure/Services/Profiles/ProfileService.cs`
- `backend/src/Application/DTOs/UserDto.cs`
- `backend/src/Application/HoaCommunityEvents.Application.csproj`
- `backend/src/API/HoaCommunityEvents.API.csproj`
- `backend/src/Infrastructure/HoaCommunityEvents.Infrastructure.csproj`
- `backend/src/API/appsettings.json`
- `backend/src/API/appsettings.Development.json`
- `backend/src/API/.env.example`

1. Move the two Identity-dependent service implementations to Infrastructure, update their namespaces/DI registration, and remove the ASP.NET Core framework reference from Application when a dependency search proves it is no longer needed.
2. Configure Identity's application cookie as the default authentication scheme. Use an application-specific cookie name, `HttpOnly`, `SameSite=Lax`, an eight-hour lifetime with sliding expiration, and `Secure=Always` outside Development.
3. Remove JWT packages, options, Swagger bearer configuration, token DI, and `TokenKey` requirements.
4. In `RegisterAsync`, add the resident role and call `SignInManager.SignInAsync` only after successful creation/role assignment.
5. In `LoginAsync`, use `PasswordSignInAsync(user, password, isPersistent: false, lockoutOnFailure: true)` so a successful login issues the cookie.
6. Add `LogoutAsync` to the service contract and call `SignInManager.SignOutAsync`; make the controller action asynchronous.
7. Remove `Token` from `UserDto` and from every DTO mapper.
8. Keep the existing authorization policies and verify role claims still reach them through Identity's principal factory.
9. Run the focused account and authorization tests until green.

## Task 5: Add SPA antiforgery protection

**Create:**

- `backend/src/API/Controllers/SecurityController.cs`
- `backend/src/API/OpenApi/AntiforgeryOperationFilter.cs`
- `backend/src/Application/DTOs/AntiforgeryTokenDto.cs`

**Modify:**

- `backend/src/API/Extensions/ApplicationServiceExtensions.cs`
- `backend/src/API/Program.cs`
- cookie integration tests from Task 3

1. Register antiforgery with header name `X-CSRF-TOKEN` and an application-specific `HttpOnly`, `SameSite=Strict` antiforgery cookie; require Secure outside Development.
2. Add `AutoValidateAntiforgeryTokenAttribute` globally so unsafe controller requests are validated while GET/HEAD/OPTIONS remain safe.
3. Add anonymous `GET /api/security/csrf`, call `IAntiforgery.GetAndStoreTokens`, and return only the request token in JSON.
4. Add a development Swagger operation filter that exposes `X-CSRF-TOKEN` on unsafe operations; this keeps the API page usable by first calling the CSRF endpoint, then pasting its returned token while Swagger retains the cookie.
5. Order middleware so exception handling, HTTPS/static files, rate limiting, authentication, authorization, and endpoint mapping remain deterministic.
6. Verify missing/invalid tokens fail and valid tokens permit login, registration, logout, event mutations, profile updates, and upload-signature requests.

## Task 6: Convert the frontend session client to the BFF contract

**Modify:**

- `frontend/src/app/api/agent.ts`
- `frontend/src/app/stores/authStore.ts`
- `frontend/src/app/stores/authStore.test.ts`
- `frontend/src/app/layout/AppLayout.tsx`
- `frontend/src/types/user.ts`
- `frontend/vite.config.ts`
- `frontend/.env.example`

**Create:** `frontend/src/app/api/agent.test.ts`.

1. First write tests that assert no Authorization header/local JWT is used, unsafe methods attach `X-CSRF-TOKEN`, and concurrent unsafe calls share one token bootstrap request.
2. Change Axios to relative base URL `/api` with `withCredentials: true`.
3. Remove the JWT request interceptor and JWT-removal response behavior.
4. Implement a module-memory antiforgery token loader using `GET /security/csrf`; reset the cached token after login, registration, and logout because identity changed.
5. Remove `token` from the TypeScript `User` type.
6. Make `AuthStore.getCurrentUser()` always call `/account/current`; a 401 becomes a signed-out state instead of consulting localStorage.
7. Make logout await `POST /account/logout` before clearing state; update both desktop and mobile handlers to await it before navigation.
8. Add a Vite `/api` proxy to the local ASP.NET Core URL so local cookies remain first-party from the browser's perspective.
9. Run the focused agent/store tests, then all frontend tests.

## Task 7: Write the SSE contracts and broker tests

**Create:**

- `backend/src/Application/Common/Realtime/EventUpdate.cs`
- `backend/src/Application/Common/Interfaces/IEventUpdatePublisher.cs`
- `backend/src/Application/Common/Interfaces/IEventUpdateSubscriber.cs`
- `backend/src/Infrastructure/Realtime/InMemoryEventUpdateBroker.cs`
- `backend/tests/API.Tests/InMemoryEventUpdateBrokerTests.cs`

1. Test that one published update reaches every current subscriber for the same event.
2. Test that subscribers for a different event receive nothing.
3. Test that cancellation removes a subscriber and that a slow subscriber cannot block `PublishAsync`.
4. Implement one bounded channel per subscription using a concurrent dictionary. Use drop-oldest behavior because notifications only trigger a refetch.
5. Register one singleton implementation as both publisher and subscriber interfaces.
6. Run the broker tests until green.

## Task 8: Replace the SignalR backend with an authenticated SSE endpoint

**Delete:**

- `backend/src/Infrastructure/Hubs/EventHub.cs`

**Create:**

- `backend/src/API/Endpoints/EventStreamEndpoints.cs`
- `backend/tests/API.Tests/EventStreamIntegrationTests.cs`

**Modify:**

- `backend/src/Infrastructure/Services/AttendanceService.cs`
- `backend/src/API/Extensions/ApplicationServiceExtensions.cs`
- `backend/src/API/Program.cs`
- `backend/src/Infrastructure/HoaCommunityEvents.Infrastructure.csproj`

1. Write an integration test proving an anonymous stream request is 401.
2. Write an authenticated streaming test using `HttpCompletionOption.ResponseHeadersRead`; publish an update through DI and assert an `attendance-changed` SSE record arrives for the correct event.
3. Map `GET /api/events/{eventId:guid}/stream`, require `ResidentOrAdmin`, and return .NET 10 `TypedResults.ServerSentEvents` over the subscriber's async stream.
4. Publish an `attendance-changed` event only after `SaveChangesAsync` succeeds in join and leave paths.
5. Remove `AddSignalR`, `MapHub`, SignalR namespaces, and SignalR/JWT packages.
6. Document the single-instance limitation in configuration and deployment notes.
7. Run broker, stream, attendance, and full backend tests.

## Task 9: Replace the SignalR frontend hook with EventSource

**Delete:** `frontend/src/hooks/useSignalR.ts`.

**Create:**

- `frontend/src/hooks/useEventStream.ts`
- `frontend/src/hooks/useEventStream.test.tsx`

**Modify:**

- `frontend/src/features/events/EventDetailsPage.tsx`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.ts`

1. Mock `EventSource` and write tests for URL construction, attendance-event filtering, all three TanStack Query invalidations, and cleanup on unmount/event-id change.
2. Implement `useEventStream(eventId)` with native `EventSource('/api/events/{id}/stream')` and an `attendance-changed` listener.
3. Keep errors quiet for the MVP because EventSource reconnects automatically and normal mutations already invalidate local queries.
4. Replace the hook call in `EventDetailsPage`.
5. Uninstall `@microsoft/signalr` and remove the Vite warning workaround that existed only for that package.
6. Run the hook test, all frontend tests, lint, and build.

## Task 10: Introduce and apply the accessible image-setting switch

**Create:**

- `frontend/src/components/design-system/ui/switch.tsx`
- `frontend/src/components/design-system/ui/switch.test.tsx`
- `frontend/src/features/profiles/components/ProfileEditForm.test.tsx`
- `frontend/src/features/events/components/AdminEventForm.test.tsx`

**Modify:**

- `frontend/src/features/profiles/components/ProfileEditForm.tsx`
- `frontend/src/features/events/components/AdminEventForm.tsx`
- the relevant design-system forms/example section

1. Test mouse and keyboard activation, `role="switch"`, `aria-checked`, accessible name, disabled behavior, and focus styling contract.
2. Implement the reusable switch without adding a dependency.
3. Replace the profile avatar and profile banner Enabled/Disabled buttons with labeled switches.
4. Replace the event banner Enabled/Disabled button with the same component.
5. Preserve existing form submission semantics and add concise copy explaining that turning a setting off means the image will not be saved/displayed.
6. Do not convert publish/unpublish, cancel, delete, theme, tabs, or navigation buttons.
7. Run focused form/switch tests and the full frontend suite.

## Task 11: Build and serve the SPA from the .NET BFF

**Modify:**

- `backend/src/API/HoaCommunityEvents.API.csproj`
- `backend/src/API/Program.cs`
- `frontend/vite.config.ts`
- `frontend/README.md`
- `README.md`

1. Add a publish-only MSBuild target that runs `npm ci` and `npm run build` from `frontend/`, then includes `frontend/dist/**` under publish `wwwroot`.
2. Add `UseDefaultFiles`, `UseStaticFiles`, a JSON 404 catch-all for unmatched `/api/**`, and then `MapFallbackToFile("index.html")` so SPA fallback cannot swallow API mistakes; preserve `/health` and Development Swagger routes.
3. Keep Vite as the development UI host with the `/api` proxy.
4. Run `dotnet publish backend/src/API/HoaCommunityEvents.API.csproj -c Release -o C:/Users/victo/AppData/Local/Temp/hoa-bff-publish`.
5. Start the published app and smoke-test `/`, a deep React route, `/health`, `/api/events`, cookie login/current/logout, and the SSE content type.

## Task 12: Consolidate CI/CD without creating production downtime

**Modify:**

- parent `.github/workflows/ci.yml`
- parent `.github/workflows/deploy-api-azure.yml`
- parent `.github/workflows/azure-static-web-apps-blue-moss-0d503960f.yml` only after cutover succeeds

1. Ensure CI tests backend and frontend at their new paths and also verifies `dotnet publish` creates `wwwroot/index.html`.
2. Update the App Service deployment workflow to install Node, publish the combined BFF artifact, and use new EF project/startup paths.
3. Deploy the combined artifact to a staging slot or production App Service and run login/current/logout, role, static-route, upload-signature, and SSE smoke tests.
4. Switch the client-facing URL/custom domain to the App Service.
5. Only after the smoke test passes, disable/remove the old Static Web Apps workflow so it cannot deploy a stale frontend.

## Task 13: Update repository teaching materials and generated architecture data

**Modify:** root `README.md`, `frontend/README.md`, architecture diagram sources/exports, and relevant files under `docs/`.

**Regenerate:** `graphify-out/` using the Graphify skill after all paths settle.

1. Replace every JWT/SignalR/separate-deployment statement with cookie/CSRF/SSE/BFF behavior.
2. Explain the exact folder responsibilities, request pipeline, login lifecycle, role evaluation, SSE flow, Vite development proxy, production bundling, Azure SQL vs Cloudinary storage, and the one-instance SSE constraint.
3. Include both current source paths and “follow this request” walkthroughs suitable for a non-technical presenter.
4. Verify repository searches find no obsolete `TokenKey`, `JwtOptions`, `ITokenService`, `@microsoft/signalr`, `MapHub`, `useSignalR`, or `localStorage.getItem('jwt')` references outside historical design notes.

## Task 14: Update and republish the OpenAI Sites learning guide

**Modify:** `C:/Users/victo/Documents/Codex/2026-08-26/chec/hoa-codebase-guide` using the Sites building skill, then publish using the Sites hosting skill.

1. Preserve the existing Sites project and production URL.
2. Update the interactive folder map to the new `frontend/` and `backend/src|tests` paths.
3. Add deep-linked beginner lessons for:
   - what a BFF is and how this .NET host serves the SPA;
   - cookie creation, encryption, browser sending, middleware reconstruction, logout, and current-user lookup;
   - CSRF threats and the exact token bootstrap/header validation path;
   - SSE framing, EventSource reconnects, broker fan-out, query invalidation, and scale limits;
   - each switch's UI state and submitted API fields;
   - Vite dev proxy versus production publish bundling.
4. Remove or clearly mark the former JWT, localStorage, SignalR, and split Static Web Apps architecture as historical.
5. Run the Sites build, inspect responsive layouts and deep links, publish, and return the live URL.

## Task 15: Final verification and handoff

1. Run `dotnet test backend/HoaCommunityEvents.slnx`.
2. Run frontend `npm run lint`, `npm run test:run`, and `npm run build`.
3. Run a Release `dotnet publish` and local end-to-end smoke test.
4. Inspect `git diff --check`, `git status --short`, and all changed-file diffs; leave unrelated repository-root files untouched.
5. Use the verification-before-completion skill before claiming success.
6. Report the final folder tree, security flow, SSE limitation, test results, published guide URL, and any Azure cutover step that still requires the user's credentials or DNS authority.
