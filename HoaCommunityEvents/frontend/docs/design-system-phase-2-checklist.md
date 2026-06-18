# Design System Migration - Phase 2 Checklist

## Goal

Phase 2 starts when core product pages are ready to migrate as a coordinated batch with measurable gates.

## Entry Gates (must pass)

- [ ] A current migration baseline exists for legacy imports and token usage.
- [ ] `HoaCommunityEvents/frontend/src/styles/design-system.css` is the canonical token source for UI colors and surfaces.
- [ ] All migration targets for the first batch are identified with owner and order.
- [ ] A rollback plan exists (feature-level revert path).

## In-Scope Surfaces

- App shell and routing UI in `src/app/**`
- Events feature in `src/features/events/**`
- Profiles feature in `src/features/profiles/**`
- Home feature in `src/features/home/**`

## Phase 2 Migration Gates

### Gate A - Primitive Convergence

- [ ] No feature/page files import from `src/components/ui/*`.
- [ ] Feature/page files use `src/components/design-system/ui/*` primitives.
- [ ] Any missing primitive is added to design-system UI first, then consumed by features.

### Gate B - Token Convergence

- [ ] No hardcoded hex classes in feature/page TSX unless documented exception.
- [ ] No ad-hoc `stone-*`, `slate-*`, `emerald-*`, `red-*`, `amber-*` color utilities where token classes exist.
- [ ] Surfaces, text, borders, focus states use design-system tokens (`bg-page`, `bg-surface`, `text-ink-*`, `border-hairline`, etc.).

### Gate C - Theme Convergence

- [ ] Product pages do not rely on legacy `theme-*` bridge classes for new work.
- [ ] Theme behavior is consistent with the design-system dark mode model.

### Gate D - Verification

- [ ] Affected frontend unit tests run for migrated surfaces.
- [ ] Manual smoke check passes for login, events list/details, admin dashboard, profiles.
- [ ] `npm run build` completes successfully.
- [ ] `npm run lint` completes successfully.

## Exit Criteria (Phase 2 complete)

- [ ] Gates A-D all pass.
- [ ] Migration summary is updated in this file with date and owner.
- [ ] Residual exceptions are listed with follow-up issue links.

## Current Status (2026-06-18)

- Entry gates: partial
- Gate A: failing (legacy imports still present in app/events/profiles)
- Gate B: failing (hardcoded hex and palette utility usage present)
- Gate C: partial
- Gate D: not yet evaluated for a full Phase 2 batch
