# HoaCommunityEvents

HOA Community Events MVP (Clean Architecture + React SPA).

## Stack

- Backend: ASP.NET Core Web API (net10.0), Clean Architecture, service/use-case application layer, EF Core SQL Server, Identity, JWT, AutoMapper, FluentValidation, SignalR, Swagger
- Frontend: React + TypeScript + Vite, React Router, Axios, TanStack Query, MobX, React Hook Form

## Current Status

Implemented and validated:

- Authentication (register, login, current user) with role support.
- Event read and admin CRUD flows.
- Attendance join/leave with SignalR attendee count updates.
- Profile read/update with ownership checks.
- Unified API error envelope (`code`, `message`, `details`, `traceId`).
- Paged event list response contract (`items`, `totalCount`, `page`, `pageSize`, `totalPages`).
- FluentValidation request validators and policy-based authorization matrix.

## Solution Structure

```
HoaCommunityEvents/
   API/              ASP.NET Core host (controllers, middleware, startup)
   Application/      Use cases, DTOs, interfaces, validators
   Domain/           Core entities and domain constants
   Infrastructure/   Cross-cutting integrations (identity token services, SignalR)
   Persistence/      EF Core DbContext, migrations, seeding
   frontend/         React SPA (Vite + TypeScript)
```

## Naming Conventions

- Backend projects use PascalCase layer folders aligned to Clean Architecture (`API`, `Application`, `Domain`, `Infrastructure`, `Persistence`).
- Frontend remains in `frontend/` (lowercase) to align with Node/Vite ecosystem conventions.
- Public API and app-level names use `HoaCommunityEvents.*` for consistent discovery in solution and build output.

## Local Run

1. Configure backend local secrets using user-secrets (not committed to git):

   ```bash
   cd API
   dotnet user-secrets init
   dotnet user-secrets set "TokenKey" "replace-with-long-random-dev-key-at-least-64-characters"
   ```

2. Confirm local SQL Server integrated security connection in API/appsettings.Development.json:

   ```text
   Server=localhost;Database=HoaCommunityEvents;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
   ```

3. Apply EF Core migrations from the solution root:

   ```bash
   dotnet ef database update -p Persistence -s API
   ```

4. Configure frontend environment in frontend/.env:

   ```text
   VITE_API_URL=http://localhost:5284/api
   ```

5. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

6. Start the backend API (from solution root):

   ```bash
   dotnet run --project API
   ```

7. Start frontend dev server (from frontend folder):

   ```bash
   npm run dev
   ```

8. Verify API and docs:
   - Health: http://localhost:5284/health
   - Swagger UI (Development): http://localhost:5284/swagger

9. Validation commands:

   ```bash
   # from solution root
   dotnet build HoaCommunityEvents.slnx

   # from frontend folder
   npm run build
   npm run lint
   ```

## Environment Strategy (Demo vs Production)

The API now uses explicit seed toggles so demo data cannot accidentally appear in production.

- `Seed:EnableBootstrap`: creates required roles and seeded admin account.
- `Seed:EnableDemoData`: inserts sample events for demo/testing.

Recommended values by environment:

- Development: `EnableBootstrap=true`, `EnableDemoData=true`
- Demo/Staging: `EnableBootstrap=true`, `EnableDemoData=true`
- Production: `EnableBootstrap=false`, `EnableDemoData=false`

Safety rule:

- If `Seed:EnableDemoData=true` in Production, the API will fail at startup.

## Azure Deployment Baseline (App Service)

Use Azure App Service with environment variables in Application Settings (never commit secrets).

Set these required settings in Azure for the API app:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ConnectionStrings__DefaultConnection=<azure-sql-connection-string>`
- `TokenKey=<long-random-key-64+chars>`
- `Cloudinary__CloudName=<value>`
- `Cloudinary__ApiKey=<value>`
- `Cloudinary__ApiSecret=<value>`
- `Cloudinary__UploadFolder=hoa-events`
- `Seed__EnableBootstrap=false`
- `Seed__EnableDemoData=false`

Optional one-time production bootstrap (if you need to create first admin/roles):

1. Temporarily set:
   - `Seed__EnableBootstrap=true`
   - `AdminSeed__Email`, `AdminSeed__Username`, `AdminSeed__Password`, `AdminSeed__DisplayName`
2. Restart app and confirm admin exists.
3. Immediately set `Seed__EnableBootstrap=false` and remove `AdminSeed__*` settings.

For demo/staging slots:

- Use a separate Azure SQL database from production.
- Keep `Seed__EnableDemoData=true` only in those non-production slots.

## Production Readiness Checklist

- Production has a dedicated database (no shared DB with demo/staging).
- `ASPNETCORE_ENVIRONMENT` is `Production`.
- Seed toggles in production are both `false`.
- Secrets are managed through Azure App Service settings or Key Vault references.
- Swagger/OpenAPI is only enabled in Development (already enforced).

## Startup Safety Validation

At startup, the API validates deployment safety settings and fails fast on unsafe production config.

- `Seed:EnableBootstrap` cannot be `true` in Production.
- `Seed:EnableDemoData` cannot be `true` in Production.
- `AdminSeed:*` values cannot be present in Production.
- If `Seed:EnableBootstrap=true`, `AdminSeed:*` values are required.

This validation runs before middleware pipeline execution.

## GitHub Actions (Azure)

Workflows added:

- `.github/workflows/ci.yml`: backend build + frontend lint/build on push/PR.
- `.github/workflows/deploy-api-azure.yml`: manual deploy to `demo` or `production` target.

Create GitHub Environments:

- `demo`
- `production`

Set environment secrets:

- `AZURE_WEBAPP_NAME_PRODUCTION`
- `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION`
- `AZURE_WEBAPP_NAME_DEMO`
- `AZURE_WEBAPP_SLOT_DEMO`
- `AZURE_WEBAPP_PUBLISH_PROFILE_DEMO`

App settings for each Azure target should still be managed directly in App Service configuration (or Key Vault references), including:

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `TokenKey`
- `Cloudinary__*`
- `Seed__EnableBootstrap`
- `Seed__EnableDemoData`
