# HoaCommunityEvents

HOA Community Events MVP (Clean Architecture + React SPA).

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

3. Apply EF Core migrations from the solution root:

   ```bash
   dotnet ef database update -p Persistence -s API
   ```

4. Configure frontend environment in frontend/.env:

   ```text
   VITE_API_URL=http://localhost:5000/api
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
   - Health: http://localhost:5000/health
   - Swagger UI (Development): http://localhost:5000/swagger

9. Validation commands:

   ```bash
   # from solution root
   dotnet build HoaCommunityEvents.slnx

   # from frontend folder
   npm run build
   npm run lint
   ```
