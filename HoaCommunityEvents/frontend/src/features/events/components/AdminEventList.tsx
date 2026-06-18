import {
  Calendar,
  Edit,
  Eye,
  Info,
  MapPin,
  MoreHorizontal,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Badge } from "../../../components/design-system/ui/badge";
import { Button } from "../../../components/design-system/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/design-system/ui/dropdown-menu";
import type { HoaEvent, PagedResult } from "../../../types/event";

interface AdminEventListProps {
  feed: PagedResult<HoaEvent>;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAttendees: (id: string) => void;
  onPageChange: (page: number) => void;
  expandedEditEventId: string | null;
  expandedAttendeesEventId: string | null;
  renderExpandedEdit: (event: HoaEvent) => ReactNode;
  renderExpandedAttendees: (event: HoaEvent) => ReactNode;
}

export function AdminEventList({
  feed,
  onEdit,
  onCancel,
  onPublish,
  onUnpublish,
  onDelete,
  onViewAttendees,
  onPageChange,
  expandedEditEventId,
  expandedAttendeesEventId,
  renderExpandedEdit,
  renderExpandedAttendees,
}: AdminEventListProps) {
  const now = new Date();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  if (!feed.items.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-page shadow-sm">
      {!isDesktop && (
        <div className="divide-y divide-hairline">
          {feed.items.map((event) => {
            const startDate = new Date(event.startDate).toLocaleDateString();
            const isPending = event.status === "Pending";
            const isCancelled = event.status === "Cancelled";
            const isPublished = event.status === "Published";
            const endDateObj = new Date(event.endDate);
            const isEnded =
              event.status === "Ended" ||
              (isPublished && endDateObj.getTime() < now.getTime());
            const statusLabel = isCancelled
              ? "Cancelled"
              : isEnded
                ? "Ended"
                : isPending
                  ? "Pending"
                  : "Published";

            const rowTone = isCancelled
              ? "bg-danger-faded/65"
              : isEnded
                ? "bg-surface"
                : isPending
                  ? "bg-signal-faded/70"
                  : "bg-accent-faded/65";

            const badgeTone = isCancelled
              ? "danger"
              : isEnded
                ? "muted"
                : isPending
                  ? "signal"
                  : "accent";

            const isEditExpanded = expandedEditEventId === event.id;
            const isAttendeesExpanded = expandedAttendeesEventId === event.id;
            const showExpandedPanel = isEditExpanded || isAttendeesExpanded;

            return (
              <Fragment key={event.id}>
                <div className={`space-y-3 p-4 ${rowTone}`}>
                  <div className="space-y-1">
                    <p className="wrap-break-word text-base font-semibold text-ink-display">
                      {event.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="h-3 w-3" /> {startDate}
                      </span>
                      <span className="flex min-w-0 items-center gap-1 wrap-break-word">
                        <MapPin className="h-3 w-3" />
                        {event.locationWithinCommunity}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={badgeTone}>{statusLabel}</Badge>
                    <span className="inline-flex items-center gap-1 text-sm text-ink-body">
                      <Users className="h-4 w-4 text-ink-muted" />
                      {event.attendeeCount}
                      {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
                    </span>
                    {isEnded && (
                      <button
                        type="button"
                        className="inline-flex text-ink-muted"
                        title="Ended is applied automatically when a published event's end date has passed."
                        aria-label="Ended status is date-derived from a published event"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal text-left"
                      onClick={() => onEdit(event.id)}
                    >
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal text-left"
                      onClick={() => onViewAttendees(event.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" /> Attendees
                    </Button>
                    {isPending && !isEnded && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal text-left"
                        onClick={() => onPublish(event.id)}
                      >
                        Publish
                      </Button>
                    )}
                    {(isPublished || isEnded) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal border-signal/45 bg-signal-faded text-left text-signal-display hover:bg-signal-faded/85"
                        onClick={() => onUnpublish(event.id)}
                      >
                        Unpublish
                      </Button>
                    )}
                    {!isCancelled && !isEnded && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal border-signal/45 bg-signal-faded text-left text-signal-display hover:bg-signal-faded/85"
                        onClick={() => onCancel(event.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal text-left"
                      onClick={() => onDelete(event.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>

                {showExpandedPanel && (
                  <div className="bg-surface/80 p-4">
                    {isEditExpanded
                      ? renderExpandedEdit(event)
                      : renderExpandedAttendees(event)}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      {isDesktop && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-surface font-heading text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-4 text-right font-semibold tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {feed.items.map((event) => {
                const startDate = new Date(
                  event.startDate,
                ).toLocaleDateString();
                const isPending = event.status === "Pending";
                const isCancelled = event.status === "Cancelled";
                const isPublished = event.status === "Published";
                const endDateObj = new Date(event.endDate);
                const isEnded =
                  event.status === "Ended" ||
                  (isPublished && endDateObj.getTime() < now.getTime());
                const statusLabel = isCancelled
                  ? "Cancelled"
                  : isEnded
                    ? "Ended"
                    : isPending
                      ? "Pending"
                      : "Published";

                const rowTone = isCancelled
                  ? "bg-danger-faded/65 hover:bg-danger-faded"
                  : isEnded
                    ? "bg-surface hover:bg-surface/90"
                    : isPending
                      ? "bg-signal-faded/70 hover:bg-signal-faded"
                      : "bg-accent-faded/65 hover:bg-accent-faded";

                const badgeTone = isCancelled
                  ? "danger"
                  : isEnded
                    ? "muted"
                    : isPending
                      ? "signal"
                      : "accent";

                const isEditExpanded = expandedEditEventId === event.id;
                const isAttendeesExpanded =
                  expandedAttendeesEventId === event.id;
                const showExpandedPanel = isEditExpanded || isAttendeesExpanded;

                return (
                  <Fragment key={event.id}>
                    <tr className={`transition-colors ${rowTone}`}>
                      <td className="px-6 py-4">
                        <div className="mb-1 wrap-break-word font-semibold text-ink-display">
                          {event.title}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted sm:gap-3">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-3 w-3" /> {startDate}
                          </span>
                          <span className="flex min-w-0 items-center gap-1 wrap-break-word">
                            <MapPin className="h-3 w-3" />{" "}
                            {event.locationWithinCommunity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge tone={badgeTone}>{statusLabel}</Badge>
                          {isEnded && (
                            <button
                              type="button"
                              className="inline-flex text-ink-muted"
                              title="Ended is applied automatically when a published event's end date has passed."
                              aria-label="Ended status is date-derived from a published event"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-ink-body">
                          <Users className="h-4 w-4 text-ink-muted" />
                          <span>
                            {event.attendeeCount}{" "}
                            {event.maxAttendees
                              ? `/ ${event.maxAttendees}`
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-left sm:px-6 sm:text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-ink-muted hover:text-ink-display"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            side="bottom"
                            className="w-48"
                          >
                            <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(event.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onViewAttendees(event.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Attendees
                            </DropdownMenuItem>
                            {isPending && !isEnded && (
                              <DropdownMenuItem
                                onClick={() => onPublish(event.id)}
                                className="text-accent-display focus:text-accent-display"
                              >
                                Publish Event
                              </DropdownMenuItem>
                            )}
                            {(isPublished || isEnded) && (
                              <DropdownMenuItem
                                onClick={() => onUnpublish(event.id)}
                                className="text-signal-display focus:text-signal-display"
                              >
                                Unpublish Event
                              </DropdownMenuItem>
                            )}
                            {!isCancelled && !isEnded && (
                              <DropdownMenuItem
                                onClick={() => onCancel(event.id)}
                                className="text-signal-display focus:text-signal-display"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel
                                Event
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(event.id)}
                              destructive
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {showExpandedPanel && (
                      <tr className="bg-surface/80">
                        <td colSpan={4} className="px-4 py-4 sm:px-6">
                          {isEditExpanded
                            ? renderExpandedEdit(event)
                            : renderExpandedAttendees(event)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline bg-surface px-6 py-4 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {feed.items.length} of {feed.totalCount} results
        </span>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-none"
            aria-label="Go to previous page"
            disabled={feed.page <= 1}
            onClick={() => onPageChange(feed.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-none"
            aria-label="Go to next page"
            disabled={feed.page >= feed.totalPages}
            onClick={() => onPageChange(feed.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
