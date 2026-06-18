---
description: "Use when working on this codebase and making code, UI, architecture, or documentation changes. Enforces graphify-first context use, design-system-first UI implementation, and periodic graphify updates."
name: "Graphify And Design System Directives"
applyTo: "HoaCommunityEvents/**, tests/**, playwright.config.ts, package.json"
---

# Graphify and Design System Directives

- Strongly prefer using graphify resources when present before implementing non-trivial code changes.
- If HoaCommunityEvents/graphify-out/graph.json exists, query graphify for architecture, flow, dependency, and ownership questions before changing code.
- Prefer graphify query, path, and explain workflows to ground implementation decisions in current project structure.

## Graph Freshness Rule

- Keep graphify data current during active development.
- Preferred cadence: run a graphify refresh on every commit.
- Also refresh after structural changes (new folder, deleted folder, file move/rename, major module boundary change), even before commit when practical.
- Preferred command: /graphify HoaCommunityEvents --update
- If graphify-out does not exist yet, run an initial build first: /graphify HoaCommunityEvents

## UI and Design System Rule

- For frontend UI work, use the existing design system resources first.
- Check these sources before adding UI primitives or tokens:
  - HoaCommunityEvents/frontend/AGENTS.md
  - HoaCommunityEvents/frontend/src/styles/design-system.css
  - HoaCommunityEvents/frontend/src/components/design-system/ui/
  - HoaCommunityEvents/frontend/src/components/design-system/sections/
- Reuse existing tokens and primitives before creating ad-hoc styles.
- Avoid introducing one-off hex colors or parallel button/input variant systems when a design-system token or primitive exists, unless there is a documented exception.
