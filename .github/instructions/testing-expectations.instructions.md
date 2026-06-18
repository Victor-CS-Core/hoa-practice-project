---
description: "Use when making backend, frontend, or e2e changes. Enforces testing expectations and area-appropriate validation before completion."
name: "Testing Expectations By Area"
applyTo: "HoaCommunityEvents/API/**, HoaCommunityEvents/Application/**, HoaCommunityEvents/Domain/**, HoaCommunityEvents/Infrastructure/**, HoaCommunityEvents/Persistence/**, HoaCommunityEvents/API.Tests/**, HoaCommunityEvents/frontend/src/**/*.ts, HoaCommunityEvents/frontend/src/**/*.tsx, HoaCommunityEvents/frontend/src/**/*.css, tests/e2e/**/*.ts"
---

# Testing Expectations By Area

- For backend changes in API, Application, Domain, Infrastructure, or Persistence:
  - Prefer running focused API tests first, then broader build validation as needed.
- For frontend changes in HoaCommunityEvents/frontend/src:
  - Prefer running targeted frontend unit tests related to changed features.
  - When tests do not exist for non-trivial logic, propose adding tests.
- For end-to-end workflow changes in tests/e2e:
  - Run affected Playwright specs before finalizing.
- In final status updates, explicitly state what was validated and what was not run.
