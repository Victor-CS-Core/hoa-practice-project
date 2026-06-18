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
      <div className="animate-fade-up animate-delay-300 h-full rounded-xl border border-hairline bg-page p-6 shadow-sm">
        <div className="mb-4 h-7 w-36 animate-pulse rounded bg-surface" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-hairline bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="animate-fade-up animate-delay-300 h-full rounded-xl border border-hairline bg-page p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-accent-display" />
          <h2 className="font-heading text-xl font-bold text-ink-display">
            My Events
          </h2>
        </div>
        {myEvents.length > 0 && (
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-display transition-colors hover:text-accent"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {myEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline bg-surface px-4 py-6 text-center">
          <CalendarCheck className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-muted">
            You haven't joined any events yet.
          </p>
          <Link
            to="/events"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-display hover:text-accent"
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
              className="group flex items-center gap-3 rounded-lg border border-hairline bg-surface p-3 transition-all hover:border-accent/35 hover:bg-accent-faded"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-faded text-accent-display transition-colors group-hover:bg-accent-faded/80">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-display group-hover:text-accent-display">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
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
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-accent-display" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
