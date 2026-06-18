import { Calendar, CheckCircle2, MapPin, User, Users } from "lucide-react";
import { useState } from "react";
import { FramedImage } from "../../../components/media/FramedImage";
import { Badge } from "../../../components/design-system/ui/badge";
import { Button } from "../../../components/design-system/ui/button";
import type { HoaEvent } from "../../../types/event";
import { BRAND } from "../../../app/branding";

type UserRole = "guest" | "resident" | "hoa_admin";

interface EventCardProps {
  event: HoaEvent;
  role: UserRole;
  onJoinLeave?: (eventId: string, joining: boolean) => void;
  onViewDetails?: (eventId: string) => void;
}

export function EventCard({
  event,
  role,
  onJoinLeave,
  onViewDetails,
}: EventCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const isCancelled = event.status === "Cancelled";
  const startDateObj = new Date(event.startDate);
  const endDateObj = new Date(event.endDate);
  const now = new Date();
  const isEnded = !isCancelled && endDateObj.getTime() < now.getTime();
  const statusLabel = isCancelled
    ? "Cancelled"
    : isEnded
      ? "Ended"
      : "Published";

  const cardTone = isCancelled
    ? "border-danger/45 bg-danger-faded/60"
    : isEnded
      ? "border-hairline bg-surface"
      : "border-accent/35 bg-accent-faded/55";

  const formattedDate = startDateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startDateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article
      className={`animate-zoom-in flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${cardTone}`}
    >
      {event.imageUrl && failedImageUrl !== event.imageUrl && (
        <div className="h-40 w-full overflow-hidden border-b border-hairline">
          <FramedImage
            src={event.imageUrl}
            alt={`${event.title} banner`}
            positionX={event.imagePositionX}
            positionY={event.imagePositionY}
            zoom={event.imageZoom}
            imageClassName={
              isCancelled || isEnded ? "grayscale-82 brightness-70" : ""
            }
            onError={() => setFailedImageUrl(event.imageUrl ?? null)}
          />
        </div>
      )}
      <div className="border-b border-hairline px-6 pb-3 pt-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <Badge tone="neutral" className="rounded-full font-medium">
            {event.category}
          </Badge>
          <Badge
            tone={isEnded ? "muted" : "accent"}
            className={`rounded-full font-medium ${isCancelled ? "bg-danger-faded text-danger-display" : ""}`}
          >
            {statusLabel}
          </Badge>
        </div>
        <h3 className="font-heading text-xl font-semibold leading-tight text-ink-display">
          {event.title}
        </h3>
      </div>

      <div className="flex grow flex-col gap-3 px-6 pb-4 pt-4">
        <p className="mb-2 text-sm text-ink-body">{event.description}</p>

        <div className="mt-auto flex flex-col gap-2 text-sm text-ink-body">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="truncate">
              {formattedDate} • {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="truncate">{event.locationWithinCommunity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="truncate">
              {event.attendeeCount}{" "}
              {event.maxAttendees ? `/ ${event.maxAttendees}` : ""} Attendees
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="truncate">Hosted by {event.hostDisplayName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-hairline px-5 pb-5 pt-4 sm:flex-row">
        <Button
          variant="secondary"
          className="w-full sm:flex-1"
          onClick={() => onViewDetails?.(event.id)}
        >
          View Details
        </Button>

        {role !== "guest" &&
          !isCancelled &&
          !isEnded &&
          role !== "hoa_admin" && (
            <Button
              variant={event.isCurrentUserAttending ? "soft" : "primary"}
              className={`w-full sm:flex-1 ${
                event.isCurrentUserAttending ? "border border-accent/35" : ""
              }`}
              onClick={() =>
                onJoinLeave?.(event.id, !event.isCurrentUserAttending)
              }
            >
              {event.isCurrentUserAttending ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Joined
                </>
              ) : (
                "Join Event"
              )}
            </Button>
          )}
      </div>

      {role === "hoa_admin" && (
        <div className="border-t border-signal/45 bg-signal-faded py-1 text-center text-xs font-medium text-signal-display">
          Managed by {BRAND.communityLabel}
        </div>
      )}
    </article>
  );
}
