import { Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import type { Attendee } from "../../../types/attendee";

interface AdminAttendeeListProps {
  attendees: Attendee[];
  totalCount: number;
}

export function AdminAttendeeList({
  attendees,
  totalCount,
}: AdminAttendeeListProps) {
  return (
    <Card className="mt-8 border-amber-200 bg-white shadow-md">
      <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-amber-50 pb-4">
        <h3 className="font-heading text-lg font-semibold text-amber-900">
          Admin: Attendee Roster
        </h3>
        <span className="rounded-full border border-amber-300 bg-amber-300 px-2.5 py-1 text-xs font-bold text-amber-950">
          {totalCount} Total
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {attendees.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            No attendees have joined this event yet.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {attendees.map((attendee) => {
              const joinedDate = attendee.joinedAt
                ? new Date(attendee.joinedAt)
                : null;
              const joinedStr = joinedDate
                ? `${joinedDate.toLocaleDateString()} at ${joinedDate.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}`
                : "Unknown";

              return (
                <li
                  key={`${attendee.userId}-${attendee.joinedAt}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-stone-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200">
                    {attendee.profileImageUrl ? (
                      <img
                        src={attendee.profileImageUrl}
                        alt={attendee.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-stone-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">
                      {attendee.displayName}
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      @{attendee.userId}
                    </p>
                  </div>

                  <div className="hidden flex-col items-end text-xs text-stone-400 sm:flex">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> RSVP
                    </div>
                    <span>{joinedStr}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
