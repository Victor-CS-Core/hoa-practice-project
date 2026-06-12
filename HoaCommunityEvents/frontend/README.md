# HOA Community Events Frontend

React + TypeScript + Vite frontend for the HOA Community Events application.

## Tech Stack

- React 19
- TypeScript
- React Router
- TanStack Query
- MobX
- React Hook Form
- Axios
- Tailwind CSS v4
- Lucide React icons

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure API URL in a local environment file:

```bash
# .env.local
VITE_API_URL=https://localhost:7011/api
```

3. Start development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - run Vite dev server
- `npm run build` - type-check and production build
- `npm run lint` - run ESLint checks
- `npm run preview` - preview production build

## Azure Deployment

Deploy target: Azure Static Web Apps.

Build settings:

- App location: `HoaCommunityEvents/frontend`
- Output location: `dist`
- API location: empty

Required Static Web App environment variable:

- `VITE_API_URL=https://hoa-events-prod-czd6cmg6fyhwcha7.eastus2-01.azurewebsites.net/api`

The project includes `public/staticwebapp.config.json` for SPA deep-link fallback. This is required for routes such as `/login`, `/register`, `/events/:id`, and `/admin/events` to work on page refresh/direct navigation.

## Routes

- `/` - Home
- `/implementation` - Integration/contract status checks
- `/login` - Login
- `/register` - Register
- `/events` - Resident/Admin event feed
- `/events/:id` - Event details
- `/events/create` - Admin create event
- `/events/:id/edit` - Admin edit event
- `/admin/events` - Admin management dashboard
- `/profile/:username` - Profile page

## Notes

- `AdminAttendeesPage` now redirects to `/admin/events` so attendee management stays inside the unified admin dashboard.
- API integration assumes backend contracts for paged events and validation error envelopes are available.
- If `VITE_API_URL` is not present at build/runtime, frontend falls back to the production API base URL.

## Production Troubleshooting

- `POST /account/login` returns `405` from the Static Web App host:
  - Frontend is calling itself instead of API. Verify `VITE_API_URL` and redeploy.

- Browser shows CORS failure to API origin:
  - Update API app settings to allow frontend origin via `Cors__AllowedOrigins__0` (or `Cors__AllowedOrigins`) and restart API.

- Route `/login` (or other SPA route) returns `404` on direct load:
  - Confirm `staticwebapp.config.json` was included in deployed artifact.
