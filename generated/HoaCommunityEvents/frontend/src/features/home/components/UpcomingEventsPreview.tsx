import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EventCard } from "../../events/components/EventCard";
import type { HoaEvent } from "../../../types/event";

interface UpcomingEventsPreviewProps {
  events: HoaEvent[];
  isLoading: boolean;
  isError: boolean;
  role: "guest" | "resident" | "hoa_admin";
  onJoinLeave?: (eventId: string, joining: boolean) => void;
}

export function UpcomingEventsPreview({
  events,
  isLoading,
  isError,
  role,
  onJoinLeave,
}: UpcomingEventsPreviewProps) {
  const navigate = useNavigate();

  return (
    <section className="animate-fade-up animate-delay-200">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-stone-900">
            Upcoming Events
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Don't miss what's happening in your community
          </p>
        </div>
        <Link
          to="/events"
          className="hidden items-center gap-1 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800 sm:inline-flex"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border border-stone-200 bg-stone-100"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Unable to load events. Please try again later.
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No upcoming events at the moment. Check back soon!
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              role={role}
              onViewDetails={(eventId) => navigate(`/events/${eventId}`)}
              onJoinLeave={onJoinLeave}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center sm:hidden">
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800"
        >
          View all events
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
