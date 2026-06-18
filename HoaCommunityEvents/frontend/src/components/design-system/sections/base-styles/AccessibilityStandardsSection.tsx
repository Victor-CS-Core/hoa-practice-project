import { SectionShell } from "@/components/design-system/SectionShell";

const code = `<form aria-labelledby="profile-form-title" className="space-y-4">
  <h2 id="profile-form-title">Profile details</h2>

  <label htmlFor="email">Email address</label>
  <Input id="email" type="email" autoComplete="email" />

  <label htmlFor="bio">Bio</label>
  <RichTextField ariaLabel="Bio" />

  <Button type="submit">Save profile</Button>
</form>`;

export function AccessibilityStandardsSection() {
  return (
    <SectionShell
      id="accessibility-standards"
      title="Accessibility standards"
      description={
        <>
          Baseline Section 508 and WCAG 2 AA standards that every design-system
          primitive must satisfy. Treat this as required quality criteria, not
          optional polish.
        </>
      }
      whenToUse={
        <ul>
          <li>As a release checklist for new UI primitives and variants.</li>
          <li>When reviewing frontend pull requests for compliance risk.</li>
          <li>
            When adding docs examples that should model accessible defaults.
          </li>
        </ul>
      }
      whenNotToUse={
        <ul>
          <li>
            As a replacement for route-level axe audits or manual keyboard
            checks.
          </li>
          <li>
            As a waiver for product-specific legal or policy requirements.
          </li>
          <li>As permission to bypass semantic HTML in implementation code.</li>
        </ul>
      }
      preview={
        <div className="space-y-6">
          <div className="callout bg-surface">
            <p className="text-ink-body">
              Every interactive control must be reachable by keyboard, expose an
              accessible name, and display a visible focus indicator.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-md border border-hairline bg-page p-4">
              <h3 className="text-sm font-semibold text-ink-display">
                Color and contrast
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-body">
                <li>Normal text: at least 4.5:1 contrast ratio.</li>
                <li>Large text and key UI indicators: at least 3:1.</li>
                <li>Never communicate state using color alone.</li>
              </ul>
            </article>

            <article className="rounded-md border border-hairline bg-page p-4">
              <h3 className="text-sm font-semibold text-ink-display">
                Forms and controls
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-body">
                <li>All form inputs have programmatic labels.</li>
                <li>Validation messages include clear text guidance.</li>
                <li>Custom widgets include ARIA roles only when needed.</li>
              </ul>
            </article>

            <article className="rounded-md border border-hairline bg-page p-4">
              <h3 className="text-sm font-semibold text-ink-display">
                Keyboard and focus
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-body">
                <li>No keyboard trap in dialogs, menus, or editors.</li>
                <li>
                  Scrollable regions are focusable when user input is required.
                </li>
                <li>Tab order follows visual and semantic reading order.</li>
              </ul>
            </article>

            <article className="rounded-md border border-hairline bg-page p-4">
              <h3 className="text-sm font-semibold text-ink-display">
                Motion and media
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-body">
                <li>Honor reduced-motion user preference.</li>
                <li>Avoid transient low-contrast animation states.</li>
                <li>Ensure media has text alternatives when needed.</li>
              </ul>
            </article>
          </div>
        </div>
      }
      code={code}
      options={
        <ul className="list-disc pl-5">
          <li>
            Run <code>npm run test:e2e -- tests/e2e/accessibility.spec.ts</code>{" "}
            after any design-system visual or semantic update.
          </li>
          <li>
            Prefer semantic HTML first, then add ARIA only to close gaps for
            custom controls.
          </li>
          <li>
            Keep link discoverability high: body-content links are underlined by
            default and should remain visually distinct from surrounding text.
          </li>
        </ul>
      }
    />
  );
}
