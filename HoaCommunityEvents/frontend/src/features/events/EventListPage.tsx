import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../hooks/useEvents";
import { useStore } from "../../app/stores/store";
import { EventCard } from "./components/EventCard";
import { EventsFilterBar } from "./components/EventsFilterBar";
import { EventsPagination } from "./components/EventsPagination";
import { useJoinEvent, useLeaveEvent } from "../../hooks/useAttendance";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import type { EventFilter } from "../../types/event";
import { useState } from "react";

export function EventListPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionError, setActionError] = useState<string | null>(null);

  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();

  const filter = useMemo(
    (): EventFilter => ({
      category: category || undefined,
      status: status || undefined,
      sortBy: "upcoming",
      page: safePage,
      pageSize: 9,
    }),
    [category, safePage, status],
  );

  const { data, isLoading, isError } = useEvents(filter);

  const role =
    authStore.user?.role === "hoa_admin"
      ? "hoa_admin"
      : authStore.user?.role === "resident"
        ? "resident"
        : "guest";

  const updateFilter = (nextFilter: EventFilter) => {
    const next = new URLSearchParams();

    if (nextFilter.category) next.set("category", nextFilter.category);
    if (nextFilter.status) next.set("status", nextFilter.status);

    const nextPage =
      nextFilter.page && nextFilter.page > 0 ? nextFilter.page : 1;
    if (nextPage > 1) next.set("page", String(nextPage));

    setSearchParams(next);
  };

  const handleJoinLeave = async (eventId: string, joining: boolean) => {
    setActionError(null);

    try {
      if (joining) {
        await joinMutation.mutateAsync(eventId);
      } else {
        await leaveMutation.mutateAsync(eventId);
      }
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          joining ? "Failed to join event." : "Failed to leave event.",
        ),
      );
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-stone-900">
            Community Events
          </h1>
          <p className="mt-2 text-stone-600">
            Find upcoming events and manage your attendance.
          </p>
        </div>
      </div>

      {authStore.isAdmin && (
        <div>
          <Link
            to="/events/create"
            className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Create New Event
          </Link>
        </div>
      )}

      <EventsFilterBar filter={filter} onFilterChange={updateFilter} />

      {isLoading && (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          Loading events...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load events. Please refresh and try again.
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {actionError}
        </div>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          {category || status
            ? "No events match your current filters."
            : "No events are available yet."}
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              role={role}
              onViewDetails={(eventId) => navigate(`/events/${eventId}`)}
              onJoinLeave={handleJoinLeave}
            />
          ))}
        </div>
      )}

      {data && (
        <EventsPagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          totalPages={data.totalPages}
          onPageChange={(nextPage) =>
            updateFilter({ ...filter, page: nextPage })
          }
        />
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <strong className="text-stone-800">Current role:</strong> {role}
      </div>
    </section>
  );
}
