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
