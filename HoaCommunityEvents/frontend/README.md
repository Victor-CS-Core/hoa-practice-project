# HOA Community Events frontend

This folder contains the React 19 and TypeScript 6 single-page application. It is a separate source project for fast browser development, but it is bundled into and served by the ASP.NET Core BFF for production.

Read the repository-level [HOA Codebase Guide](../docs/HOA-CODEBASE-GUIDE.md) for the end-to-end explanation.

## Responsibilities

- `src/main.tsx` creates the React root and installs the theme, TanStack Query, and router providers.
- `src/app/router/routes.tsx` declares routes and lazy-loads pages.
- `src/app/layout/AppLayout.tsx` restores the cookie session by calling the current-user endpoint.
- `src/app/stores/authStore.ts` keeps only the current `User` UI state; it does not store an authentication credential.
- `src/app/api/agent.ts` owns Axios, the `/api` base URL, credentials, CSRF bootstrap/header attachment, and typed API groups.
- `src/hooks/` owns TanStack Query keys, fetches, mutations, invalidation, and the EventSource hook.
- `src/features/` owns product pages and feature-specific components.
- `src/components/design-system/` owns reusable UI primitives, including the accessible image-setting switch.
- `tests/e2e/` owns Playwright browser flows and their in-browser API mock.

## Why Axios and TanStack Query both exist

They solve different layers:

```text
page -> TanStack Query hook -> Axios agent -> /api -> ASP.NET Core
```

- Axios builds and sends HTTP requests, serializes request bodies, parses JSON responses, exposes HTTP errors, includes cookies, and runs the CSRF interceptor.
- TanStack Query decides when to call Axios and manages cached server data, loading/error flags, mutations, and targeted refetches.

TanStack Query still needs a promise-returning request function; Axios supplies it. Axios alone would require pages to reimplement cache and refetch behavior. The minimal migration decision is to keep both rather than replace the working Axios layer with a new `fetch` wrapper.

## Development

Start the ASP.NET Core API first:

```bash
dotnet run --project ../backend/src/API --launch-profile https
```

Then install and run the browser project:

```bash
npm ci
npm run dev
```

`vite.config.ts` proxies `/api` and `/health` to `https://localhost:7011`. Browser code continues to use relative URLs, so cookies behave as same-origin credentials.

## Authentication and CSRF

The frontend does not receive, read, or persist a login token.

1. An unsafe Axios request first obtains a request token from `GET /api/security/csrf` if no token is cached in module memory.
2. The browser stores the paired `HttpOnly` antiforgery cookie.
3. The Axios request interceptor puts the request token in `X-CSRF-TOKEN` for `POST`, `PUT`, `PATCH`, and `DELETE`.
4. Login/register responses set the encrypted Identity cookie. The browser sends it automatically on later requests.
5. `Account.current()` restores the current user after a reload.
6. Login, registration, and logout reset the CSRF request-token cache because identity changed.

See `src/app/api/agent.test.ts` and `src/app/stores/authStore.test.ts` for executable examples.

## Server-state and realtime flow

`useEvents.ts`, `useAttendance.ts`, `useProfile.ts`, and `useAdminUsers.ts` wrap Axios functions with TanStack Query. Mutation success invalidates affected keys so active pages refetch.

`useEventStream.ts` opens the authenticated relative stream `/api/events/{id}/stream`. An `attendance-changed` event invalidates:

- `['event', id]`
- `['events']`
- `['attendees', id]`

The first `open` only establishes the stream. A later `open` indicates reconnection and invalidates the same keys to recover any notice missed while disconnected. Cleanup removes listeners and closes the EventSource when the page unmounts or the event ID changes.

## Image switches and uploads

`src/components/design-system/ui/switch.tsx` is a native button with `role="switch"`, `aria-checked`, keyboard activation, disabled behavior, and visible focus styling. It is used by:

- `src/features/profiles/components/ProfileEditForm.tsx` for avatar and profile banner.
- `src/features/events/components/AdminEventForm.tsx` for event banner.

Turning a switch off clears the URL/crop state, selected file, and upload feedback. On submission, disabled image properties are `undefined`, so the JSON request omits them; the server DTO receives no image URL and persists no banner/avatar.

For uploads, the frontend requests signed parameters from `/api/uploads/cloudinary/signature`, then sends image bytes directly to Cloudinary with `fetch`. The API secret never enters browser code.

## Routes

| Route | Access | Page |
| --- | --- | --- |
| `/login`, `/register` | Public | Account entry |
| `/`, `/home` | Signed in | Home |
| `/events` | Signed in | Event feed |
| `/events/:id` | Signed in | Event detail, attendance, and SSE |
| `/profile/:username` | Resident or admin | Profile |
| `/admin/events` | Admin | Event management |
| `/admin/users` | Admin | User management |
| `/admin/design-system` | Admin | Component reference |

`/events/create` redirects to the event feed and `/events/:id/edit` redirects to the event detail because creation/editing is presented inside the admin workflows rather than standalone route pages.

## Scripts

```bash
npm run dev          # Vite development server
npm run lint         # ESLint
npm run test:run     # Vitest once
npm run build        # TypeScript project build plus Vite production build
npm run test:e2e     # Playwright Chromium flows
npm run preview      # Local preview only, not the production server
```

## Production publishing

From the repository folder:

```bash
dotnet publish backend/src/API/HoaCommunityEvents.API.csproj -c Release
```

The API project runs `npm ci` and `npm run build`, includes `dist/**` under the publish artifact's `wwwroot`, and serves it from the same origin as `/api`. ASP.NET Core's SPA fallback returns `index.html` for React Router deep links without swallowing unknown API paths.

The old Azure Static Web Apps workflow is a temporary cutover artifact, not the target architecture. Do not disable it until the combined App Service deployment and client-facing domain have passed the documented smoke tests.

## Troubleshooting

- `/api` fails during development: confirm the API is listening at `https://localhost:7011` and trust the local HTTPS certificate.
- Unsafe request returns 400: confirm `GET /api/security/csrf` succeeded and the request includes `X-CSRF-TOKEN` while the browser retained the cookie.
- Protected request returns 401: call `/api/account/current`; the session may be absent, expired, signed out, or rejected by security-stamp validation.
- Admin request returns 403: authentication succeeded, but the cookie principal lacks the `hoa_admin` role required by the policy.
- Published deep route returns 404: verify the publish output contains `wwwroot/index.html`.
- Unknown `/api` route returns HTML: the current BFF build is not running; API misses should return the JSON `not_found` envelope.
