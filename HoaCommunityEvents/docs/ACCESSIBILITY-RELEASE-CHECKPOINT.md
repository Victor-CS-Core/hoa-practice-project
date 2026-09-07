# Accessibility release checkpoint - September 7, 2026

## Scope and release hold

This follow-up changes frontend accessibility and removes the unused Community Admin Design System page. It introduces no backend or database schema change. It does not authorize production deployment, database migration, DNS cutover, or legacy resource deletion.

## Changes

- Opaque profile role badge with a controlled dark-green-on-white color pair, independent of banner imagery.
- Dark text on the gold attendee-total and home Admin badges.
- Readable dark-mode foregrounds for primary buttons, active navigation, event filters, and profile image-source selectors.
- Profile Save Changes uses the shared primary-button colors instead of overriding them.
- Distinct accessible labels for avatar and banner zoom sliders, with keyboard-adjustment coverage.
- Removed the Design System page wrapper, lazy route, and desktop/mobile admin links. Shared styling components remain. Former URLs display the existing not-found page.
- Added both-theme accessibility and removed-route regression coverage.

## Evidence and limits

Local combined Release artifact v3 was served on port 5286, with bootstrap and demo seeding disabled. The user-reported real event detail was checked in both themes: zero automated violations, but seven contrast determinations remained incomplete in each theme. The removed route displayed Page Not Found and the admin menu contained no Design System link.

Earlier local regression runs recorded 49 frontend unit tests, 31 backend API tests, and 37 browser tests passing. Browser route tests mock API responses; they do not prove Azure runtime, external storage, or database recovery behavior. A read-only review found no actionable defects in the scoped source changes. Automated results are not Section 508 certification.

## Remaining gates

1. Obtain green GitHub frontend/backend CI for this pull request and the eventual main-branch release SHA. Release only its exact verified CI artifact.
2. Complete manual review of image-backed text, broader keyboard flows, and assistive-technology behavior; retain unresolved findings as explicit release decisions.
3. Complete the recovery rehearsal and release-owner decisions in `B1-DIRECT-DEPLOYMENT.md`. Existing backup configuration and a preserved package do not establish successful recovery.
4. Obtain explicit production approval before dispatch. Retain B1 and the no-staging approach. Production smoke checks happen only after authorized deployment.

The companion learning site has been updated separately; publishing that guide does not deploy the main HOA app.
