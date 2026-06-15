import { CalendarDays, LogIn, UserPlus, ArrowRight, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "../../../types/user";
import { BRAND } from "../../../app/branding";

interface HeroBannerProps {
  user: User | null;
  isAdmin: boolean;
}

export function HeroBanner({ user, isAdmin }: HeroBannerProps) {
  const isGuest = !user;

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-2xl p-8 sm:p-10 md:p-12"
      style={{
        background:
          "linear-gradient(135deg, #065f46 0%, #047857 30%, #0d9488 70%, #14b8a6 100%)",
      }}
    >
      {/* Decorative background elements */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full opacity-10 sm:h-64 sm:w-64"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-100 backdrop-blur-sm">
              {BRAND.communityLabel}
            </span>
          </div>

          <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {isGuest
              ? "Welcome to Your Community"
              : `Welcome back, ${user.displayName}`}
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-emerald-100 sm:text-lg">
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
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/events"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
