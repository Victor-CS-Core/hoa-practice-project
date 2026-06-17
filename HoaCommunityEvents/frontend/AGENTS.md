# Frontend Agent Notes

<!-- bm-design-system:start -->

## Design system

This codebase has a design system documented at [/admin/design-system](/admin/design-system). The page previews and explains every primitive — colors, typography, structure, base styles, and elements — and shows the exact markup to use.

When implementing UI:

1. Always check the design system first. Before writing frontend markup or styles, refer to /admin/design-system and the components under src/components/design-system/ui and src/components/design-system/sections. Use the existing tokens (bg-page, bg-surface, text-ink-body, etc.) and the existing primitives (Button, Input, Badge, Select, Checkbox, Radio, RichTextField, Dialog, ThemeToggle and friends).
2. Do not invent ad-hoc styles. Do not use raw hex values, one-off font sizing, or one-off Tailwind utilities when a token or primitive exists. Do not introduce a second variant system alongside existing cva-based primitives.
3. Use bare semantic HTML for text elements. Headings, paragraph text, links, list text, blockquotes, hr, labels, and legends already receive base-layer typography from design-system.css. Prefer semantic markup and only add layout utilities unless a sanctioned variant is needed.
4. If a needed UI element is missing, propose it as a design-system addition before building a one-off. Default to adding it under src/components/design-system/ui and documenting it in the design-system page.
5. Re-running the bm-design-system skill is the supported path to extend sections or update tokens.
<!-- bm-design-system:end -->
