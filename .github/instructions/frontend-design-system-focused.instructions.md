---
description: "Use when creating or modifying frontend UI in HoaCommunityEvents. Enforces design-system-first implementation with existing tokens and primitives."
name: "Frontend Design System Focus"
applyTo: "HoaCommunityEvents/frontend/src/**/*.ts, HoaCommunityEvents/frontend/src/**/*.tsx, HoaCommunityEvents/frontend/src/**/*.css"
---

# Frontend Design System Focus

- Before implementing UI, consult:
  - HoaCommunityEvents/frontend/AGENTS.md
  - HoaCommunityEvents/frontend/src/styles/design-system.css
  - HoaCommunityEvents/frontend/src/components/design-system/ui/
  - HoaCommunityEvents/frontend/src/components/design-system/sections/
- Reuse existing tokens and primitives first.
- Avoid ad-hoc hex colors and one-off component variant systems when an existing design-system primitive or token can satisfy the requirement.
- For new UI primitives, prefer adding them under HoaCommunityEvents/frontend/src/components/design-system/ui/ and documenting usage in the design-system sections.
