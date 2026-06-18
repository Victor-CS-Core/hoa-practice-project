import {
  CalendarDays,
  LogIn,
  UserPlus,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/design-system/ui/button";
import type { User } from "../../../types/user";
import { BRAND } from "../../../app/branding";

interface HeroBannerProps {
  user: User | null;
  isAdmin: boolean;
}

export function HeroBanner({ user, isAdmin }: HeroBannerProps) {
  const isGuest = !user;

  return (
    <section className="home-hero-banner animate-fade-up relative overflow-hidden rounded-2xl p-8 sm:p-10 md:p-12">
      {/* Decorative background elements */}
      <div className="home-hero-glow pointer-events-none absolute inset-0" />
      <div className="home-hero-orb pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full opacity-10 sm:h-64 sm:w-64" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-ink backdrop-blur-sm">
              {BRAND.communityLabel}
            </span>
          </div>

          <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {isGuest
              ? "Welcome to Your Community"
              : `Welcome back, ${user.displayName}`}
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-accent-ink sm:text-lg">
            {isGuest
              ? "Discover local events, connect with neighbors, and stay involved in Cedar Grove."
              : isAdmin
                ? "Manage events, track attendance, and keep your community engaged."
                : "Stay up to date with upcoming events and manage your RSVPs."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isGuest ? (
            <>
              <Button
                asChild
                variant="secondary"
                className="h-auto bg-page px-5 py-3 text-accent-display hover:bg-surface"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-auto border border-white/30 bg-white/10 px-5 py-3 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link to="/register">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="secondary"
                className="h-auto bg-page px-5 py-3 text-accent-display hover:bg-surface"
              >
                <Link to="/events">
                  Browse Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto border border-white/30 bg-white/10 px-5 py-3 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Link to="/admin/events">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
