import { AlignLeft, Calendar, MapPin, User, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
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
          <Badge
            variant="outline"
            className="border-stone-200 bg-stone-100 font-medium text-stone-700"
          >
            {event.category}
          </Badge>
          <Badge
            variant="secondary"
            className={
              isCancelled
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }
          >
            {event.status}
          </Badge>
        </div>

        <h1 className="mb-2 font-heading text-4xl font-bold leading-tight text-stone-900">
          {event.title}
        </h1>

        <p className="flex items-center gap-2 text-lg text-stone-500">
          <User className="h-5 w-5" /> Hosted by {event.hostDisplayName}
        </p>
      </div>

      <div className="h-px w-full bg-stone-200" />

      <div className="flex flex-col gap-5 text-stone-700">
        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-stone-100 p-2 text-stone-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-stone-900">{dateStr}</div>
            <div className="text-stone-500">{timeStr}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-stone-100 p-2 text-stone-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-stone-900">
              {event.locationWithinCommunity}
            </div>
            <div className="text-stone-500">Community Location</div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="mt-1 shrink-0 rounded-lg bg-stone-100 p-2 text-stone-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-stone-900">
              {event.attendeeCount}{" "}
              {event.maxAttendees ? `/ ${event.maxAttendees}` : ""} Attendees
            </div>
            {event.maxAttendees &&
              event.attendeeCount >= event.maxAttendees &&
              !isCancelled && (
                <div className="text-sm font-medium text-amber-600">
                  Event is currently full
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-stone-200" />

      <div>
        <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-stone-900">
          <AlignLeft className="h-5 w-5 text-stone-400" />
          About this event
        </h3>
        <div className="whitespace-pre-line leading-relaxed text-stone-600">
          {event.description}
        </div>
      </div>
    </div>
  );
}
