import { AlertCircle, CheckCircle2, LogOut, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
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
    <Card className="sticky top-8 overflow-hidden border-stone-200 bg-white shadow-lg">
      <CardHeader className="border-b border-stone-100 bg-stone-50 pb-4">
        <h3 className="font-heading text-lg font-semibold text-stone-900">
          Attendance
        </h3>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-2 flex flex-col items-center justify-center py-4">
          {event.isCurrentUserAttending ? (
            <div className="flex flex-col items-center text-emerald-600">
              <CheckCircle2 className="mb-2 h-12 w-12" />
              <span className="font-heading text-xl font-bold">
                You&apos;re going!
              </span>
            </div>
          ) : isCancelled ? (
            <div className="flex flex-col items-center text-stone-400">
              <span className="mb-1 font-heading text-xl font-bold text-stone-600">
                Cancelled
              </span>
              <span className="text-sm">This event will not take place.</span>
            </div>
          ) : isGuest ? (
            <div className="flex flex-col items-center text-center text-stone-500">
              <span className="mb-1 font-medium text-stone-700">
                Want to join?
              </span>
              <span className="text-sm">
                Please log in to RSVP to this event.
              </span>
            </div>
          ) : isFull ? (
            <div className="flex flex-col items-center text-center text-amber-600">
              <span className="mb-1 font-heading text-xl font-bold">
                Event is Full
              </span>
              <span className="text-sm">Capacity has been reached.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-stone-600">
              <span className="font-heading text-lg font-medium">
                You haven&apos;t RSVP&apos;d yet
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">{errorMsg}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pb-6 pt-0">
        {canJoin && (
          <Button className="w-full py-6 text-lg" onClick={onJoin}>
            <UserPlus className="mr-2 h-5 w-5" />
            Join Event
          </Button>
        )}

        {canLeave && (
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={onLeave}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave Event
          </Button>
        )}

        {isGuest && (
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Log in to RSVP
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
