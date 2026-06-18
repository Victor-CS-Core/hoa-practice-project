import { AlignLeft, Calendar, MapPin, User, Users } from "lucide-react";
import { Badge } from "../../../components/design-system/ui/badge";
import type { HoaEvent } from "../../../types/event";

interface EventInfoPanelProps {
  event: HoaEvent;
}

export function EventInfoPanel({ event }: EventInfoPanelProps) {
  const isCancelled = event.status === "Cancelled";

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = `${start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Badge tone="neutral" className="font-medium">
            {event.category}
          </Badge>
          <Badge
            tone={isCancelled ? "muted" : "accent"}
            className={isCancelled ? "bg-danger-faded text-danger-display" : ""}
          >
            {event.status}
          </Badge>
        </div>

        <h1 className="mb-2 font-heading text-4xl font-bold leading-tight text-ink-display">
          {event.title}
        </h1>

        <p className="flex items-center gap-2 text-lg text-ink-muted">
          <User className="h-5 w-5" /> Hosted by {event.hostDisplayName}
        </p>
      </div>

      <div className="h-px w-full bg-hairline" />

      <div className="flex flex-col gap-5 text-ink-body">
        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-surface p-2 text-ink-muted">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink-display">{dateStr}</div>
            <div className="text-ink-muted">{timeStr}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-surface p-2 text-ink-muted">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink-display">
              {event.locationWithinCommunity}
            </div>
            <div className="text-ink-muted">Community Location</div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-surface p-2 text-ink-muted">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-ink-display">
              {event.attendeeCount}{" "}
              {event.maxAttendees ? `/ ${event.maxAttendees}` : ""} Attendees
            </div>
            {event.maxAttendees &&
              event.attendeeCount >= event.maxAttendees &&
              !isCancelled && (
                <div className="text-sm font-medium text-signal-display">
                  Event is currently full
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-hairline" />

      <div>
        <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-ink-display">
          <AlignLeft className="h-5 w-5 text-ink-muted" />
          About this event
        </h3>
        <div className="whitespace-pre-line leading-relaxed text-ink-body">
          {event.description}
        </div>
      </div>
    </div>
  );
}
