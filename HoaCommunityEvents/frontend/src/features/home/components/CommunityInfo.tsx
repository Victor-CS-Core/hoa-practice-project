import { Heart, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../app/theme/theme-context";
import { BRAND } from "../../../app/branding";

export function CommunityInfo() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const visualGradient = isDark
    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0b1220 100%)"
    : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)";

  const badgeTone = isDark ? "bg-stone-800/80" : "bg-white/70";
  const badgeTextTone = isDark ? "text-emerald-200" : "text-emerald-800";
  const iconTone = isDark ? "text-emerald-300" : "text-emerald-600";

  return (
    <section className="animate-fade-up animate-delay-400 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="grid items-center gap-0 md:grid-cols-2">
        {/* Left: text content */}
        <div className="p-8 md:p-10">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Our Community
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-stone-900">
            Building Stronger Connections
          </h2>
          <p className="mt-3 leading-relaxed text-stone-600">
            {BRAND.appName} brings neighbors together through shared
            experiences. From pool parties to board meetings, every event is an
            opportunity to strengthen our community bonds.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <CalendarDays className="h-4 w-4" />
              Explore Events
            </Link>
          </div>
        </div>

        {/* Right: decorative visual */}
        <div
          className="hidden h-full min-h-60 md:block"
          style={{
            background: visualGradient,
          }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div
              className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-sm backdrop-blur-sm ${badgeTone}`}
            >
              <CalendarDays className={`h-5 w-5 ${iconTone}`} />
              <span className={`text-sm font-medium ${badgeTextTone}`}>
                {BRAND.appName}
              </span>
            </div>
            <div
              className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-sm backdrop-blur-sm ${badgeTone}`}
            >
              <MapPin className={`h-5 w-5 ${iconTone}`} />
              <span className={`text-sm font-medium ${badgeTextTone}`}>
                Your Neighborhood
              </span>
            </div>
            <div
              className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-sm backdrop-blur-sm ${badgeTone}`}
            >
              <Heart className="h-5 w-5 text-rose-500" />
              <span className={`text-sm font-medium ${badgeTextTone}`}>
                Stronger Together
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
