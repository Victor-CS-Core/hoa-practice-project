# Graph Report - HoaCommunityEvents  (2026-09-02)

## Corpus Check
- 254 files · ~94,391 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1748 nodes · 3022 edges · 158 communities (110 shown, 21 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 159 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e306c8a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .AddApplicationServices
- mockApi.ts
- devDependencies
- RecordingLogger
- AppLayout.tsx
- .JoinEventAsync
- HoaCommunityEvents.API.csproj
- HomePage.tsx
- agent.ts
- AdminDashboardPage.tsx
- cn
- routes.tsx
- ProfileEditForm.tsx
- LoginPage.tsx
- .CreateCloudinarySignature
- .WithCsrfAsync
- compilerOptions
- .ApiError
- AccountService
- AdminEventForm.tsx
- HoaCommunityEvents.Persistence.Data
- compilerOptions
- EventDto
- HoaCommunityEvents.Application.DTOs
- .PromoteUserToAdminAsync
- EventService
- EventFilterDto
- Event
- HoaCommunityEvents.Application.Validators
- AppUser
- HOA Community Events BFF, SSE, and Clean Structure Implementation Plan
- AccountController
- http
- LoginResult
- AppDbContext
- ApiTestFactory
- EventsIntegrationTests
- HOA Community Events presenter cheat sheet
- HOA Community Events BFF, SSE, and Clean Structure Design
- AuthStore
- AdminDashboardPage.test.tsx
- dependencies
- ProfileDto
- .SeedRolesAndAdminAsync
- IEventService
- CreateEventDto
- EditEventDto
- .UpdateProfileAsync
- design-system/ui/button.tsx
- HOA Community Events
- UpdateProfileDto
- Design System Migration - Phase 2 Checklist
- scripts
- SpaHostingIntegrationTests
- BaseApiController
- AddImageRecenterFocus
- AddImageZoomAndAvatarFocus
- .Stream_Authenticated_EmitsAttendanceChangedForRequestedEvent
- 18. Questions you should be ready to answer
- HOA Community Events frontend
- .UpdateProfile
- HoaCommunityEvents.API.Tests
- AddCoreEntities
- HOA Community Events: professor-style codebase guide
- EventsFilterBar.tsx
- AdminUserDto
- 11. SSE: how live attendance updates work
- 6. Cookie authentication: construction, protection, sending, reconstruction, current user, and logout
- Design System Migration - Phase 2 Queue
- useEventStream.test.tsx
- HoaCommunityEvents.API.Models
- HoaCommunityEvents.Persistence.Migrations
- .BuildModel
- 5. Controllers, services, DTOs, validation, and EF Core
- package.json
- .AddIdentityServices
- .ValidateStartupConfiguration
- UserDto
- BaseEntity
- CloudinaryAssetService
- InitialCreate
- HealthEndpointTests
- 9. Axios and TanStack Query: why both stay
- MainNavSection.tsx
- dialog.tsx
- .UpdateProfileAsync
- RegisterDto
- 12. Azure SQL and Cloudinary: two stores with different jobs
- 16. Follow these requests end to end
- 17. Five-minute client/boss pitch
- 3. Learn the folders by responsibility
- 7. CSRF: why it exists and how every unsafe request is protected
- Five-minute talk track
- SectionShell.tsx
- ColorSwatch.tsx
- theme.ts
- palette.ts
- rich-text-field.tsx
- .BuildTargetModel
- .BuildTargetModel
- 10. Vite in development and in the .NET production bundle
- 13. Accessible image switches and submitted fields
- 14. Testing strategy and WebApplicationFactory
- 8. Roles, policies, and where they run
- SidebarNav.tsx
- button-dropdown.tsx
- radio.tsx
- theme-toggle.tsx
- 15. Deployment status and the hard cutover gate
- 4. How ASP.NET Core starts and processes a request
- ListingsSection.tsx
- data-table.tsx
- DeleteUserDto
- Frontend Agent Notes
- IconographySection.tsx
- checkbox.tsx
- tsconfig.json
- clsx
- lucide-react
- @milkdown/core
- @milkdown/crepe
- @milkdown/kit
- mobx
- @radix-ui/react-dropdown-menu
- react-dom
- react-easy-crop
- react-hook-form
- react-router-dom
- tailwind-merge
- badge-variants.ts
- button-variants.ts

## God Nodes (most connected - your core abstractions)
1. `EventDto` - 41 edges
2. `HoaCommunityEvents.Application.DTOs` - 35 edges
3. `AppUser` - 34 edges
4. `Event` - 27 edges
5. `HoaEvent` - 22 edges
6. `HOA Community Events: professor-style codebase guide` - 22 edges
7. `ProfileDto` - 21 edges
8. `InMemoryEventUpdateBroker` - 21 edges
9. `useStore()` - 21 edges
10. `installMockApi()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `ApiTestFactory` --references--> `Program`  [EXTRACTED]
  backend/tests/API.Tests/ApiTestFactory.cs → backend/src/API/Program.cs
- `AccountController` --inherits--> `BaseApiController`  [EXTRACTED]
  backend/src/API/Controllers/AccountController.cs → backend/src/API/Controllers/BaseApiController.cs
- `AccountController` --references--> `IAccountService`  [EXTRACTED]
  backend/src/API/Controllers/AccountController.cs → backend/src/Application/Common/Interfaces/IAccountService.cs
- `AttendanceController` --inherits--> `BaseApiController`  [EXTRACTED]
  backend/src/API/Controllers/AttendanceController.cs → backend/src/API/Controllers/BaseApiController.cs
- `EventsController` --inherits--> `BaseApiController`  [EXTRACTED]
  backend/src/API/Controllers/EventsController.cs → backend/src/API/Controllers/BaseApiController.cs

## Import Cycles
- None detected.

## Communities (158 total, 21 thin omitted)

### Community 0 - ".AddApplicationServices"
Cohesion: 0.06
Nodes (46): ApiBehaviorOptions, CancellationToken, Guid, IAsyncEnumerable, EventStreamEndpoints, HttpContext, IConfiguration, IHostEnvironment (+38 more)

### Community 1 - "mockApi.ts"
Cohesion: 0.10
Nodes (25): expectNoA11yViolations(), gotoAndAudit(), AdminDashboardPage, handleAccountRoute(), handleAttendanceRoute(), handleEventRoute(), getApiPath(), getCookie() (+17 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (45): @axe-core/playwright, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, @axe-core/playwright, eslint (+37 more)

### Community 3 - "RecordingLogger"
Cohesion: 0.08
Nodes (32): HttpContext, ILogger, Task, ExceptionMiddleware, ApiErrorResponse, Code, Details, Message (+24 more)

### Community 4 - "AppLayout.tsx"
Cohesion: 0.08
Nodes (28): AppLayout, getInitials(), NavItem, roleToLabel(), queryClient, router, ResolvedTheme, ThemeContext (+20 more)

### Community 5 - ".JoinEventAsync"
Cohesion: 0.09
Nodes (30): ActionResult, Authorize, Guid, HttpDelete, HttpGet, HttpPost, IReadOnlyList, Task (+22 more)

### Community 6 - "HoaCommunityEvents.API.csproj"
Cohesion: 0.06
Nodes (30): net10.0, Microsoft.EntityFrameworkCore.Design (10.0.8), net10.0, Microsoft.NET.Sdk, net10.0, Microsoft.NET.Sdk, net10.0, Microsoft.NET.Sdk (+22 more)

### Community 7 - "HomePage.tsx"
Cohesion: 0.10
Nodes (23): homePageRoute, Badge, BadgeProps, AttendanceActionCardProps, EventCard(), EventCardProps, UserRole, EventInfoPanelProps (+15 more)

### Community 8 - "agent.ts"
Cohesion: 0.09
Nodes (25): Account, AdminPolicyProbeResult, agent, Attendance, CloudinaryProfileAssetType, CloudinaryUploadScope, CloudinaryUploadSignature, Diagnostics (+17 more)

### Community 9 - "AdminDashboardPage.tsx"
Cohesion: 0.17
Nodes (25): useStore(), Select, SelectProps, BackNavigationButton(), BackNavigationButtonProps, AdminDashboardPage(), ConfirmState, FormState (+17 more)

### Community 10 - "cn"
Cohesion: 0.11
Nodes (23): Badge(), BadgeProps, BadgeVariant, Button(), ButtonProps, ButtonSize, ButtonVariant, Card() (+15 more)

### Community 11 - "routes.tsx"
Cohesion: 0.09
Nodes (16): Props, ProtectedRoute, adminAttendeesPageRoute, adminDashboardPageRoute, adminDesignSystemPageRoute, appRoutes, eventDetailsPageRoute, eventListPageRoute (+8 more)

### Community 12 - "ProfileEditForm.tsx"
Cohesion: 0.14
Nodes (19): Uploads, clamp(), FramedImage(), FramedImageProps, Size, ApiErrorEnvelope, ACCEPTED_IMAGE_MIME_TYPES, clampZoom() (+11 more)

### Community 13 - "LoginPage.tsx"
Cohesion: 0.17
Nodes (18): BRAND, adminUserManagementPageRoute, loginPageRoute, registerPageRoute, store, StoreContext, Input, InputProps (+10 more)

### Community 14 - ".CreateCloudinarySignature"
Cohesion: 0.09
Nodes (22): ActionResult, EnableRateLimiting, HttpPost, CloudinarySignatureResponse, ApiKey, CloudName, Folder, PublicId (+14 more)

### Community 15 - ".WithCsrfAsync"
Cohesion: 0.23
Nodes (10): Fact, HttpResponseMessage, JsonDocument, RegistrationPayload, Task, AccountIntegrationTests, RegistrationPayload, HttpClient (+2 more)

### Community 16 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+17 more)

### Community 17 - ".ApiError"
Cohesion: 0.23
Nodes (13): ActionResult, ActionResult, AllowAnonymous, Authorize, Guid, HttpDelete, HttpGet, HttpPost (+5 more)

### Community 18 - "AccountService"
Cohesion: 0.18
Nodes (14): ClaimsPrincipal, Code, Errors, IEnumerable, IList, IReadOnlyList, Message, SignInManager (+6 more)

### Community 19 - "AdminEventForm.tsx"
Cohesion: 0.13
Nodes (15): Switch, SwitchProps, clampCropStart(), clampPercent(), ImageCropEditor(), ImageCropEditorProps, ACCEPTED_IMAGE_MIME_TYPES, AdminEventForm() (+7 more)

### Community 20 - "HoaCommunityEvents.Persistence.Data"
Cohesion: 0.16
Nodes (9): AppRoles, CsrfTokenResponse, RequestToken, HoaCommunityEvents.Infrastructure.Services.Identity, HoaCommunityEvents.Domain.Common, HoaCommunityEvents.Infrastructure.Services.Profiles, HoaCommunityEvents.Infrastructure.Services, HoaCommunityEvents.Domain.Entities (+1 more)

### Community 21 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 22 - "EventDto"
Cohesion: 0.10
Nodes (19): DateTime, Guid, EventDto, Category, Description, EndDate, HostDisplayName, HostUserId (+11 more)

### Community 23 - "HoaCommunityEvents.Application.DTOs"
Cohesion: 0.19
Nodes (6): AuthorizationPolicies, RateLimitPolicies, HoaCommunityEvents.Application.DTOs, HoaCommunityEvents.API.Controllers, HoaCommunityEvents.Application.Common.Interfaces, HoaCommunityEvents.API.Extensions

### Community 24 - ".PromoteUserToAdminAsync"
Cohesion: 0.19
Nodes (12): ClaimsPrincipal, Code, Errors, IEnumerable, IReadOnlyList, Message, StatusCode, Task (+4 more)

### Community 25 - "EventService"
Cohesion: 0.27
Nodes (9): Task, ICloudinaryAssetService, Error, Event, Guid, StatusCode, Success, Task (+1 more)

### Community 26 - "EventFilterDto"
Cohesion: 0.12
Nodes (14): EventFilterDto, Category, IncludePending, Page, PageSize, SortBy, Status, IReadOnlyList (+6 more)

### Community 27 - "Event"
Cohesion: 0.11
Nodes (18): DateTime, ICollection, Event, Attendances, Category, Description, EndDate, Host (+10 more)

### Community 28 - "HoaCommunityEvents.Application.Validators"
Cohesion: 0.15
Nodes (8): AbstractValidator, CreateEventDtoValidator, EditEventDtoValidator, EventFilterDtoValidator, LoginDtoValidator, RegisterDtoValidator, UpdateProfileDtoValidator, HoaCommunityEvents.Application.Validators

### Community 29 - "AppUser"
Cohesion: 0.12
Nodes (16): DateTime, ICollection, AppUser, Attendances, BannerImagePositionX, BannerImagePositionY, BannerImageUrl, BannerImageZoom (+8 more)

### Community 30 - "HOA Community Events BFF, SSE, and Clean Structure Implementation Plan"
Cohesion: 0.12
Nodes (16): HOA Community Events BFF, SSE, and Clean Structure Implementation Plan, Task 10: Introduce and apply the accessible image-setting switch, Task 11: Build and serve the SPA from the .NET BFF, Task 12: Consolidate CI/CD without creating production downtime, Task 13: Update repository teaching materials and generated architecture data, Task 14: Update and republish the OpenAI Sites learning guide, Task 15: Final verification and handoff, Task 1: Establish a green baseline and record the move map (+8 more)

### Community 31 - "AccountController"
Cohesion: 0.32
Nodes (9): ActionResult, AllowAnonymous, Authorize, EnableRateLimiting, HttpGet, HttpPost, IReadOnlyList, Task (+1 more)

### Community 32 - "http"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 33 - "LoginResult"
Cohesion: 0.17
Nodes (10): LoginDto, Email, Password, LoginFailureReason, InvalidCredentials, LockedOut, None, LoginResult (+2 more)

### Community 34 - "AppDbContext"
Cohesion: 0.13
Nodes (15): DateTime, Guid, EventAttendance, Event, EventId, JoinedAt, User, UserId (+7 more)

### Community 35 - "ApiTestFactory"
Cohesion: 0.17
Nodes (11): DbContextOptions, IdentityRole, IWebHostBuilder, RoleManager, Task, UserManager, ApiTestFactory, IWebHostBuilder (+3 more)

### Community 36 - "EventsIntegrationTests"
Cohesion: 0.22
Nodes (8): Fact, HttpClient, HttpMethod, HttpRequestMessage, HttpResponseMessage, JsonDocument, Task, EventsIntegrationTests

### Community 37 - "HOA Community Events presenter cheat sheet"
Cohesion: 0.12
Nodes (16): Architecture in 20 seconds, Axios versus TanStack Query, Deployment status answer, Historical words to correct immediately, HOA Community Events presenter cheat sheet, Image upload and switch answer, Know these folders, Last-minute self-check (+8 more)

### Community 38 - "HOA Community Events BFF, SSE, and Clean Structure Design"
Cohesion: 0.12
Nodes (15): Accepted Tradeoffs, Axios and TanStack Query Are Different Layers, Cookie Authentication and CSRF, Goals, HOA Community Events BFF, SSE, and Clean Structure Design, Login sequence, Non-goals, Production Runtime Boundary (+7 more)

### Community 39 - "AuthStore"
Cohesion: 0.13
Nodes (8): AuthStore, mockClear, mockCurrent, mockLogin, mockLogout, mockRegister, resident, RootStore

### Community 40 - "AdminDashboardPage.test.tsx"
Cohesion: 0.14
Nodes (15): makeEvent(), makeFeed(), mockUseAdminUsers, mockUseAttendees, mockUseCancelEvent, mockUseCreateEvent, mockUseDeleteEvent, mockUseDeleteUser (+7 more)

### Community 41 - "dependencies"
Cohesion: 0.13
Nodes (15): axios, class-variance-authority, dependencies, axios, class-variance-authority, @milkdown/react, mobx-react-lite, @radix-ui/react-dialog (+7 more)

### Community 42 - "ProfileDto"
Cohesion: 0.13
Nodes (14): ProfileDto, BannerImagePositionX, BannerImagePositionY, BannerImageUrl, BannerImageZoom, Bio, DisplayName, Email (+6 more)

### Community 43 - ".SeedRolesAndAdminAsync"
Cohesion: 0.26
Nodes (10): IConfiguration, IdentityRole, IEnumerable, RoleManager, Task, UserManager, SeedData, IdentityError (+2 more)

### Community 44 - "IEventService"
Cohesion: 0.40
Nodes (7): Error, Event, Guid, StatusCode, Success, Task, IEventService

### Community 45 - "CreateEventDto"
Cohesion: 0.14
Nodes (13): DateTime, CreateEventDto, Category, Description, EndDate, ImagePositionX, ImagePositionY, ImageUrl (+5 more)

### Community 46 - "EditEventDto"
Cohesion: 0.14
Nodes (13): DateTime, EditEventDto, Category, Description, EndDate, ImagePositionX, ImagePositionY, ImageUrl (+5 more)

### Community 47 - ".UpdateProfileAsync"
Cohesion: 0.21
Nodes (9): ClaimsPrincipal, Error, IList, Profile, StatusCode, Success, Task, UserManager (+1 more)

### Community 48 - "design-system/ui/button.tsx"
Cohesion: 0.22
Nodes (7): Button, ButtonProps, AdminConfirmModal(), AdminConfirmModalProps, AttendanceActionCard(), EventsPagination(), EventsPaginationProps

### Community 49 - "HOA Community Events"
Cohesion: 0.15
Nodes (13): Architecture diagrams, Build and test, Deployment status and cutover gate, Historical terminology, HOA Community Events, Image controls and storage, Local development, Realtime attendance (+5 more)

### Community 50 - "UpdateProfileDto"
Cohesion: 0.17
Nodes (11): UpdateProfileDto, BannerImagePositionX, BannerImagePositionY, BannerImageUrl, BannerImageZoom, Bio, DisplayName, ProfileImagePositionX (+3 more)

### Community 51 - "Design System Migration - Phase 2 Checklist"
Cohesion: 0.17
Nodes (11): Current Status (2026-06-18), Design System Migration - Phase 2 Checklist, Entry Gates (must pass), Exit Criteria (Phase 2 complete), Gate A - Primitive Convergence, Gate B - Token Convergence, Gate C - Theme Convergence, Gate D - Verification (+3 more)

### Community 52 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, lint, preview, test, test:coverage, test:e2e (+4 more)

### Community 53 - "SpaHostingIntegrationTests"
Cohesion: 0.22
Nodes (7): ApiErrorContract, Fact, Task, ApiErrorContract, SpaHostingIntegrationTests, IDisposable, SpaTestFactory

### Community 54 - "BaseApiController"
Cohesion: 0.18
Nodes (8): BaseApiController, ActionResult, HttpGet, SecurityController, AntiforgeryTokenDto, RequestToken, ControllerBase, IAntiforgery

### Community 55 - "AddImageRecenterFocus"
Cohesion: 0.20
Nodes (6): MigrationBuilder, DateTime, DateTimeOffset, Guid, ModelBuilder, AddImageRecenterFocus

### Community 56 - "AddImageZoomAndAvatarFocus"
Cohesion: 0.20
Nodes (6): MigrationBuilder, DateTime, DateTimeOffset, Guid, ModelBuilder, AddImageZoomAndAvatarFocus

### Community 57 - ".Stream_Authenticated_EmitsAttendanceChangedForRequestedEvent"
Cohesion: 0.27
Nodes (7): CancellationToken, Fact, Func, RegistrationPayload, Task, EventStreamIntegrationTests, RegistrationPayload

### Community 58 - "18. Questions you should be ready to answer"
Cohesion: 0.18
Nodes (11): 18. Questions you should be ready to answer, “Can this scale to multiple API instances today?”, “Does SSE send the new attendee list?”, “How do the switches affect persisted data?”, “Is a cookie just another token?”, “What Azure storage holds the images?”, “What is WebApplicationFactory?”, “Where does authorization actually happen?” (+3 more)

### Community 59 - "HOA Community Events frontend"
Cohesion: 0.18
Nodes (11): Authentication and CSRF, Development, HOA Community Events frontend, Image switches and uploads, Production publishing, Responsibilities, Routes, Scripts (+3 more)

### Community 60 - ".UpdateProfile"
Cohesion: 0.27
Nodes (7): ActionResult, HttpGet, HttpPut, Task, ProfilesController, Task, IProfileService

### Community 61 - "HoaCommunityEvents.API.Tests"
Cohesion: 0.27
Nodes (3): HoaCommunityEvents.API.Tests, HoaCommunityEvents.Infrastructure.Realtime, HoaCommunityEvents.Application.Common.Realtime

### Community 62 - "AddCoreEntities"
Cohesion: 0.22
Nodes (6): DateTime, DateTimeOffset, Guid, MigrationBuilder, AddCoreEntities, Migration

### Community 63 - "HOA Community Events: professor-style codebase guide"
Cohesion: 0.20
Nodes (10): 19. Historical architecture: do not describe this as current, 1. The whole platform in one mental model, 20. Primary-source reference shelf, 21. Retrieval practice: test whether you really know it, 2. Beginner vocabulary, with official definitions, ASP.NET Core terms, Data and browser terms, Frontend, backend, API, and HTTP (+2 more)

### Community 64 - "EventsFilterBar.tsx"
Cohesion: 0.27
Nodes (8): CATEGORIES, EventsFilterBar(), EventsFilterBarProps, STATUSES, ADMIN_EVENT_STATUS_FILTER_OPTIONS, EVENT_CATEGORY_FILTER_OPTIONS, EVENT_STATUS_FILTER_OPTIONS, EventFilter

### Community 65 - "AdminUserDto"
Cohesion: 0.22
Nodes (8): AdminUserDto, CanDelete, DisplayName, Email, IsMasterAdmin, ProfileImageUrl, Role, Username

### Community 66 - "11. SSE: how live attendance updates work"
Cohesion: 0.22
Nodes (9): 11. SSE: how live attendance updates work, Broker mechanics, Browser invalidation, Credible alternatives, Publish after commit, Reconnect and cleanup, Stream connection, The single-instance limit (+1 more)

### Community 67 - "6. Cookie authentication: construction, protection, sending, reconstruction, current user, and logout"
Cohesion: 0.22
Nodes (9): 401 versus 403, 6. Cookie authentication: construction, protection, sending, reconstruction, current user, and logout, First, what changed conceptually?, How current-user restoration works, How later requests become authenticated, How logout works, Identity configuration, The exact login sequence (+1 more)

### Community 68 - "Design System Migration - Phase 2 Queue"
Cohesion: 0.22
Nodes (8): Design System Migration - Phase 2 Queue, Prioritization Logic, Progress Log, Validation Checklist Per Wave, Wave 1 - App Shell and Shared Controls, Wave 2 - Events Core Pages, Wave 3 - Events Components, Wave 4 - Profiles and Home

### Community 69 - "useEventStream.test.tsx"
Cohesion: 0.22
Nodes (3): Listener, MockEventSource, queryKeys

### Community 70 - "HoaCommunityEvents.API.Models"
Cohesion: 0.32
Nodes (4): Program, HoaCommunityEvents.API.Middleware, HoaCommunityEvents.API.Endpoints, HoaCommunityEvents.API.Models

### Community 71 - "HoaCommunityEvents.Persistence.Migrations"
Cohesion: 0.32
Nodes (3): MigrationBuilder, AddProfileBannerImage, HoaCommunityEvents.Persistence.Migrations

### Community 72 - ".BuildModel"
Cohesion: 0.25
Nodes (6): DateTime, DateTimeOffset, Guid, ModelBuilder, AppDbContextModelSnapshot, ModelSnapshot

### Community 73 - "5. Controllers, services, DTOs, validation, and EF Core"
Cohesion: 0.25
Nodes (8): 5. Controllers, services, DTOs, validation, and EF Core, Controllers: the HTTP boundary, DTOs: the boundary shapes, EF Core and SQL, Follow this request: create an event, Follow this request: load the event list, Services, Validation

### Community 74 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, form-data, undici, private, type, version

### Community 75 - ".AddIdentityServices"
Cohesion: 0.29
Nodes (6): IConfiguration, IdentityRole, IHostEnvironment, IServiceCollection, SignInManager, IdentityServiceExtensions

### Community 76 - ".ValidateStartupConfiguration"
Cohesion: 0.33
Nodes (4): IConfiguration, StartupValidationExtensions, ILoggerFactory, WebApplication

### Community 77 - "UserDto"
Cohesion: 0.29
Nodes (6): UserDto, DisplayName, Email, ProfileImageUrl, Role, Username

### Community 78 - "BaseEntity"
Cohesion: 0.29
Nodes (6): DateTime, Guid, BaseEntity, CreatedAt, Id, UpdatedAt

### Community 79 - "CloudinaryAssetService"
Cohesion: 0.33
Nodes (5): ILogger, Task, CloudinaryAssetService, Cloudinary, Regex

### Community 80 - "InitialCreate"
Cohesion: 0.33
Nodes (3): MigrationBuilder, ModelBuilder, InitialCreate

### Community 81 - "HealthEndpointTests"
Cohesion: 0.29
Nodes (5): Fact, HttpClient, Task, HealthEndpointTests, IClassFixture

### Community 82 - "9. Axios and TanStack Query: why both stay"
Cohesion: 0.29
Nodes (7): 9. Axios and TanStack Query: why both stay, Axios is the HTTP transport, Could one library do both?, Exact trace: event detail, MobX does not replace either one, Ponytail decision, TanStack Query is the server-state manager

### Community 84 - "dialog.tsx"
Cohesion: 0.29
Nodes (4): DialogContent, DialogDescription, DialogOverlay, DialogTitle

### Community 85 - ".UpdateProfileAsync"
Cohesion: 0.33
Nodes (5): ClaimsPrincipal, Error, Profile, StatusCode, Success

### Community 86 - "RegisterDto"
Cohesion: 0.33
Nodes (5): RegisterDto, DisplayName, Email, Password, Username

### Community 87 - "12. Azure SQL and Cloudinary: two stores with different jobs"
Cohesion: 0.33
Nodes (6): 12. Azure SQL and Cloudinary: two stores with different jobs, Cleanup, Follow this request: upload an event image, Is Azure Storage used?, What Azure SQL stores, What Cloudinary stores

### Community 88 - "16. Follow these requests end to end"
Cohesion: 0.33
Nodes (6): 16. Follow these requests end to end, A. Restore a session after refresh, B. Resident joins an event, C. Admin publishes an event, D. Edit a profile and turn the banner off, E. Directly open `/events/123` in production

### Community 89 - "17. Five-minute client/boss pitch"
Cohesion: 0.33
Nodes (6): 17. Five-minute client/boss pitch, Minute 0–1: product, Minute 1–2: architecture, Minute 2–3: security, Minute 3–4: data and realtime, Minute 4–5: delivery and quality

### Community 90 - "3. Learn the folders by responsibility"
Cohesion: 0.33
Nodes (6): 3. Learn the folders by responsibility, Backend projects, Frontend folders, Other frontend technologies and where they actually run, Project dependency direction, Top level

### Community 91 - "7. CSRF: why it exists and how every unsafe request is protected"
Cohesion: 0.33
Nodes (6): 7. CSRF: why it exists and how every unsafe request is protected, Browser implementation, Server implementation, Swagger, The threat, Why the antiforgery cookie is HttpOnly if JavaScript needs a token

### Community 92 - "Five-minute talk track"
Cohesion: 0.33
Nodes (6): 0:00–1:00 — Product, 1:00–2:00 — Structure, 2:00–3:00 — Security, 3:00–4:00 — Data and live updates, 4:00–5:00 — Build, tests, delivery, Five-minute talk track

### Community 93 - "SectionShell.tsx"
Cohesion: 0.40
Nodes (3): CodeBlock(), CodeBlockProps, SectionShellProps

### Community 94 - "ColorSwatch.tsx"
Cohesion: 0.40
Nodes (4): ColorSwatch(), ColorSwatchProps, CopyableHexProps, useIsDark()

### Community 95 - "theme.ts"
Cohesion: 0.53
Nodes (5): applyTheme(), getStoredTheme(), getSystemPreference(), Theme, useTheme()

### Community 96 - "palette.ts"
Cohesion: 0.33
Nodes (5): FONTS, PaletteEntry, SPLASH, SURFACES, TEXT

### Community 97 - "rich-text-field.tsx"
Cohesion: 0.53
Nodes (5): detectCurrentList(), ListMode, RichTextField, RichTextFieldProps, toggleListMode()

### Community 98 - ".BuildTargetModel"
Cohesion: 0.40
Nodes (4): DateTime, DateTimeOffset, Guid, ModelBuilder

### Community 99 - ".BuildTargetModel"
Cohesion: 0.40
Nodes (4): DateTime, DateTimeOffset, Guid, ModelBuilder

### Community 100 - "10. Vite in development and in the .NET production bundle"
Cohesion: 0.40
Nodes (5): 10. Vite in development and in the .NET production bundle, How .NET packages the frontend, How the production build works, What Vite does in development, Why this is a BFF improvement

### Community 101 - "13. Accessible image switches and submitted fields"
Cohesion: 0.40
Nodes (5): 13. Accessible image switches and submitted fields, Event form behavior, Profile form behavior, Tests, Why a switch instead of an “Enabled/Disabled” action button?

### Community 102 - "14. Testing strategy and WebApplicationFactory"
Cohesion: 0.40
Nodes (5): 14. Testing strategy and WebApplicationFactory, Backend integration tests, CI, Frontend unit/component tests, Playwright browser tests

### Community 103 - "8. Roles, policies, and where they run"
Cohesion: 0.40
Nodes (5): 8. Roles, policies, and where they run, Frontend role checks are not the security boundary, The policies, The roles, Where a role travels

### Community 104 - "SidebarNav.tsx"
Cohesion: 0.40
Nodes (3): NAV, NavGroup, SidebarNavProps

### Community 105 - "button-dropdown.tsx"
Cohesion: 0.40
Nodes (4): ButtonDropdown, ButtonDropdownProps, Size, Variant

### Community 106 - "radio.tsx"
Cohesion: 0.40
Nodes (4): Radio, RadioGroup, RadioGroupProps, RadioProps

### Community 107 - "theme-toggle.tsx"
Cohesion: 0.40
Nodes (3): OPTIONS, ThemeOption, ThemeToggleProps

### Community 109 - "15. Deployment status and the hard cutover gate"
Cohesion: 0.50
Nodes (4): 15. Deployment status and the hard cutover gate, Current workflow state, Required gate before disabling the old deployment, Target production shape

### Community 110 - "4. How ASP.NET Core starts and processes a request"
Cohesion: 0.50
Nodes (4): 4. How ASP.NET Core starts and processes a request, Build phase, Rate-limit details, Request pipeline order

### Community 112 - "data-table.tsx"
Cohesion: 0.50
Nodes (3): DataRow, DataRowProps, DataTable

## Knowledge Gaps
- **596 isolated node(s):** `Scope`, `ProfileAssetType`, `CloudName`, `ApiKey`, `Timestamp` (+591 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 863 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppUser` connect `AppUser` to `AppDbContext`, `ApiTestFactory`, `.AddIdentityServices`, `.SeedRolesAndAdminAsync`, `.UpdateProfileAsync`, `.ApiError`, `AccountService`, `Event`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `EventDto` connect `EventDto` to `.JoinEventAsync`, `IEventService`, `.ApiError`, `EventService`, `EventFilterDto`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `HoaCommunityEvents.Application.DTOs` connect `HoaCommunityEvents.Application.DTOs` to `AdminUserDto`, `LoginResult`, `.JoinEventAsync`, `ProfileDto`, `CreateEventDto`, `EditEventDto`, `UserDto`, `DeleteUserDto`, `UpdateProfileDto`, `HoaCommunityEvents.Persistence.Data`, `BaseApiController`, `EventDto`, `.PromoteUserToAdminAsync`, `RegisterDto`, `EventFilterDto`, `HoaCommunityEvents.Application.Validators`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `Scope`, `ProfileAssetType`, `CloudName` to the rest of the system?**
  _596 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.AddApplicationServices` be split into smaller, more focused modules?**
  _Cohesion score 0.059676044330775786 - nodes in this community are weakly interconnected._
- **Should `mockApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10030165912518854 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._