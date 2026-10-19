# HOA Community Events: architecture FAQ

Reviewed October 19, 2026 against the repository source. This is a concise learning companion to the [full codebase guide](HOA-CODEBASE-GUIDE.md), not a live Azure audit.

Language: **English** | [Español](#versión-en-español)

## Contents

1. [Why use both TanStack Query and Axios?](#1-why-use-both-tanstack-query-and-axios)
2. [What does Azure store if Cloudinary stores images?](#2-what-does-azure-store-if-cloudinary-stores-images)
3. [What is CDN delivery?](#3-what-is-cdn-delivery)
4. [What is the application's security flow?](#4-what-is-the-applications-security-flow)
5. [What is middleware, and how does it work here?](#5-what-is-middleware-and-how-does-it-work-here)
6. [How does the Vite bundle work?](#6-how-does-the-vite-bundle-work)
7. [Why use SSE now, and what else could deliver live updates?](#7-why-use-sse-now-and-what-else-could-deliver-live-updates)
8. [What are roles, and where do they run?](#8-what-are-roles-and-where-do-they-run)
9. [What is WebApplicationFactory?](#9-what-is-webapplicationfactory)
10. [Why keep frontend and backend folders if production is one application?](#10-why-keep-frontend-and-backend-folders-if-production-is-one-application)
11. [Is CI implemented, and how does it work?](#11-is-ci-implemented-and-how-does-it-work)

## The whole application at a glance

```text
Browser
  -> React pages
  -> TanStack Query manages server data
  -> Axios sends HTTP requests
  -> ASP.NET Core middleware and endpoints
  -> application services and EF Core
  -> Azure SQL

Browser -> Cloudinary for signed image uploads and image delivery
Server  -> Cloudinary when an owned image must be deleted
```

The frontend executes in the user's browser. The backend executes in Azure App Service. In production, ASP.NET Core serves both the built frontend files and the API from one origin.

## 1. Why use both TanStack Query and Axios?

They solve different problems.

| Tool | Responsibility |
| --- | --- |
| Axios | Send HTTP requests and handle transport details |
| TanStack Query | Manage the lifecycle of data received from the server |

Axios owns this project's shared HTTP behavior in [`agent.ts`](../frontend/src/app/api/agent.ts):

- Use `/api` as the base URL.
- Include cookies.
- Fetch and attach CSRF tokens to unsafe requests.
- Recognize authenticated requests that fail with `401`.
- Return typed response bodies.

TanStack Query owns behavior such as:

- Loading and error state.
- Caching server responses.
- Deduplicating matching requests.
- Refetching stale data.
- Running mutations.
- Invalidating related cache entries after a write or SSE notice.

For example, [`useEvents.ts`](../frontend/src/hooks/useEvents.ts) asks an Axios-backed API function to perform the request, then TanStack Query stores and synchronizes the result.

```text
React component -> TanStack Query -> Axios -> ASP.NET API
                    data lifecycle    HTTP
```

Both libraries are not strictly required. TanStack Query could call the browser's native `fetch` API through a custom wrapper, making Axios removable. Axios alone could send every request, but the application would then need to implement caching, deduplication, invalidation, and loading state itself.

For this application, keeping both is reasonable because the Axios layer centralizes cookie and CSRF behavior while TanStack Query prevents server-state logic from being rebuilt in components.

## 2. What does Azure store if Cloudinary stores images?

Azure and Cloudinary store different kinds of data.

| Service | Responsibility |
| --- | --- |
| Azure App Service | Runs ASP.NET Core and contains the published React files |
| Azure SQL | Stores structured application records |
| Cloudinary | Stores, transforms, and delivers image files |

Azure SQL stores:

- Accounts, password hashes, and Identity roles.
- Events and event status.
- Attendance relationships.
- Profile data.
- Cloudinary image URLs.
- Image crop position and zoom values.

Cloudinary stores the actual JPEG, PNG, or WebP bytes. For example, [`Event.cs`](../backend/src/Domain/Entities/Event.cs) stores `ImageUrl`, `ImagePositionX`, `ImagePositionY`, and `ImageZoom`; it does not contain the image file.

The upload flow is:

```text
Browser requests signed upload parameters from ASP.NET
  -> ASP.NET returns a short-lived Cloudinary signature
  -> browser uploads image bytes directly to Cloudinary
  -> Cloudinary returns an image URL
  -> browser submits that URL and crop settings to ASP.NET
  -> ASP.NET stores them in Azure SQL
```

Azure offers Blob Storage as a product, but this repository does not use it. Cloudinary fills the user-media storage role.

## 3. What is CDN delivery?

A **content delivery network**, or CDN, serves files from a distributed network of locations instead of making every user download from one central server.

When a browser requests a Cloudinary image:

1. Cloudinary selects a nearby CDN location.
2. That location may already have a cached copy.
3. The image travels a shorter path to the user.
4. Cloudinary can resize, crop, compress, or change the image format before delivery.

```text
User in one region -> nearby CDN location -> Cloudinary image
User in another     -> different CDN location -> same image
```

The `ImageUrl` in Azure SQL tells the browser where to request the image. Azure SQL is not involved in delivering the image bytes.

## 4. What is the application's security flow?

The application uses ASP.NET Core Identity cookie authentication. It does not store a JWT in browser JavaScript storage.

### Login

```text
Browser gets CSRF token and antiforgery cookie
  -> browser posts email and password with CSRF header
  -> ASP.NET validates the CSRF pair
  -> Identity loads the user from Azure SQL
  -> Identity verifies the password hash and lockout rules
  -> server issues the protected HttpOnly authentication cookie
  -> response returns user information, not an authentication token
```

The Axios request interceptor in [`agent.ts`](../frontend/src/app/api/agent.ts) obtains the CSRF token. [`SecurityController.cs`](../backend/src/API/Controllers/SecurityController.cs) creates the antiforgery token pair, and [`AccountController.cs`](../backend/src/API/Controllers/AccountController.cs) exposes registration, login, current-user, and logout endpoints.

### Later requests

The browser automatically includes the `HoaCommunityEvents.Auth` cookie on matching requests. ASP.NET Core then:

1. Validates and unprotects the cookie.
2. Reconstructs `HttpContext.User` and its role claims.
3. Evaluates the endpoint's authorization policy.
4. Runs the endpoint only when authorization succeeds.

`401 Unauthorized` means there is no accepted authenticated identity. `403 Forbidden` means the identity is accepted but does not satisfy the required role policy.

### CSRF protection

Cookies are sent automatically by browsers, which creates a cross-site request forgery risk. Every controller `POST`, `PUT`, `PATCH`, or `DELETE` therefore requires both:

- The HttpOnly antiforgery cookie.
- Its matching request token in the `X-CSRF-TOKEN` header.

### Cookie settings

[`IdentityServiceExtensions.cs`](../backend/src/API/Extensions/IdentityServiceExtensions.cs) configures the authentication cookie to be:

- Named `HoaCommunityEvents.Auth`.
- HttpOnly so browser JavaScript cannot read it.
- HTTPS-only outside development.
- `SameSite=Lax`.
- Valid for eight hours with sliding expiration.

Identity locks an account for 15 minutes after five failed sign-in attempts.

### Cloudinary security

The Cloudinary API secret remains on the server. An authenticated user asks [`UploadsController.cs`](../backend/src/API/Controllers/UploadsController.cs) for signed upload parameters, then uploads directly to Cloudinary. Upload-signature requests are rate-limited.

Other server protections include HTTPS redirection, configured CORS origins, global and endpoint-specific rate limits, input validation, generic exception responses, and backend role authorization.

## 5. What is middleware, and how does it work here?

Middleware is an ordered component in the ASP.NET Core request pipeline. It can inspect or change a request, call the next component, stop processing early, and inspect the response on its return journey.

Conceptually:

```csharp
async Task Middleware(HttpContext context, RequestDelegate next)
{
    // Work before later pipeline components.
    await next(context);
    // Work while the response returns.
}
```

[`Program.cs`](../backend/src/API/Program.cs) assembles this application's pipeline:

```text
Incoming request
  -> exception handling
  -> HTTPS redirection
  -> default and static files
  -> CORS
  -> rate limiting
  -> authentication
  -> authorization
  -> controller or SSE endpoint
  -> response returns through the pipeline
```

Order matters. Authentication must run before authorization because authorization needs the reconstructed user. Static files run earlier and can return a matching React asset without invoking an API controller.

[`ExceptionMiddleware.cs`](../backend/src/API/Middleware/ExceptionMiddleware.cs) wraps later processing. It logs an unhandled exception and returns a generic JSON error with a trace ID instead of exposing an internal stack trace.

CSRF validation is related pipeline behavior, but here it is registered as a global MVC **filter**, not ordinary middleware. The filter runs for unsafe controller actions before the action body executes. It is configured in [`ApplicationServiceExtensions.cs`](../backend/src/API/Extensions/ApplicationServiceExtensions.cs).

## 6. How does the Vite bundle work?

A Vite production bundle is the browser-ready collection of HTML, JavaScript, CSS, and public assets generated from the frontend source.

### Development

Running `npm run dev` starts Vite. It:

- Serves [`index.html`](../frontend/index.html).
- Transforms TypeScript, React JSX, and CSS on demand.
- updates changed modules through Hot Module Replacement.
- Proxies `/api` and `/health` to the local ASP.NET server through [`vite.config.ts`](../frontend/vite.config.ts).

```text
Browser -> Vite development server -> local ASP.NET API proxy
```

### Production

`npm run build` runs `tsc -b` and then `vite build`. Vite starts from `index.html`, follows the import graph through [`main.tsx`](../frontend/src/main.tsx), removes unused code, minifies output, extracts CSS, and writes hashed files to `frontend/dist/`.

```text
Source                              Production output
/src/main.tsx                 ->    /assets/index-[hash].js
imported application styles   ->    /assets/index-[hash].css
lazy page imports             ->    separate page chunks
```

The content hash changes when a file's content changes, so a browser can distinguish a new deployment from an older cached asset.

Routes in [`routes.tsx`](../frontend/src/app/router/routes.tsx) use `lazy(() => import(...))`. Those dynamic imports create separate page chunks, allowing the browser to download an admin or event-details page only when it is needed.

### Combined publish

During `dotnet publish`, [`HoaCommunityEvents.API.csproj`](../backend/src/API/HoaCommunityEvents.API.csproj):

1. Runs `npm ci`.
2. Runs the frontend production build.
3. Copies `frontend/dist/**` into the published application's `wwwroot/**`.

ASP.NET Core serves those static files. An unknown non-API route returns `index.html`, allowing React Router to handle deep links such as `/events/{id}`. Unknown `/api/**` routes return a JSON `404` instead.

Everything in a frontend bundle is public and inspectable. Database credentials, Cloudinary secrets, and other trusted values must remain in backend configuration.

## 7. Why use SSE now, and what else could deliver live updates?

**Server-sent events**, or SSE, let the server send named text events over a long-lived HTTP response. Attendance updates currently require only a low-frequency, one-way notice from server to browser.

```text
Resident joins or leaves
  -> attendance transaction commits in Azure SQL
  -> in-memory broker publishes attendance-changed
  -> SSE sends the notice to connected event pages
  -> TanStack Query marks related cache entries stale
  -> browser refetches authoritative JSON
```

The notice does not contain the new attendee list. It says that cached data may be stale. This keeps the real data path in the normal authenticated JSON API.

SSE fits the current requirement because:

- Native browser `EventSource` requires no frontend package.
- It automatically reconnects after a dropped connection.
- It uses ordinary HTTP and the same-origin authentication cookie.
- It is simpler than a bidirectional real-time framework.

[`EventStreamEndpoints.cs`](../backend/src/API/Endpoints/EventStreamEndpoints.cs) authenticates the stream and verifies event visibility. [`InMemoryEventUpdateBroker.cs`](../backend/src/Infrastructure/Realtime/InMemoryEventUpdateBroker.cs) fans notices out to subscribers. [`useEventStream.ts`](../frontend/src/hooks/useEventStream.ts) invalidates the event, event-list, and attendee query keys.

### Alternatives

| Technology | Best fit | Main trade-off |
| --- | --- | --- |
| Polling with TanStack Query | Simple, low-traffic updates | Repeated requests and delayed updates |
| Raw WebSockets | High-frequency two-way communication | The app must own protocol, reconnect, authentication, and scaling logic |
| SignalR | .NET hubs, groups, and richer two-way messaging | More client/server machinery; scaling still needs shared infrastructure |
| Azure SignalR Service or Web PubSub | Managed fan-out across multiple instances | Additional service cost and Azure coupling |
| Shared broker plus SSE | Preserve the simple browser SSE interface while scaling publishers | Requires Redis or another shared message system |

The current broker lives in one App Service process. If two instances run, a write on one instance cannot notify a stream connected to the other. Keep the current SSE design for the one-instance MVP. For multi-instance production, introduce shared distribution or a managed real-time service.

## 8. What are roles, and where do they run?

Roles are named permission groups assigned to Identity users. [`AppRoles.cs`](../backend/src/Domain/Common/AppRoles.cs) defines:

- `resident`
- `hoa_admin`

Role definitions and user-role memberships are persisted in Azure SQL through ASP.NET Core Identity tables. The authoritative checks execute in the ASP.NET Core backend on Azure App Service:

```text
Authentication cookie
  -> authentication reconstructs the user and role claims
  -> authorization evaluates the endpoint policy
  -> endpoint runs, returns 401, or returns 403
```

[`IdentityServiceExtensions.cs`](../backend/src/API/Extensions/IdentityServiceExtensions.cs) defines two policies:

- `AdminOnly` requires `hoa_admin`.
- `ResidentOrAdmin` accepts either `resident` or `hoa_admin`.

A policy is a named authorization rule, not another role. Controllers and SSE endpoints attach the appropriate policy to protected operations.

The React application also reads the returned role. [`ProtectedRoute.tsx`](../frontend/src/app/router/ProtectedRoute.tsx) redirects users away from unavailable pages, and components hide actions that do not fit the current role. These browser checks improve the experience but are not security boundaries: users control their browsers and can call the API directly. Backend authorization remains authoritative.

## 9. What is WebApplicationFactory?

`WebApplicationFactory<TEntryPoint>` is an ASP.NET Core integration-test utility. It boots the real application inside the test process and provides an `HttpClient` without requiring an Azure deployment or normally opening a network port.

This project defines [`ApiTestFactory.cs`](../backend/tests/API.Tests/ApiTestFactory.cs) as a `WebApplicationFactory<Program>`. Requests travel through most of the real backend:

```text
Test HttpClient
  -> middleware
  -> authentication and authorization
  -> CSRF filters
  -> routing
  -> controllers or SSE endpoint
  -> services
  -> EF Core
```

The factory changes external dependencies and test configuration:

- Uses the Development environment.
- Disables bootstrap and demo seeding.
- Replaces SQL Server with EF Core's in-memory database.
- Supplies non-production Cloudinary configuration.
- Creates clients that retain cookies.
- Provides helpers for CSRF, roles, and admin users.

This lets integration tests prove that routing, middleware, cookies, CSRF, authorization, controllers, dependency injection, and services work together. It does not prove real Azure configuration, SQL Server behavior, browser rendering, Cloudinary uploads, TLS, or production networking.

## 10. Why keep frontend and backend folders if production is one application?

"One production application" describes the deployment unit, not where all source code must live.

| Source folder | Runtime | Tools and responsibility |
| --- | --- | --- |
| `frontend/` | User's browser | React, TypeScript, Vite, npm, browser tests |
| `backend/` | Azure App Service | ASP.NET Core, C#, NuGet, API and integration tests |

Separate source folders provide:

- Clear browser/server security boundaries.
- Appropriate compilers and dependency managers.
- Focused test systems.
- Independent local development loops.
- Easier navigation by responsibility.

Production publishing combines the outputs:

```text
frontend source
  -> Vite writes frontend/dist
  -> .NET publish copies dist into wwwroot
  -> one App Service artifact

/               -> React application
/assets/*       -> Vite-generated files
/api/*          -> ASP.NET Core endpoints
/api/events/*   -> authenticated API and SSE routes
```

This is a modular monolith: the source is separated into meaningful modules, while deployment uses one application, one origin, and one operational unit.

## 11. Is CI implemented, and how does it work?

Yes. GitHub Actions provides continuous integration, or CI, and a separate controlled production-deployment workflow.

```text
Feature branch
  -> pull request
  -> backend and frontend CI jobs
  -> required checks pass
  -> merge into main
  -> CI runs again for the main commit
  -> combined BFF artifact is built, hashed, and retained
  -> explicit production dispatch and approval
  -> database gate
  -> deploy the exact CI artifact
  -> production smoke tests
```

### CI triggers

[`ci.yml`](../../.github/workflows/ci.yml) runs for every pull request and every push to `main`. A normal push to a feature branch does not start this workflow until the branch has a pull request.

CI has read-only repository permission and exposes two independent jobs:

| Job | Main checks |
| --- | --- |
| Backend Build | Workflow validation, .NET restore, Release build, .NET tests, combined BFF publish, package verification, checksum, artifact upload |
| Frontend Lint and Build | Clean npm install, ESLint, Vitest tests, TypeScript and Vite production build |

### Backend and release artifact

The backend job installs .NET 10 and Node 22, then:

1. Self-tests the Azure publish-profile validator.
2. Runs [`validate-production-workflow.mjs`](../../scripts/validate-production-workflow.mjs) to check release-control invariants.
3. Downloads a checksum-pinned `actionlint` binary and validates all workflow files.
4. Restores and builds the .NET solution in Release mode.
5. Runs the backend integration tests.
6. Runs `dotnet publish` for the API project.
7. Verifies that the output contains the API DLL and `wwwroot/index.html`.
8. Packages the output as `hoa-bff-{commit SHA}.tar.gz`.
9. Generates a SHA-256 checksum and uploads both files for 30-day retention.

`dotnet publish` builds the frontend again because [`HoaCommunityEvents.API.csproj`](../backend/src/API/HoaCommunityEvents.API.csproj) includes the Vite output in `wwwroot`. The separate frontend job proves frontend quality independently; the publish step proves that the final combined deployment package can actually be assembled.

### Why CI runs again after merge

Pull-request CI proves the proposed commit passes its checks. After merge, a push-triggered CI run verifies the exact resulting `main` commit. Production accepts only an artifact from a successful push-triggered CI run for the current `main` SHA; it never trusts a pull-request artifact or an artifact from a fork.

### Production deployment

[`deploy-api-azure.yml`](../../.github/workflows/deploy-api-azure.yml) separates deployment, or CD, from ordinary CI. A successful main CI run can start artifact preparation, but it does not automatically mutate production. Actual deployment requires a manual workflow dispatch with `approve_production=true`.

```text
prepare -> production_preflight -> database_gate -> deploy
```

- `prepare` confirms the commit is still current `main`, selects the exact trusted CI run, downloads its artifact, verifies the checksum, and checks the expected API and React files.
- `production_preflight` rechecks release freshness and validates that the configured publish profile belongs to the intended production App Service.
- `database_gate` requires `PRODUCTION_MIGRATION_MODE` to be `workflow` or `external`. Workflow mode applies EF Core migrations; external mode records that database handling was approved outside the workflow.
- `deploy` rechecks freshness, downloads and verifies the same artifact again, and sends it to Azure App Service without rebuilding it.

The reusable [`verify-release-freshness` action](../../.github/actions/verify-release-freshness/action.yml) repeatedly confirms that the approved SHA is still current and still belongs to the selected successful CI run. This prevents a newer `main` commit from silently making an earlier approval stale.

### Production smoke tests

After deployment, the workflow verifies:

- `/health` returns HTTP `200`.
- `/` returns HTML.
- A React deep route returns HTML.
- `/api/security/csrf` returns HTTP `200`.

These checks prove that the deployed process, SPA entry point, deep-route fallback, and a basic API endpoint respond. A failed smoke test marks the workflow as failed but does not automatically roll back the deployment.

### Security design

The workflows use full commit-SHA pins for third-party actions, minimal GitHub token permissions, commit-addressed artifacts, SHA-256 verification, explicit production confirmation, environment-scoped secrets, and repeated release-freshness checks. The SQL connection secret is provided only to the migration step when workflow migration mode is selected.

[`bootstrap-master-admin.yml`](../../.github/workflows/bootstrap-master-admin.yml) is a separate manually dispatched production-operations workflow. It is not part of normal CI or deployment.

### Current CI limits

The normal CI workflow does not currently run:

- Playwright end-to-end tests.
- Tests against real Azure SQL.
- Real Cloudinary uploads.
- Live production SSE checks.
- Dependency vulnerability scanning or a coverage threshold.
- Automated deployment rollback or database restore rehearsal.

CI therefore gives strong source, build, integration, packaging, and workflow-contract evidence. It does not by itself prove that every external production service or recovery procedure works.

## Further reading

- [Full codebase guide](HOA-CODEBASE-GUIDE.md)
- [Presenter cheat sheet](PRESENTER-CHEAT-SHEET.md)
- [Platform architecture diagram](diagrams/platform-bff-clean-architecture.svg)
- [Authentication sequence](diagrams/cookie-auth-csrf-sequence.svg)
- [Attendance live-update sequence](diagrams/sse-attendance-invalidation-sequence.svg)

---

# Versión en español

Revisado el 19 de octubre de 2026 con respecto al código fuente del repositorio. Este documento es un complemento breve para aprender junto con la [guía completa del código](HOA-CODEBASE-GUIDE.md), no una auditoría en vivo de Azure.

Idioma: [English](#hoa-community-events-architecture-faq) | **Español**

## Contenido

1. [¿Por qué usar TanStack Query y Axios?](#1-por-qué-usar-tanstack-query-y-axios)
2. [¿Qué almacena Azure si Cloudinary almacena las imágenes?](#2-qué-almacena-azure-si-cloudinary-almacena-las-imágenes)
3. [¿Qué es la entrega mediante CDN?](#3-qué-es-la-entrega-mediante-cdn)
4. [¿Cuál es el flujo de seguridad de la aplicación?](#4-cuál-es-el-flujo-de-seguridad-de-la-aplicación)
5. [¿Qué es middleware y cómo funciona aquí?](#5-qué-es-middleware-y-cómo-funciona-aquí)
6. [¿Cómo funciona el paquete generado por Vite?](#6-cómo-funciona-el-paquete-generado-por-vite)
7. [¿Por qué usar SSE ahora y qué otras tecnologías podrían proporcionar actualizaciones en vivo?](#7-por-qué-usar-sse-ahora-y-qué-otras-tecnologías-podrían-proporcionar-actualizaciones-en-vivo)
8. [¿Qué son los roles y dónde se ejecutan?](#8-qué-son-los-roles-y-dónde-se-ejecutan)
9. [¿Qué es WebApplicationFactory?](#9-qué-es-webapplicationfactory)
10. [¿Por qué conservar las carpetas frontend y backend si producción es una sola aplicación?](#10-por-qué-conservar-las-carpetas-frontend-y-backend-si-producción-es-una-sola-aplicación)
11. [¿Está implementada la integración continua y cómo funciona?](#11-está-implementada-la-integración-continua-y-cómo-funciona)

## La aplicación completa de un vistazo

```text
Navegador
  -> páginas de React
  -> TanStack Query administra los datos del servidor
  -> Axios envía solicitudes HTTP
  -> middleware y endpoints de ASP.NET Core
  -> servicios de aplicación y EF Core
  -> Azure SQL

Navegador -> Cloudinary para cargas firmadas y entrega de imágenes
Servidor  -> Cloudinary cuando debe eliminarse una imagen propia
```

El frontend se ejecuta en el navegador del usuario. El backend se ejecuta en Azure App Service. En producción, ASP.NET Core sirve tanto los archivos compilados del frontend como la API desde un mismo origen.

## 1. ¿Por qué usar TanStack Query y Axios?

Resuelven problemas diferentes.

| Herramienta | Responsabilidad |
| --- | --- |
| Axios | Enviar solicitudes HTTP y manejar los detalles de transporte |
| TanStack Query | Administrar el ciclo de vida de los datos recibidos del servidor |

Axios controla el comportamiento HTTP compartido del proyecto en [`agent.ts`](../frontend/src/app/api/agent.ts):

- Usa `/api` como URL base.
- Incluye las cookies.
- Obtiene y adjunta tokens CSRF a las solicitudes no seguras.
- Reconoce las solicitudes autenticadas que fallan con `401`.
- Devuelve cuerpos de respuesta tipados.

TanStack Query controla comportamientos como:

- Estados de carga y error.
- Caché de respuestas del servidor.
- Eliminación de solicitudes equivalentes duplicadas.
- Nueva consulta de datos obsoletos.
- Ejecución de mutaciones.
- Invalidación de entradas relacionadas de la caché después de una escritura o una notificación SSE.

Por ejemplo, [`useEvents.ts`](../frontend/src/hooks/useEvents.ts) solicita a una función de API respaldada por Axios que realice la petición; después, TanStack Query almacena y sincroniza el resultado.

```text
Componente React -> TanStack Query -> Axios -> API de ASP.NET
                    ciclo de datos     HTTP
```

No es estrictamente necesario usar ambas bibliotecas. TanStack Query podría llamar a la API nativa `fetch` del navegador mediante un adaptador personalizado, lo que permitiría eliminar Axios. Axios por sí solo podría enviar todas las solicitudes, pero la aplicación tendría que implementar por su cuenta la caché, la eliminación de duplicados, la invalidación y los estados de carga.

Para esta aplicación, conservar ambas es razonable porque la capa de Axios centraliza el comportamiento de cookies y CSRF, mientras que TanStack Query evita reconstruir la lógica de estado del servidor dentro de los componentes.

## 2. ¿Qué almacena Azure si Cloudinary almacena las imágenes?

Azure y Cloudinary almacenan diferentes clases de datos.

| Servicio | Responsabilidad |
| --- | --- |
| Azure App Service | Ejecuta ASP.NET Core y contiene los archivos publicados de React |
| Azure SQL | Almacena registros estructurados de la aplicación |
| Cloudinary | Almacena, transforma y entrega archivos de imagen |

Azure SQL almacena:

- Cuentas, hashes de contraseñas y roles de Identity.
- Eventos y estados de eventos.
- Relaciones de asistencia.
- Datos de perfiles.
- URL de imágenes de Cloudinary.
- Posición de recorte y valores de zoom de las imágenes.

Cloudinary almacena los bytes reales de los archivos JPEG, PNG o WebP. Por ejemplo, [`Event.cs`](../backend/src/Domain/Entities/Event.cs) almacena `ImageUrl`, `ImagePositionX`, `ImagePositionY` e `ImageZoom`; no contiene el archivo de imagen.

El flujo de carga es:

```text
El navegador solicita parámetros de carga firmados a ASP.NET
  -> ASP.NET devuelve una firma de Cloudinary de corta duración
  -> el navegador carga los bytes de la imagen directamente a Cloudinary
  -> Cloudinary devuelve una URL de imagen
  -> el navegador envía esa URL y los ajustes de recorte a ASP.NET
  -> ASP.NET los almacena en Azure SQL
```

Azure ofrece Blob Storage como producto, pero este repositorio no lo utiliza. Cloudinary desempeña la función de almacenamiento de contenido multimedia de los usuarios.

## 3. ¿Qué es la entrega mediante CDN?

Una **red de entrega de contenido**, o CDN, sirve archivos desde una red distribuida de ubicaciones en lugar de hacer que cada usuario descargue desde un único servidor central.

Cuando un navegador solicita una imagen de Cloudinary:

1. Cloudinary selecciona una ubicación cercana de la CDN.
2. Esa ubicación puede tener ya una copia en caché.
3. La imagen recorre una distancia más corta hasta el usuario.
4. Cloudinary puede cambiar el tamaño, recortar, comprimir o cambiar el formato de la imagen antes de entregarla.

```text
Usuario en una región -> ubicación CDN cercana       -> imagen de Cloudinary
Usuario en otra       -> ubicación CDN diferente     -> la misma imagen
```

El valor `ImageUrl` de Azure SQL indica al navegador dónde solicitar la imagen. Azure SQL no participa en la entrega de los bytes de la imagen.

## 4. ¿Cuál es el flujo de seguridad de la aplicación?

La aplicación utiliza autenticación por cookies de ASP.NET Core Identity. No almacena un JWT en el almacenamiento de JavaScript del navegador.

### Inicio de sesión

```text
El navegador obtiene el token CSRF y la cookie antifalsificación
  -> el navegador envía el correo y la contraseña con el encabezado CSRF
  -> ASP.NET valida el par CSRF
  -> Identity carga el usuario desde Azure SQL
  -> Identity verifica el hash de la contraseña y las reglas de bloqueo
  -> el servidor emite la cookie de autenticación HttpOnly protegida
  -> la respuesta devuelve datos del usuario, no un token de autenticación
```

El interceptor de solicitudes de Axios en [`agent.ts`](../frontend/src/app/api/agent.ts) obtiene el token CSRF. [`SecurityController.cs`](../backend/src/API/Controllers/SecurityController.cs) crea el par de tokens antifalsificación y [`AccountController.cs`](../backend/src/API/Controllers/AccountController.cs) expone los endpoints de registro, inicio de sesión, usuario actual y cierre de sesión.

### Solicitudes posteriores

El navegador incluye automáticamente la cookie `HoaCommunityEvents.Auth` en las solicitudes correspondientes. ASP.NET Core hace lo siguiente:

1. Valida y desprotege la cookie.
2. Reconstruye `HttpContext.User` y sus declaraciones de roles.
3. Evalúa la política de autorización del endpoint.
4. Ejecuta el endpoint solo cuando la autorización tiene éxito.

`401 Unauthorized` significa que no existe una identidad autenticada aceptada. `403 Forbidden` significa que la identidad es válida, pero no satisface la política de roles requerida.

### Protección CSRF

Los navegadores envían las cookies automáticamente, lo que crea un riesgo de falsificación de solicitudes entre sitios. Por ello, cada `POST`, `PUT`, `PATCH` o `DELETE` de un controlador requiere:

- La cookie antifalsificación HttpOnly.
- Su token de solicitud correspondiente en el encabezado `X-CSRF-TOKEN`.

### Configuración de la cookie

[`IdentityServiceExtensions.cs`](../backend/src/API/Extensions/IdentityServiceExtensions.cs) configura la cookie de autenticación de esta forma:

- Se llama `HoaCommunityEvents.Auth`.
- Es HttpOnly para que JavaScript del navegador no pueda leerla.
- Solo usa HTTPS fuera del entorno de desarrollo.
- Usa `SameSite=Lax`.
- Es válida durante ocho horas con vencimiento deslizante.

Identity bloquea una cuenta durante 15 minutos después de cinco intentos fallidos de inicio de sesión.

### Seguridad de Cloudinary

El secreto de la API de Cloudinary permanece en el servidor. Un usuario autenticado solicita a [`UploadsController.cs`](../backend/src/API/Controllers/UploadsController.cs) parámetros de carga firmados y después carga directamente a Cloudinary. Las solicitudes de firmas de carga tienen límite de frecuencia.

Otras protecciones del servidor incluyen redirección HTTPS, orígenes CORS configurados, límites de frecuencia globales y específicos por endpoint, validación de entradas, respuestas genéricas para excepciones y autorización de roles en el backend.

## 5. ¿Qué es middleware y cómo funciona aquí?

Middleware es un componente ordenado dentro de la canalización de solicitudes de ASP.NET Core. Puede inspeccionar o cambiar una solicitud, llamar al siguiente componente, detener el procesamiento antes de tiempo e inspeccionar la respuesta cuando regresa.

Conceptualmente:

```csharp
async Task Middleware(HttpContext context, RequestDelegate next)
{
    // Trabajo antes de los componentes posteriores de la canalización.
    await next(context);
    // Trabajo mientras regresa la respuesta.
}
```

[`Program.cs`](../backend/src/API/Program.cs) compone la canalización de esta aplicación:

```text
Solicitud entrante
  -> manejo de excepciones
  -> redirección HTTPS
  -> archivos predeterminados y estáticos
  -> CORS
  -> límite de frecuencia
  -> autenticación
  -> autorización
  -> controlador o endpoint SSE
  -> la respuesta regresa por la canalización
```

El orden es importante. La autenticación debe ejecutarse antes de la autorización porque esta última necesita al usuario reconstruido. Los archivos estáticos se procesan antes y pueden devolver un recurso de React sin invocar un controlador de API.

[`ExceptionMiddleware.cs`](../backend/src/API/Middleware/ExceptionMiddleware.cs) envuelve el procesamiento posterior. Registra las excepciones no controladas y devuelve un error JSON genérico con un identificador de seguimiento en lugar de revelar el seguimiento interno de la pila.

La validación CSRF es un comportamiento relacionado con la canalización, pero aquí se registra como un **filtro** MVC global, no como middleware ordinario. El filtro se ejecuta para acciones de controlador no seguras antes de que se ejecute el cuerpo de la acción. Se configura en [`ApplicationServiceExtensions.cs`](../backend/src/API/Extensions/ApplicationServiceExtensions.cs).

## 6. ¿Cómo funciona el paquete generado por Vite?

Un paquete de producción de Vite es la colección de HTML, JavaScript, CSS y recursos públicos lista para ejecutarse en el navegador y generada a partir del código fuente del frontend.

### Desarrollo

La ejecución de `npm run dev` inicia Vite. Vite:

- Sirve [`index.html`](../frontend/index.html).
- Transforma TypeScript, JSX de React y CSS bajo demanda.
- Actualiza los módulos modificados mediante Hot Module Replacement.
- Redirige `/api` y `/health` al servidor ASP.NET local mediante [`vite.config.ts`](../frontend/vite.config.ts).

```text
Navegador -> servidor de desarrollo Vite -> proxy de la API ASP.NET local
```

### Producción

`npm run build` ejecuta `tsc -b` y después `vite build`. Vite comienza en `index.html`, sigue el grafo de importaciones a través de [`main.tsx`](../frontend/src/main.tsx), elimina código no utilizado, minimiza la salida, extrae el CSS y escribe archivos con hash en `frontend/dist/`.

```text
Código fuente                         Resultado de producción
/src/main.tsx                   ->    /assets/index-[hash].js
estilos importados              ->    /assets/index-[hash].css
importaciones diferidas         ->    fragmentos separados por página
```

El hash del contenido cambia cuando cambia el contenido del archivo, de modo que el navegador pueda distinguir una implementación nueva de un recurso antiguo almacenado en caché.

Las rutas de [`routes.tsx`](../frontend/src/app/router/routes.tsx) utilizan `lazy(() => import(...))`. Estas importaciones dinámicas crean fragmentos separados para cada página, lo que permite que el navegador descargue una página administrativa o de detalles de eventos solo cuando sea necesaria.

### Publicación combinada

Durante `dotnet publish`, [`HoaCommunityEvents.API.csproj`](../backend/src/API/HoaCommunityEvents.API.csproj):

1. Ejecuta `npm ci`.
2. Ejecuta la compilación de producción del frontend.
3. Copia `frontend/dist/**` en `wwwroot/**` de la aplicación publicada.

ASP.NET Core sirve esos archivos estáticos. Una ruta desconocida que no sea de API devuelve `index.html`, lo que permite a React Router manejar enlaces directos como `/events/{id}`. Las rutas desconocidas bajo `/api/**` devuelven un `404` en JSON.

Todo lo que se encuentra en el paquete del frontend es público y se puede inspeccionar. Las credenciales de la base de datos, los secretos de Cloudinary y otros valores de confianza deben permanecer en la configuración del backend.

## 7. ¿Por qué usar SSE ahora y qué otras tecnologías podrían proporcionar actualizaciones en vivo?

Los **eventos enviados por el servidor**, o SSE, permiten que el servidor envíe eventos de texto con nombre mediante una respuesta HTTP de larga duración. Actualmente, las actualizaciones de asistencia solo requieren una notificación ocasional y unidireccional desde el servidor hacia el navegador.

```text
Un residente confirma o cancela su asistencia
  -> la transacción de asistencia se confirma en Azure SQL
  -> el intermediario en memoria publica attendance-changed
  -> SSE envía la notificación a las páginas conectadas del evento
  -> TanStack Query marca como obsoletas las entradas relacionadas de la caché
  -> el navegador vuelve a consultar el JSON autoritativo
```

La notificación no contiene la nueva lista de asistentes. Indica que los datos almacenados en caché podrían estar obsoletos. Esto mantiene la API JSON autenticada normal como la ruta real de datos.

SSE se ajusta al requisito actual porque:

- La API nativa `EventSource` del navegador no requiere un paquete de frontend.
- Se vuelve a conectar automáticamente después de perder la conexión.
- Utiliza HTTP normal y la cookie de autenticación del mismo origen.
- Es más sencillo que un sistema bidireccional de tiempo real.

[`EventStreamEndpoints.cs`](../backend/src/API/Endpoints/EventStreamEndpoints.cs) autentica la transmisión y verifica la visibilidad del evento. [`InMemoryEventUpdateBroker.cs`](../backend/src/Infrastructure/Realtime/InMemoryEventUpdateBroker.cs) distribuye las notificaciones a los suscriptores. [`useEventStream.ts`](../frontend/src/hooks/useEventStream.ts) invalida las claves de consulta del evento, la lista de eventos y los asistentes.

### Alternativas

| Tecnología | Mejor uso | Principal desventaja |
| --- | --- | --- |
| Consultas periódicas con TanStack Query | Actualizaciones sencillas y de poco tráfico | Solicitudes repetidas y actualizaciones con retraso |
| WebSockets sin abstracción | Comunicación bidireccional de alta frecuencia | La aplicación debe administrar el protocolo, la reconexión, la autenticación y el escalado |
| SignalR | Hubs, grupos y mensajería bidireccional más avanzada en .NET | Más componentes en cliente y servidor; el escalado todavía requiere infraestructura compartida |
| Azure SignalR Service o Web PubSub | Distribución administrada entre varias instancias | Costo de un servicio adicional y acoplamiento con Azure |
| Intermediario compartido más SSE | Conservar la interfaz SSE sencilla del navegador y escalar los publicadores | Requiere Redis u otro sistema de mensajes compartido |

El intermediario actual vive en un único proceso de App Service. Si se ejecutan dos instancias, una escritura en una instancia no puede notificar a una transmisión conectada a la otra. Se debe conservar el diseño SSE actual para el MVP de una sola instancia. Para producción con varias instancias, se necesita distribución compartida o un servicio administrado de tiempo real.

## 8. ¿Qué son los roles y dónde se ejecutan?

Los roles son grupos de permisos con nombre asignados a usuarios de Identity. [`AppRoles.cs`](../backend/src/Domain/Common/AppRoles.cs) define:

- `resident`
- `hoa_admin`

Las definiciones de roles y las relaciones entre usuarios y roles se conservan en Azure SQL mediante las tablas de ASP.NET Core Identity. Las comprobaciones autoritativas se ejecutan en el backend de ASP.NET Core alojado en Azure App Service:

```text
Cookie de autenticación
  -> autenticación reconstruye el usuario y sus declaraciones de roles
  -> autorización evalúa la política del endpoint
  -> el endpoint se ejecuta, devuelve 401 o devuelve 403
```

[`IdentityServiceExtensions.cs`](../backend/src/API/Extensions/IdentityServiceExtensions.cs) define dos políticas:

- `AdminOnly` requiere `hoa_admin`.
- `ResidentOrAdmin` acepta `resident` o `hoa_admin`.

Una política es una regla de autorización con nombre, no otro rol. Los controladores y endpoints SSE adjuntan la política apropiada a las operaciones protegidas.

La aplicación React también lee el rol devuelto. [`ProtectedRoute.tsx`](../frontend/src/app/router/ProtectedRoute.tsx) redirige a los usuarios fuera de páginas no disponibles y los componentes ocultan acciones que no corresponden al rol actual. Estas comprobaciones en el navegador mejoran la experiencia, pero no son límites de seguridad: los usuarios controlan sus navegadores y pueden llamar directamente a la API. La autorización del backend sigue siendo la autoridad.

## 9. ¿Qué es WebApplicationFactory?

`WebApplicationFactory<TEntryPoint>` es una utilidad de ASP.NET Core para pruebas de integración. Inicia la aplicación real dentro del proceso de pruebas y proporciona un `HttpClient` sin necesitar una implementación en Azure ni, normalmente, abrir un puerto de red.

Este proyecto define [`ApiTestFactory.cs`](../backend/tests/API.Tests/ApiTestFactory.cs) como una `WebApplicationFactory<Program>`. Las solicitudes recorren la mayor parte del backend real:

```text
HttpClient de prueba
  -> middleware
  -> autenticación y autorización
  -> filtros CSRF
  -> enrutamiento
  -> controlador o endpoint SSE
  -> servicios
  -> EF Core
```

La fábrica modifica las dependencias externas y la configuración de pruebas:

- Usa el entorno Development.
- Desactiva la inicialización de bootstrap y los datos de demostración.
- Sustituye SQL Server por la base de datos en memoria de EF Core.
- Proporciona configuración de Cloudinary que no es de producción.
- Crea clientes que conservan cookies.
- Proporciona funciones auxiliares para CSRF, roles y usuarios administradores.

Esto permite que las pruebas de integración demuestren que el enrutamiento, middleware, cookies, CSRF, autorización, controladores, inyección de dependencias y servicios funcionan juntos. No demuestra la configuración real de Azure, el comportamiento de SQL Server, la representación en el navegador, las cargas a Cloudinary, TLS ni las redes de producción.

## 10. ¿Por qué conservar las carpetas frontend y backend si producción es una sola aplicación?

"Una sola aplicación de producción" describe la unidad de implementación, no dónde debe vivir todo el código fuente.

| Carpeta de código | Entorno de ejecución | Herramientas y responsabilidad |
| --- | --- | --- |
| `frontend/` | Navegador del usuario | React, TypeScript, Vite, npm y pruebas del navegador |
| `backend/` | Azure App Service | ASP.NET Core, C#, NuGet y pruebas de API e integración |

Las carpetas de código separadas proporcionan:

- Límites claros de seguridad entre navegador y servidor.
- Compiladores y administradores de dependencias apropiados.
- Sistemas de pruebas especializados.
- Ciclos independientes de desarrollo local.
- Navegación más sencilla según la responsabilidad.

La publicación de producción combina los resultados:

```text
Código fuente del frontend
  -> Vite escribe frontend/dist
  -> .NET publish copia dist dentro de wwwroot
  -> un artefacto para App Service

/               -> aplicación React
/assets/*       -> archivos generados por Vite
/api/*          -> endpoints de ASP.NET Core
/api/events/*   -> API autenticada y rutas SSE
```

Esto es un monolito modular: el código fuente se separa en módulos con significado, mientras que la implementación utiliza una aplicación, un origen y una unidad operativa.

## 11. ¿Está implementada la integración continua y cómo funciona?

Sí. GitHub Actions proporciona integración continua, o CI, y un flujo separado y controlado para la implementación en producción.

```text
Rama de funcionalidad
  -> solicitud de incorporación de cambios
  -> trabajos de CI del backend y frontend
  -> las comprobaciones requeridas se aprueban
  -> incorporación a main
  -> CI vuelve a ejecutarse para el commit de main
  -> el artefacto BFF combinado se compila, verifica y conserva
  -> ejecución y aprobación explícitas para producción
  -> puerta de base de datos
  -> implementación del artefacto exacto de CI
  -> pruebas básicas de producción
```

### Activadores de CI

[`ci.yml`](../../.github/workflows/ci.yml) se ejecuta para cada solicitud de incorporación de cambios y cada envío a `main`. Un envío normal a una rama de funcionalidad no inicia este flujo hasta que la rama tenga una solicitud de incorporación.

CI tiene permisos de solo lectura para el repositorio y expone dos trabajos independientes:

| Trabajo | Comprobaciones principales |
| --- | --- |
| Backend Build | Validación de flujos, restauración de .NET, compilación Release, pruebas .NET, publicación del BFF combinado, verificación del paquete, suma de comprobación y carga del artefacto |
| Frontend Lint and Build | Instalación limpia de npm, ESLint, pruebas Vitest y compilación de producción con TypeScript y Vite |

### Backend y artefacto de entrega

El trabajo del backend instala .NET 10 y Node 22, y después:

1. Ejecuta las pruebas internas del validador del perfil de publicación de Azure.
2. Ejecuta [`validate-production-workflow.mjs`](../../scripts/validate-production-workflow.mjs) para comprobar las invariantes de control de entrega.
3. Descarga un binario de `actionlint` fijado mediante suma de comprobación y valida todos los archivos de flujo.
4. Restaura y compila la solución .NET en modo Release.
5. Ejecuta las pruebas de integración del backend.
6. Ejecuta `dotnet publish` para el proyecto de API.
7. Verifica que la salida contenga el DLL de la API y `wwwroot/index.html`.
8. Empaqueta la salida como `hoa-bff-{SHA del commit}.tar.gz`.
9. Genera una suma SHA-256 y carga ambos archivos con una retención de 30 días.

`dotnet publish` vuelve a compilar el frontend porque [`HoaCommunityEvents.API.csproj`](../backend/src/API/HoaCommunityEvents.API.csproj) incluye la salida de Vite dentro de `wwwroot`. El trabajo separado del frontend demuestra su calidad de forma independiente; el paso de publicación demuestra que el paquete combinado final realmente se puede construir.

### Por qué CI vuelve a ejecutarse después de incorporar los cambios

La CI de la solicitud demuestra que el commit propuesto supera sus comprobaciones. Después de incorporarlo, una ejecución de CI activada por el envío verifica el commit resultante exacto de `main`. Producción solo acepta un artefacto procedente de una ejecución de CI exitosa, activada por un envío, para el SHA actual de `main`; nunca confía en un artefacto de una solicitud de cambios ni de una bifurcación externa.

### Implementación en producción

[`deploy-api-azure.yml`](../../.github/workflows/deploy-api-azure.yml) separa la implementación, o CD, de la CI normal. Una CI exitosa de `main` puede iniciar la preparación del artefacto, pero no modifica producción automáticamente. La implementación real requiere ejecutar manualmente el flujo con `approve_production=true`.

```text
prepare -> production_preflight -> database_gate -> deploy
```

- `prepare` confirma que el commit siga siendo el `main` actual, selecciona la ejecución exacta y confiable de CI, descarga su artefacto, verifica la suma y comprueba los archivos esperados de la API y React.
- `production_preflight` vuelve a comprobar la vigencia de la entrega y valida que el perfil de publicación configurado pertenezca al App Service de producción previsto.
- `database_gate` requiere que `PRODUCTION_MIGRATION_MODE` sea `workflow` o `external`. El modo `workflow` aplica las migraciones de EF Core; el modo `external` registra que la base de datos fue gestionada y aprobada fuera del flujo.
- `deploy` vuelve a comprobar la vigencia, descarga y verifica otra vez el mismo artefacto, y lo envía a Azure App Service sin volver a compilarlo.

La [acción reutilizable `verify-release-freshness`](../../.github/actions/verify-release-freshness/action.yml) confirma repetidamente que el SHA aprobado siga siendo el actual y pertenezca a la ejecución exitosa de CI seleccionada. Esto impide que un commit posterior de `main` vuelva obsoleta una aprobación anterior sin detectarlo.

### Pruebas básicas de producción

Después de la implementación, el flujo verifica:

- Que `/health` devuelva HTTP `200`.
- Que `/` devuelva HTML.
- Que una ruta profunda de React devuelva HTML.
- Que `/api/security/csrf` devuelva HTTP `200`.

Estas comprobaciones demuestran que el proceso implementado, la entrada de la SPA, el comportamiento de rutas profundas y un endpoint básico de la API responden. Una prueba fallida marca el flujo como fallido, pero no revierte automáticamente la implementación.

### Diseño de seguridad

Los flujos utilizan acciones de terceros fijadas a SHA completos, permisos mínimos para el token de GitHub, artefactos identificados por commit, verificación SHA-256, confirmación explícita para producción, secretos limitados por entorno y comprobaciones repetidas de vigencia. La cadena de conexión SQL solo se proporciona al paso de migración cuando se selecciona el modo de migración dentro del flujo.

[`bootstrap-master-admin.yml`](../../.github/workflows/bootstrap-master-admin.yml) es un flujo separado de operaciones de producción que se ejecuta manualmente. No forma parte de la CI ni de la implementación normal.

### Límites actuales de CI

El flujo normal de CI no ejecuta actualmente:

- Pruebas integrales de Playwright.
- Pruebas contra Azure SQL real.
- Cargas reales a Cloudinary.
- Comprobaciones SSE en producción.
- Análisis de vulnerabilidades de dependencias ni un umbral de cobertura.
- Reversión automática de la implementación ni ensayos de restauración de la base de datos.

Por tanto, CI proporciona evidencia sólida del código fuente, la compilación, la integración, el empaquetado y el contrato del flujo. Por sí sola, no demuestra que todos los servicios externos de producción o los procedimientos de recuperación funcionen.

## Lecturas adicionales

- [Guía completa del código](HOA-CODEBASE-GUIDE.md)
- [Guía rápida para presentaciones](PRESENTER-CHEAT-SHEET.md)
- [Diagrama de arquitectura de la plataforma](diagrams/platform-bff-clean-architecture.svg)
- [Secuencia de autenticación](diagrams/cookie-auth-csrf-sequence.svg)
- [Secuencia de actualizaciones de asistencia en vivo](diagrams/sse-attendance-invalidation-sequence.svg)
