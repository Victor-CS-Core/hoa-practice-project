import type { ReactNode } from "react";
import { BRAND } from "../../../app/branding";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[calc(100svh-9rem)] w-full bg-page font-body text-ink-body">
      <div className="mx-auto grid min-h-[calc(100svh-9rem)] max-w-6xl grid-cols-1 gap-5 p-4 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:p-10">
        <div className="auth-motion-board relative overflow-hidden rounded-4xl border border-hairline bg-surface p-6 text-ink-body shadow-[0_25px_60px_-30px_rgba(15,23,42,0.28)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30 [background:linear-gradient(120deg,transparent_0%,transparent_35%,rgba(255,209,140,0.4)_36%,transparent_38%,transparent_100%)]" />
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-accent/20" />
          <div className="absolute -left-24 bottom-8 h-56 w-56 rounded-full border border-accent/15" />

          <div className="relative z-10">
            <p
              className="font-auth-ui auth-motion-item w-fit rounded-full border border-accent/35 bg-accent-faded px-3 py-1 text-xs uppercase tracking-[0.22em] text-accent-display"
            >
              {BRAND.communityLabel}
            </p>
            <h1
              className="font-auth-display auth-motion-item auth-motion-delay-1 mt-5 max-w-lg text-3xl font-semibold leading-tight text-ink-display sm:text-4xl lg:text-5xl"
            >
              Built for front porches, block parties, and real neighbors.
            </h1>
            <p
              className="auth-motion-item auth-motion-delay-2 mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
            >
              Manage dues meetings, weekend socials, and volunteer days in one
              shared space every resident can trust.
            </p>

            <div className="auth-motion-item auth-motion-delay-3 mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
              <div
                className="rounded-xl border border-hairline bg-page p-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <p
                  className="font-auth-ui text-xs uppercase tracking-[0.14em] text-ink-muted"
                >
                  Monthly
                </p>
                <p
                  className="mt-1 font-heading text-2xl text-ink-display"
                >
                  12+
                </p>
                <p
                  className="text-xs text-ink-muted"
                >
                  Events coordinated
                </p>
              </div>
              <div
                className="rounded-xl border border-hairline bg-page p-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <p
                  className="font-auth-ui text-xs uppercase tracking-[0.14em] text-ink-muted"
                >
                  Resident reach
                </p>
                <p
                  className="mt-1 font-heading text-2xl text-ink-display"
                >
                  98%
                </p>
                <p
                  className="text-xs text-ink-muted"
                >
                  Notified on time
                </p>
              </div>
            </div>

            <div className="auth-motion-item auth-motion-delay-4 mt-8 rounded-2xl border border-signal bg-signal-faded p-4 text-signal-display shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)] sm:p-5">
              <p className="font-auth-ui text-xs tracking-[0.16em] uppercase">
                This week on your street
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p
                  className="flex items-center justify-between border-b border-signal/55 pb-2"
                >
                  <span>Garden Club Walkthrough</span>
                  <span className="font-semibold">Tue 6:30 PM</span>
                </p>
                <p
                  className="flex items-center justify-between border-b border-signal/55 pb-2"
                >
                  <span>Pool Committee Check-in</span>
                  <span className="font-semibold">Thu 7:00 PM</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Summer Block Social</span>
                  <span className="font-semibold">Sat 4:00 PM</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="auth-motion-card w-full max-w-xl rounded-[1.8rem] border border-hairline bg-page p-6 shadow-[0_26px_40px_-30px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
            <div className="text-center lg:text-left">
              <div
                aria-hidden="true"
                className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-accent bg-accent font-heading text-lg font-bold text-page shadow-md lg:mx-0"
              >
                {BRAND.acronym}
              </div>
              <p
                className="font-auth-ui text-xs uppercase tracking-[0.2em] text-ink-muted"
              >
                Commons Portal Access
              </p>
              <h2
                className="font-auth-display mt-2 text-3xl font-semibold tracking-tight text-ink-display sm:text-4xl"
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base"
                >
                  {subtitle}
                </p>
              )}
            </div>
            <div
              className="mt-7 border-t border-hairline pt-6"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
