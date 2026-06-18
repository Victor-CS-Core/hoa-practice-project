import { AlertCircle, CheckCircle2, LogOut, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/design-system/ui/button";
import type { HoaEvent } from "../../../types/event";

interface AttendanceActionCardProps {
  event: HoaEvent;
  canJoin: boolean;
  canLeave: boolean;
  isGuest: boolean;
  errorMsg?: string | null;
  onJoin: () => void;
  onLeave: () => void;
}

export function AttendanceActionCard({
  event,
  canJoin,
  canLeave,
  isGuest,
  errorMsg,
  onJoin,
  onLeave,
}: AttendanceActionCardProps) {
  const isCancelled = event.status === "Cancelled";
  const isFull =
    !!event.maxAttendees && event.attendeeCount >= event.maxAttendees;

  return (
    <article className="sticky top-8 overflow-hidden rounded-xl border border-hairline bg-page shadow-lg">
      <div className="border-b border-hairline bg-surface px-6 pb-4 pt-6">
        <h3 className="font-heading text-lg font-semibold text-ink-display">
          Attendance
        </h3>
      </div>

      <div className="px-6 pt-6">
        <div className="mb-2 flex flex-col items-center justify-center py-4">
          {event.isCurrentUserAttending ? (
            <div className="flex flex-col items-center text-accent-display">
              <CheckCircle2 className="mb-2 h-12 w-12" />
              <span className="font-heading text-xl font-bold">
                You&apos;re going!
              </span>
            </div>
          ) : isCancelled ? (
            <div className="flex flex-col items-center text-ink-muted">
              <span className="mb-1 font-heading text-xl font-bold text-ink-body">
                Cancelled
              </span>
              <span className="text-sm">This event will not take place.</span>
            </div>
          ) : isGuest ? (
            <div className="flex flex-col items-center text-center text-ink-muted">
              <span className="mb-1 font-medium text-ink-body">
                Want to join?
              </span>
              <span className="text-sm">
                Please log in to RSVP to this event.
              </span>
            </div>
          ) : isFull ? (
            <div className="flex flex-col items-center text-center text-signal-display">
              <span className="mb-1 font-heading text-xl font-bold">
                Event is Full
              </span>
              <span className="text-sm">Capacity has been reached.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-ink-body">
              <span className="font-heading text-lg font-medium">
                You haven&apos;t RSVP&apos;d yet
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger bg-danger-faded p-3 text-sm text-danger-display">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">{errorMsg}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
        {canJoin && (
          <Button
            variant="primary"
            className="w-full py-6 text-lg"
            onClick={onJoin}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Join Event
          </Button>
        )}

        {canLeave && (
          <Button variant="danger" className="w-full" onClick={onLeave}>
            <LogOut className="mr-2 h-4 w-4" />
            Leave Event
          </Button>
        )}

        {isGuest && (
          <Button asChild variant="secondary" className="w-full">
            <Link to="/login">Log in to RSVP</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
