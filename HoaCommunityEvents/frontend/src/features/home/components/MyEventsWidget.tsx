import { Calendar, MapPin, ArrowRight, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { HoaEvent } from "../../../types/event";

interface MyEventsWidgetProps {
  events: HoaEvent[];
  isLoading: boolean;
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MyEventsWidget({ events, isLoading }: MyEventsWidgetProps) {
  const myEvents = events
    .filter((e) => e.isCurrentUserAttending && e.status === "Published")
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="animate-fade-up animate-delay-300 h-full rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-7 w-36 animate-pulse rounded bg-stone-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-stone-100 bg-stone-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="animate-fade-up animate-delay-300 h-full rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-heading text-xl font-bold text-(--text-primary)">
            My Events
          </h2>
        </div>
        {myEvents.length > 0 && (
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {myEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-4 py-6 text-center">
          <CalendarCheck className="mx-auto mb-2 h-8 w-8 text-stone-300" />
          <p className="text-sm text-stone-500">
            You haven't joined any events yet.
          </p>
          <Link
            to="/events"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Browse events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {myEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50/50 p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-emerald-800">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>
                    {formatEventDate(event.startDate)} •{" "}
                    {formatEventTime(event.startDate)}
                  </span>
                  <span className="hidden items-center gap-1 sm:inline-flex">
                    <MapPin className="h-3 w-3" />
                    {event.locationWithinCommunity}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-emerald-600" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
