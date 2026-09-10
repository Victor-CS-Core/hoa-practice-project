# Accessibility release checkpoint - September 7, 2026

## Scope and dated release evidence

Reviewed September 10, 2026. This records the September 7 accessibility changes and their assessment limits. The combined release was subsequently authorized and deployed; see [release status](RELEASE-STATUS.md). This document is not Section 508 certification or approval for a future deployment, migration, DNS change, or resource deletion.

## Changes

- Opaque profile role badge with a controlled dark-green-on-white color pair, independent of banner imagery.
- Dark text on the gold attendee-total and home Admin badges.
- Readable dark-mode foregrounds for primary buttons, active navigation, event filters, and profile image-source selectors.
- Profile Save Changes uses the shared primary-button colors instead of overriding them.
- Increased the floating Back to events background opacity after reproducing low contrast over bright content in dark mode; the recorded conservative contrast bound improved from 4.13:1 to 5.57:1.
- Distinct accessible labels for avatar and banner zoom sliders, with keyboard-adjustment coverage.
- Removed the Design System page wrapper, lazy route, and desktop/mobile admin links. Shared styling components remain. Former URLs display the existing not-found page.
- Added both-theme accessibility and removed-route regression coverage.

## Evidence and limits

Local combined Release artifact v3 was served on port 5286, with bootstrap and demo seeding disabled. The user-reported real event detail was checked in both themes: zero automated violations, but seven contrast determinations remained incomplete in each theme. The removed route displayed Page Not Found and the admin menu contained no Design System link.

Earlier local regression runs recorded 49 frontend unit tests, 31 backend API tests, and 37 browser tests passing. Browser route tests mock API responses; they do not prove Azure runtime, external storage, or database recovery behavior. A read-only review found no actionable defects in the scoped source changes. Automated results are not Section 508 certification.

## Remaining assessment limits

1. Screen-reader review was explicitly waived for the September 7 release, not completed. Automated tests cannot replace it.
2. Broader image-backed contrast and interaction coverage remain non-exhaustive. Preserve incomplete contrast determinations as unresolved, not passes.
3. A later focused run recorded 19 accessibility/route tests after the final contrast change. These are historical results; no new accessibility test run is claimed by this documentation review.
4. Azure SQL restore rehearsal was also waived, separately from accessibility. Existing backup settings and a preserved package do not prove recovery works.
5. Reassess these gaps and document release-owner decisions for future releases using [the B1 runbook](B1-DIRECT-DEPLOYMENT.md).

The companion learning site has been updated separately; publishing that guide does not deploy the main HOA app.
