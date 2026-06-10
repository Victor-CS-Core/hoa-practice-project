import { Calendar, CheckCircle2, MapPin, User, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import { useTheme } from "../../../app/theme/theme-context";
import type { HoaEvent } from "../../../types/event";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isCancelled = event.status === "Cancelled";
  const startDateObj = new Date(event.startDate);
  const endDateObj = new Date(event.endDate);
  const now = new Date();
  const isEnded = !isCancelled && endDateObj.getTime() < now.getTime();
  const statusLabel = isCancelled ? "Cancelled" : isEnded ? "Ended" : "Published";

  const cardTone = isCancelled
    ? isDark
      ? "!border-red-700/60 !bg-red-950/35"
      : "!border-red-300 !bg-red-100/80"
    : isEnded
      ? isDark
        ? "!border-slate-600/70 !bg-slate-900/55"
        : "!border-slate-300 !bg-slate-200/70"
      : isDark
        ? "!border-emerald-700/55 !bg-emerald-950/25"
        : "!border-emerald-300 !bg-emerald-100/65";

  const statusTone = isCancelled
    ? isDark
      ? "!bg-red-900/70 !text-red-100"
      : "!bg-red-200 !text-red-800"
    : isEnded
      ? isDark
        ? "!bg-slate-700/80 !text-slate-100"
        : "!bg-slate-300 !text-slate-800"
      : isDark
        ? "!bg-emerald-900/70 !text-emerald-100"
        : "!bg-emerald-200 !text-emerald-800";

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
    <Card
      className={`flex h-full flex-col overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${cardTone}`}
    >
      <CardHeader className="border-b border-stone-100 pb-3">
        <div className="mb-2 flex items-start justify-between gap-4">
          <Badge
            variant="outline"
            className="rounded-full border-stone-200 bg-stone-100 font-medium text-stone-600"
          >
            {event.category}
          </Badge>
          <Badge
            variant="secondary"
            className={`rounded-full font-medium ${statusTone}`}
          >
            {statusLabel}
          </Badge>
        </div>
        <h3 className="font-heading text-xl font-semibold leading-tight text-stone-900">
          {event.title}
        </h3>
      </CardHeader>

      <CardContent className="flex grow flex-col gap-3 pb-4 pt-4">
        <p className="mb-2 text-sm text-stone-600">{event.description}</p>

        <div className="mt-auto flex flex-col gap-2 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">
              {formattedDate} • {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">{event.locationWithinCommunity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">
              {event.attendeeCount}{" "}
              {event.maxAttendees ? `/ ${event.maxAttendees}` : ""} Attendees
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">Hosted by {event.hostDisplayName}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-4 flex flex-col gap-3 border-t border-stone-100 px-5 pb-5 pt-4 sm:flex-row">
        <Button
          variant="outline"
          className="w-full border-stone-300 text-stone-700 hover:bg-stone-50 sm:flex-1"
          onClick={() => onViewDetails?.(event.id)}
        >
          View Details
        </Button>

        {role !== "guest" && !isCancelled && !isEnded && role !== "hoa_admin" && (
          <Button
            variant={event.isCurrentUserAttending ? "secondary" : "default"}
            className={`w-full sm:flex-1 ${
              event.isCurrentUserAttending
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
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
      </CardFooter>

      {role === "hoa_admin" && (
        <div className="border-t border-amber-200 bg-amber-100 py-1 text-center text-xs font-medium text-amber-800">
          Managed by HOA
        </div>
      )}
    </Card>
  );
}
