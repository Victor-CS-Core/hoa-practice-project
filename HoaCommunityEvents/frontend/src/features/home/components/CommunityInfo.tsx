import { Heart, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function CommunityInfo() {
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
            HOA Community Events brings neighbors together through shared
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
          className="hidden h-full min-h-[240px] md:block"
          style={{
            background:
              "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)",
          }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex items-center gap-3 rounded-xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                Community Events
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                Your Neighborhood
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
              <Heart className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-medium text-emerald-800">
                Stronger Together
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
