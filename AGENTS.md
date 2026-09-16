# HOA Community Events — agent notes

You are working on **HOA Community Events** (repo `Victor-CS-Core/hoa-practice-project`), product code under `HoaCommunityEvents/`.

## Layout
- `HoaCommunityEvents/backend` — ASP.NET Core (.NET 10) BFF + API (Clean Architecture)
- `HoaCommunityEvents/frontend` — React 19 + Vite + TypeScript + TanStack Query + MobX
- Auth: ASP.NET Identity cookie `HoaCommunityEvents.Auth` (HttpOnly); CSRF via antiforgery + `X-CSRF-TOKEN`
- Data: SQL Server / Azure SQL via EF Core; images on Cloudinary (URLs in DB)
- CI/CD: `.github/workflows/ci.yml`, `deploy-api-azure.yml` (Azure App Service publish profile + optional SQL migrate)

## Day-to-day cwd
Prefer `HoaCommunityEvents/` (Hermes `hoa` profile `terminal.cwd` points here).

## Common commands
```bash
# Backend
dotnet restore backend/HoaCommunityEvents.slnx
dotnet build backend/HoaCommunityEvents.slnx --no-restore
dotnet test backend/HoaCommunityEvents.slnx --no-build
dotnet run --project backend/src/API --launch-profile https

# Frontend
cd frontend && npm ci && npm run dev
```

Local DB: `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..." --project backend/src/API` then `dotnet ef database update`.

## Scope
Stay inside this repo unless Victor asks otherwise. Prefer `gh` for GitHub. Match existing patterns before inventing new ones. Read `HoaCommunityEvents/docs/HOA-CODEBASE-GUIDE.md` for deep context.
