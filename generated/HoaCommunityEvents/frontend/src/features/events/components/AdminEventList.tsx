import {
  Calendar,
  Edit,
  Eye,
  MapPin,
  MoreHorizontal,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { HoaEvent, PagedResult } from "../../../types/event";

interface AdminEventListProps {
  feed: PagedResult<HoaEvent>;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAttendees: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function AdminEventList({
  feed,
  onEdit,
  onCancel,
  onDelete,
  onViewAttendees,
  onPageChange,
}: AdminEventListProps) {
  if (!feed.items.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 font-heading text-xs uppercase text-stone-500">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">
                Event Details
              </th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
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
              const startDate = new Date(event.startDate).toLocaleDateString();
              const isCancelled = event.status === "Cancelled";

              return (
                <tr
                  key={event.id}
                  className={`transition-colors hover:bg-stone-50 ${isCancelled ? "opacity-70" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="mb-1 font-semibold text-stone-900">
                      {event.title}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {startDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{" "}
                        {event.locationWithinCommunity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-stone-600">
                      <Users className="h-4 w-4 text-stone-400" />
                      <span>
                        {event.attendeeCount}{" "}
                        {event.maxAttendees ? `/ ${event.maxAttendees}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-500 hover:text-stone-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
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
                        {!isCancelled && (
                          <DropdownMenuItem
                            onClick={() => onCancel(event.id)}
                            className="text-amber-600 focus:text-amber-700"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Event
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
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-4 text-sm text-stone-500">
        <span>
          Showing {feed.items.length} of {feed.totalCount} results
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={feed.page <= 1}
            onClick={() => onPageChange(feed.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
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
