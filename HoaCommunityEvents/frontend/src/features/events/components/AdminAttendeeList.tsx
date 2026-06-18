import { Clock, User } from "lucide-react";
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
    <article className="mt-8 overflow-hidden rounded-xl border border-signal/45 bg-page shadow-md">
      <div className="flex flex-row items-center justify-between border-b border-signal/35 bg-signal-faded px-6 pb-4 pt-6">
        <h3 className="font-heading text-lg font-semibold text-signal-display">
          Admin: Attendee Roster
        </h3>
        <span className="rounded-full border border-signal/45 bg-signal px-2.5 py-1 text-xs font-bold text-signal-display">
          {totalCount} Total
        </span>
      </div>

      <div className="p-0">
        {attendees.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">
            No attendees have joined this event yet.
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
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
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-surface"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
                    {attendee.profileImageUrl ? (
                      <img
                        src={attendee.profileImageUrl}
                        alt={attendee.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-ink-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-display">
                      {attendee.displayName}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      @{attendee.userId}
                    </p>
                  </div>

                  <div className="hidden flex-col items-end text-xs text-ink-muted sm:flex">
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
      </div>
    </article>
  );
}
