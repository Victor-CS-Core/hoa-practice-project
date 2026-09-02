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

2. Start the ASP.NET Core API on `https://localhost:7011`. Vite proxies `/api` and `/health` to it, keeping browser cookies same-origin.

3. Start the development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - run Vite dev server
- `npm run build` - type-check and production build
- `npm run lint` - run ESLint checks
- `npm run preview` - preview production build

## Production Publishing

The frontend is published with the ASP.NET Core BFF rather than deployed independently.

From the `HoaCommunityEvents` folder:

```bash
dotnet publish backend/src/API/HoaCommunityEvents.API.csproj -c Release
```

Publishing runs `npm ci` and `npm run build`, then copies `dist` into the published app's `wwwroot`. ASP.NET Core serves `/`, frontend assets, and React Router deep links from the same origin as `/api`.

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
- Browser requests use relative `/api` URLs; Vite proxies them in development and the ASP.NET Core BFF handles them in production.

## Troubleshooting

- `/api` requests fail during development:
  - Confirm the ASP.NET Core API is running on `https://localhost:7011`, which is the Vite proxy target.

- A published React route returns `404`:
  - Confirm the publish output contains `wwwroot/index.html`; the BFF uses it only for non-API fallback routes.

- An unknown API route returns HTML:
  - Confirm the published server is running the current BFF build; `/api/**` misses return JSON 404 before the SPA fallback.
