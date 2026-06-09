# HoaCommunityEvents

Scaffolded with dotnet-react-clean-architecture skill.

## Stack

- Backend: ASP.NET Core Web API (net10.0), Clean Architecture, service/use-case application layer, EF Core SQL Server, Identity, JWT, AutoMapper, FluentValidation, SignalR, Swagger
- Frontend: React + TypeScript + Vite, React Router, Axios, TanStack Query, MobX, React Hook Form

## Next steps

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

3. Run EF Core migrations from the solution root:

   ```bash
   dotnet ef migrations add InitialCreate -p Persistence -s API
   dotnet ef database update -p Persistence -s API
   ```

4. Start the API:

   ```bash
   dotnet run --project API
   ```

5. Build auth endpoints (register/login/logout/current user) and protected routes.
6. Add CRUD features with paging/sorting/filtering.
