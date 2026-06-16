# Graph Report - HoaCommunityEvents  (2026-06-16)

## Corpus Check
- 161 files · ~40,970 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 976 nodes · 1674 edges · 69 communities (48 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `820028cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 23 edges
2. `HoaEvent` - 22 edges
3. `compilerOptions` - 20 edges
4. `cn()` - 19 edges
5. `compilerOptions` - 16 edges
6. `useStore()` - 15 edges
7. `AccountIntegrationTests` - 14 edges
8. `Button()` - 14 edges
9. `AccountService` - 13 edges
10. `HoaCommunityEvents` - 13 edges

## Surprising Connections (you probably didn't know these)
- `EventService` --implements--> `IEventService`  [EXTRACTED]
  Infrastructure/Services/EventService.cs → Application/Common/Interfaces/IEventService.cs
- `AttendanceService` --implements--> `IAttendanceService`  [EXTRACTED]
  Infrastructure/Services/AttendanceService.cs → Application/Common/Interfaces/IAttendanceService.cs
- `CloudinaryAssetService` --implements--> `ICloudinaryAssetService`  [EXTRACTED]
  Infrastructure/Services/CloudinaryAssetService.cs → Application/Common/Interfaces/ICloudinaryAssetService.cs
- `TokenService` --implements--> `ITokenService`  [EXTRACTED]
  Infrastructure/Services/Identity/TokenService.cs → Application/Common/Interfaces/ITokenService.cs
- `AdminQuickActionsProps` --references--> `HoaEvent`  [EXTRACTED]
  frontend/src/features/home/components/AdminQuickActions.tsx → frontend/src/types/event.ts

## Import Cycles
- None detected.

## Communities (69 total, 21 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (47): AdminConfirmModal(), AdminConfirmModalProps, CATEGORIES, EventsFilterBar(), EventsFilterBarProps, STATUSES, EventsPagination(), EventsPaginationProps (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (45): AdminAttendeeList(), AdminEventList(), AdminEventListProps, AttendanceActionCard(), AttendanceActionCardProps, EventCard(), EventCardProps, UserRole (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (46): ActionResult, AttendeeDto, Authorize, Guid, HttpDelete, HttpGet, HttpPost, IReadOnlyList (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (39): Account, Profiles, Uploads, BRAND, ApiErrorEnvelope, getFieldError(), toApiError(), LoginPage (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (45): dependencies, axios, lucide-react, @microsoft/signalr, mobx, mobx-react-lite, react, react-dom (+37 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (35): HoaCommunityEvents.API, net10.0, Microsoft.EntityFrameworkCore.Design (10.0.8), HoaCommunityEvents.API.Tests, net10.0, Microsoft.NET.Sdk, net10.0, Microsoft.NET.Sdk (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (23): AdminPolicyProbeResult, agent, Attendance, CloudinaryProfileAssetType, CloudinaryUploadScope, CloudinaryUploadSignature, Diagnostics, Events (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (23): ErrorPage(), AppLayout, ProtectedRoute, adminAttendeesPageRoute, adminDashboardPageRoute, adminUserManagementPageRoute, appRoutes, eventDetailsPageRoute (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (20): AdminUserDto, AppUser, ClaimsPrincipal, Code, DeleteUserDto, Errors, IEnumerable, IList (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (16): Migration, HoaCommunityEvents.Persistence.Migrations, InitialCreate, AddCoreEntities, HoaCommunityEvents.Persistence.Migrations, AddProfileBannerImage, HoaCommunityEvents.Persistence.Migrations, AddImageRecenterFocus (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): ClaimsPrincipal, Error, Profile, ProfileDto, StatusCode, Success, Task, UpdateProfileDto (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (13): AccountIntegrationTests, ApiTestFactory, Fact, HttpClient, HttpResponseMessage, JsonDocument, Task, ApiTestFactory (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (18): AttendeeCount, AttendeeDto, Error, Guid, IReadOnlyList, StatusCode, Success, Task (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (17): AdminUserDto, ClaimsPrincipal, Code, DeleteUserDto, Errors, IEnumerable, IReadOnlyList, LoginDto (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (13): AbstractValidator, CreateEventDto, EditEventDto, EventFilterDto, LoginDto, RegisterDto, UpdateProfileDto, CreateEventDtoValidator (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (14): ActionResult, AdminUserDto, AllowAnonymous, Authorize, DeleteUserDto, HttpGet, HttpPost, IReadOnlyList (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (12): CreateEventDto, EditEventDto, Error, Event, EventDto, EventFilterDto, Guid, PagedResultDto (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (12): CreateEventDto, EditEventDto, Error, Event, EventDto, EventFilterDto, Guid, PagedResultDto (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): ApiTestFactory, Fact, HttpClient, HttpResponseMessage, JsonDocument, Task, EventsIntegrationTests, HttpMethod (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (15): makeEvent(), makeFeed(), mockUseAdminUsers, mockUseAttendees, mockUseCancelEvent, mockUseCreateEvent, mockUseDeleteEvent, mockUseDeleteUser (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (15): API (Azure App Service), Azure Deployment Baseline (App Service), Azure Deployment (Validated Runbook), Current Status, Environment Strategy (Demo vs Production), Frontend (Azure Static Web Apps), GitHub Actions (Azure), HoaCommunityEvents (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (9): SeedData, IdentityError, IServiceProvider, AppUser, IConfiguration, IEnumerable, string, Task (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (8): Task, Cloudinary, ILogger, string, Task, ICloudinaryAssetService, Regex, CloudinaryAssetService

### Community 26 - "Community 26"
Cohesion: 0.24
Nodes (6): ApiTestFactory, string, Task, IWebHostBuilder, Program, WebApplicationFactory

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (6): AppUser, IList, TokenService, AppUser, IList, ITokenService

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): Azure Deployment, Getting Started, HOA Community Events Frontend, Notes, Production Troubleshooting, Routes, Scripts, Tech Stack

### Community 29 - "Community 29"
Cohesion: 0.43
Nodes (3): Hub, EventHub, Task

### Community 30 - "Community 30"
Cohesion: 0.47
Nodes (3): IConfiguration, IServiceCollection, ApplicationServiceExtensions

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (3): IConfiguration, StartupValidationExtensions, WebApplication

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (3): BaseEntity, Event, EventAttendance

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (4): AppDbContext, IdentityDbContext, AppUser, ModelBuilder

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (4): AppDbContextModelSnapshot, HoaCommunityEvents.Persistence.Migrations, ModelSnapshot, ModelBuilder

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (3): IConfiguration, IServiceCollection, IdentityServiceExtensions

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (3): Task, HttpContext, ExceptionMiddleware

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (3): HoaCommunityEvents.Persistence.Migrations, InitialCreate, ModelBuilder

### Community 38 - "Community 38"
Cohesion: 0.40
Nodes (3): AddCoreEntities, HoaCommunityEvents.Persistence.Migrations, ModelBuilder

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (3): AddProfileBannerImage, HoaCommunityEvents.Persistence.Migrations, ModelBuilder

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (3): AddImageRecenterFocus, HoaCommunityEvents.Persistence.Migrations, ModelBuilder

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (3): AddImageZoomAndAvatarFocus, HoaCommunityEvents.Persistence.Migrations, ModelBuilder

## Knowledge Gaps
- **368 isolated node(s):** `ApiTestFactory`, `HttpClient`, `HttpResponseMessage`, `Program`, `string` (+363 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HoaEvent` connect `Community 1` to `Community 0`, `Community 3`, `Community 21`, `Community 6`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `LoadingState()` connect `Community 0` to `Community 1`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `AuthStore` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `ApiTestFactory`, `HttpClient`, `HttpResponseMessage` to the rest of the system?**
  _368 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06142410015649452 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06639839034205232 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._