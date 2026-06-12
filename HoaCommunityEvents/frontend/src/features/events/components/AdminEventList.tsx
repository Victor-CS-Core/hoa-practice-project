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
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Tooltip } from "../../../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { useTheme } from "../../../app/theme/theme-context";
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {!isDesktop && (
        <div className="divide-y divide-stone-100">
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
              ? isDark
                ? "bg-red-950/25"
                : "bg-red-100/70"
              : isEnded
                ? isDark
                  ? "bg-slate-900/45"
                  : "bg-slate-200/70"
                : isPending
                  ? isDark
                    ? "bg-amber-950/25"
                    : "bg-amber-100/65"
                  : isDark
                    ? "bg-emerald-950/20"
                    : "bg-emerald-100/60";

            const badgeTone = isCancelled
              ? isDark
                ? "!bg-red-900/70 !text-red-100"
                : "!bg-red-200 !text-red-800"
              : isEnded
                ? isDark
                  ? "!bg-slate-700/80 !text-slate-100"
                  : "!bg-slate-300 !text-slate-800"
                : isPending
                  ? isDark
                    ? "!bg-amber-900/70 !text-amber-100"
                    : "!bg-amber-200 !text-amber-800"
                  : isDark
                    ? "!bg-emerald-900/70 !text-emerald-100"
                    : "!bg-emerald-200 !text-emerald-800";

            const isEditExpanded = expandedEditEventId === event.id;
            const isAttendeesExpanded = expandedAttendeesEventId === event.id;
            const showExpandedPanel = isEditExpanded || isAttendeesExpanded;

            return (
              <Fragment key={event.id}>
                <div className={`space-y-3 p-4 ${rowTone}`}>
                  <div className="space-y-1">
                    <p className="wrap-break-word text-base font-semibold text-stone-900">
                      {event.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
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
                    <Badge variant="secondary" className={badgeTone}>
                      {statusLabel}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-sm text-stone-600">
                      <Users className="h-4 w-4 text-stone-400" />
                      {event.attendeeCount}
                      {event.maxAttendees ? ` / ${event.maxAttendees}` : ""}
                    </span>
                    {isEnded && (
                      <Tooltip content="Ended is applied automatically when a published event's end date has passed.">
                        <button
                          type="button"
                          className="inline-flex text-slate-500"
                          aria-label="Ended status is date-derived from a published event"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal text-left"
                      onClick={() => onEdit(event.id)}
                    >
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal text-left"
                      onClick={() => onViewAttendees(event.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" /> Attendees
                    </Button>
                    {isPending && !isEnded && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal border-emerald-300 text-left text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onPublish(event.id)}
                      >
                        Publish
                      </Button>
                    )}
                    {(isPublished || isEnded) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal border-amber-300 text-left text-amber-700 hover:bg-amber-50"
                        onClick={() => onUnpublish(event.id)}
                      >
                        Unpublish
                      </Button>
                    )}
                    {!isCancelled && !isEnded && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 w-full justify-start whitespace-normal border-amber-300 text-left text-amber-700 hover:bg-amber-50"
                        onClick={() => onCancel(event.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full justify-start whitespace-normal border-red-300 text-left text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(event.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>

                {showExpandedPanel && (
                  <div
                    className={
                      isDark ? "bg-stone-900/45 p-4" : "bg-stone-50/70 p-4"
                    }
                  >
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
            <thead className="border-b border-stone-200 bg-stone-50 font-heading text-xs uppercase text-stone-500">
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
            <tbody className="divide-y divide-stone-100">
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
                  ? isDark
                    ? "bg-red-950/25 hover:bg-red-900/30"
                    : "bg-red-100/70 hover:bg-red-200/60"
                  : isEnded
                    ? isDark
                      ? "bg-slate-900/45 hover:bg-slate-800/60"
                      : "bg-slate-200/70 hover:bg-slate-300/60"
                    : isPending
                      ? isDark
                        ? "bg-amber-950/25 hover:bg-amber-900/30"
                        : "bg-amber-100/65 hover:bg-amber-200/60"
                      : isDark
                        ? "bg-emerald-950/20 hover:bg-emerald-900/25"
                        : "bg-emerald-100/60 hover:bg-emerald-200/55";

                const badgeTone = isCancelled
                  ? isDark
                    ? "!bg-red-900/70 !text-red-100"
                    : "!bg-red-200 !text-red-800"
                  : isEnded
                    ? isDark
                      ? "!bg-slate-700/80 !text-slate-100"
                      : "!bg-slate-300 !text-slate-800"
                    : isPending
                      ? isDark
                        ? "!bg-amber-900/70 !text-amber-100"
                        : "!bg-amber-200 !text-amber-800"
                      : isDark
                        ? "!bg-emerald-900/70 !text-emerald-100"
                        : "!bg-emerald-200 !text-emerald-800";

                const isEditExpanded = expandedEditEventId === event.id;
                const isAttendeesExpanded =
                  expandedAttendeesEventId === event.id;
                const showExpandedPanel = isEditExpanded || isAttendeesExpanded;

                return (
                  <Fragment key={event.id}>
                    <tr className={`transition-colors ${rowTone}`}>
                      <td className="px-6 py-4">
                        <div className="mb-1 wrap-break-word font-semibold text-stone-900">
                          {event.title}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500 sm:gap-3">
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
                          <Badge variant="secondary" className={badgeTone}>
                            {statusLabel}
                          </Badge>
                          {isEnded && (
                            <Tooltip content="Ended is applied automatically when a published event's end date has passed.">
                              <button
                                type="button"
                                className="inline-flex text-slate-500"
                                aria-label="Ended status is date-derived from a published event"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Users className="h-4 w-4 text-stone-400" />
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
                              className="text-stone-500 hover:text-stone-900"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            side="auto"
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
                                className="text-emerald-700 focus:text-emerald-800"
                              >
                                Publish Event
                              </DropdownMenuItem>
                            )}
                            {(isPublished || isEnded) && (
                              <DropdownMenuItem
                                onClick={() => onUnpublish(event.id)}
                                className="text-amber-700 focus:text-amber-800"
                              >
                                Unpublish Event
                              </DropdownMenuItem>
                            )}
                            {!isCancelled && !isEnded && (
                              <DropdownMenuItem
                                onClick={() => onCancel(event.id)}
                                className="text-amber-600 focus:text-amber-700"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel
                                Event
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(event.id)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {showExpandedPanel && (
                      <tr
                        className={
                          isDark ? "bg-stone-900/45" : "bg-stone-50/70"
                        }
                      >
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

      <div className="flex flex-col gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {feed.items.length} of {feed.totalCount} results
        </span>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            aria-label="Go to previous page"
            disabled={feed.page <= 1}
            onClick={() => onPageChange(feed.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
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
