# Design System Migration - Phase 2 Queue

## Prioritization Logic

1. Highest traffic and highest dependency surfaces first.
2. Files with both legacy primitive imports and heavy ad-hoc color usage are highest priority.
3. Convert by vertical slices to reduce regression risk.

## Wave 1 - App Shell and Shared Controls

- `src/app/layout/AppLayout.tsx`
- `src/app/router/ProtectedRoute.tsx`
- `src/app/router/routes.tsx`

Target outcomes:

- Remove imports from `src/components/ui/*`
- Replace with design-system primitives and token classes

## Wave 2 - Events Core Pages

- `src/features/events/EventListPage.tsx`
- `src/features/events/EventDetailsPage.tsx`
- `src/features/events/AdminDashboardPage.tsx`
- `src/features/events/AdminUserManagementPage.tsx`

Target outcomes:

- Remove hardcoded hex utility classes
- Replace stone/emerald/red/amber palette usage with design-system tokens

## Wave 3 - Events Components

- `src/features/events/components/AdminEventForm.tsx`
- `src/features/events/components/AdminEventList.tsx`
- `src/features/events/components/EventCard.tsx`
- `src/features/events/components/EventInfoPanel.tsx`
- `src/features/events/components/AttendanceActionCard.tsx`
- `src/features/events/components/EventsPagination.tsx`
- `src/features/events/components/AdminAttendeeList.tsx`
- `src/features/events/components/AdminConfirmModal.tsx`

Target outcomes:

- Fully migrate to `src/components/design-system/ui/*`
- Normalize button/input/badge/dropdown/dialog usage

## Wave 4 - Profiles and Home

- `src/features/profiles/ProfilePage.tsx`
- `src/features/profiles/components/ProfileOverview.tsx`
- `src/features/profiles/components/ProfileEditForm.tsx`
- `src/features/home/HomePage.tsx`
- `src/features/home/components/CommunityInfo.tsx`
- `src/features/home/components/HeroBanner.tsx`

Target outcomes:

- Replace legacy bridge classes and ad-hoc palettes
- Align to design-system typography and tokenized surfaces

## Validation Checklist Per Wave

- [ ] Frontend compiles (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Affected tests run
- [ ] Manual smoke checks recorded

## Progress Log

- 2026-06-18: Wave 3 started by migrating `src/features/events/components/AdminConfirmModal.tsx` to design-system button primitive and tokenized palette classes.
- 2026-06-18: Migrated `src/features/events/components/AdminEventForm.tsx` to design-system Button/Input primitives and tokenized classes; removed legacy button variant usage (`default`/`outline`).
- 2026-06-18: Migrated `src/features/events/components/AdminEventList.tsx` to design-system Badge/Button/Dropdown primitives and removed legacy tooltip/utility color palette usage.
- 2026-06-18: Migrated `src/features/events/components/EventCard.tsx` and `src/features/events/components/EventInfoPanel.tsx` to design-system Badge/Button primitives and tokenized classes; removed legacy `src/components/ui/*` dependencies.
- 2026-06-18: Migrated `src/features/events/components/AttendanceActionCard.tsx` and `src/features/events/components/EventsPagination.tsx` to design-system Button and tokenized classes; removed legacy `src/components/ui/*` dependencies.
- 2026-06-18: Migrated `src/features/events/components/AdminAttendeeList.tsx` to tokenized layout classes and removed legacy `src/components/ui/card` dependency.
- 2026-06-18: Migrated `src/features/events/EventDetailsPage.tsx` to design-system Badge/Button primitives and tokenized section layouts; legacy `LoadingState` import remains as shared utility.
- 2026-06-18: Added `src/components/design-system/ui/loading-state.tsx` and migrated all events pages (`EventListPage`, `EventDetailsPage`, `AdminDashboardPage`, `AdminUserManagementPage`) to design-system LoadingState imports; kept `src/components/ui/loading-state.tsx` as compatibility re-export.
- 2026-06-18: Migrated `src/features/events/EventListPage.tsx` surface wrappers, alerts, and admin create action to design-system tokens/primitives; removed remaining theme/hex conditional styling from this page.
- 2026-06-18: Migrated `src/features/events/AdminDashboardPage.tsx` to design-system `Button`/`Select` primitives and tokenized status/error/filter panel styling; removed remaining stone/emerald/amber/red palette utility usage from this page.
- 2026-06-18: Migrated `src/features/events/AdminUserManagementPage.tsx` to design-system `Button`/`Input` primitives and tokenized admin panel/user-row styling; removed theme-context branching and remaining hex/palette utility usage from this page.
- 2026-06-18: Migrated `src/features/events/components/EventsFilterBar.tsx` from `theme-*` bridge classes and emerald utility accents to design-system token styling, completing remaining Wave 2 events filter UI cleanup.
