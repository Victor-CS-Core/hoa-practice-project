---
name: dotnet-react-clean-architecture-scaffolder
description: Streamlines the setup of a full-stack web application using ASP.NET Core Clean Architecture and React with Vite, matching the TigerTeam tech stack specifications.
---

# DotNet React Clean Architecture Scaffolder

This skill helps agents quickly scaffold a full-stack web application that adheres to the `dotnet-react-clean-architecture-fullstack` specification.

## Usage

When the user asks to start a new web application or scaffold a project using the specified tech stack, run the included `scaffold.ps1` script to generate the complete solution structure.

### Command

```powershell
# Run the scaffolding script
.\scaffold.ps1 -AppName "MyProjectName" -OutputDir ".\TargetDirectory" -DotnetFramework "net8.0" -UiLibrary "semantic"
```

## What it does

The scaffolding script will automatically:

1. Create a `.NET 8+` solution.
2. Generate the Clean Architecture backend layers:
   - **API** (ASP.NET Core Web API)
   - **Application** (Class Library for use cases, services, and DTOs)
   - **Domain** (Class Library for Entities)
   - **Infrastructure** (Class Library for External Services)
   - **Persistence** (Class Library for EF Core & Identity)
3. Link the project references according to Clean Architecture dependency rules.
4. Scan backend project package references and install any missing essential NuGet packages: AutoMapper, FluentValidation, EF Core SQL Server, ASP.NET Core Identity, EF Core Design/Tools (migrations), JWT Bearer, SignalR client, Swagger.
5. Create backend starter folders for controllers, middleware, hubs, application use cases/DTOs, services, and migrations.
6. Create backend environment templates (`API/.env.example`) and starter app settings containing required keys:
   - `ConnectionStrings__DefaultConnection`
   - `TokenKey`
   - `ASPNETCORE_ENVIRONMENT`
7. Create a React + TypeScript frontend using Vite.
8. Scan frontend dependencies in `package.json` and install any missing required libraries: React Router, Axios, TanStack React Query, MobX, React Hook Form, SignalR client, plus selected UI library (`semantic` or `tailwind`).
9. Run scaffold steps non-interactively (no manual prompt required during `create-vite`).
10. If Semantic UI install hits React peer dependency conflicts, automatically retry with `--legacy-peer-deps`.
11. Create the required frontend feature-based folder structure (`src/app`, `src/features`, `src/components`, `src/hooks`, `src/lib`, `src/types`) including `src/app/api`, `src/app/router`, and `src/app/stores`.
12. Generate frontend environment template (`frontend/.env.example`) with `VITE_API_URL` and starter API agent/store/router files.

## Design Guidelines

After scaffolding, adhere to these rules when building features:

**Backend:**

- **Thin Controllers:** Controllers only receive HTTP requests, call application services/use cases, and return HTTP responses. No business logic or direct DB access.
- **Application Flow:** Keep business logic in application services/use cases and keep controllers focused on transport concerns.
- **Responses:** Never return entities directly. Always map to DTOs.
- **Identity + JWT:** Implement `register`, `login`, `logout`, and `current user` endpoints with protected routes and policy-based authorization.
- **Validation + Errors:** Use FluentValidation for request validation and global exception middleware with consistent API error responses.
- **EF Migrations:** Use EF Core migrations for database evolution.
- **SignalR:** Add hubs only for real-time use cases (notifications, comments, attendance, live updates).

**Frontend:**

- **API Client:** Use Axios interceptors for handling auth tokens and centralized error handling.
- **Server State:** Use TanStack React Query for data fetching, caching, and mutations.
- **Client State:** Use MobX for authentication state, UI state, and modals.
- **Forms:** Build all forms using React Hook Form.
- **Routing:** Implement public/protected/layout routes, auth routes, NotFound route, and create/edit/detail pages.
- **Data UX:** Support paging, sorting, and filtering for list features.
- **Media:** For MVP flows, use image URL fields in forms and DTOs rather than file upload providers.

## Outputs to validate

After running the script, confirm the scaffold includes:

1. Backend projects: `API`, `Application`, `Domain`, `Infrastructure`, `Persistence`.
2. Frontend app under `frontend` with Vite + TypeScript.
3. Backend and frontend environment templates.
4. Backend packages for EF/Identity/JWT/Swagger/FluentValidation/AutoMapper.
5. Frontend packages for Router/Axios/React Query/MobX/React Hook Form.
6. Starter frontend API agent with Axios interceptors and `VITE_API_URL` usage.
