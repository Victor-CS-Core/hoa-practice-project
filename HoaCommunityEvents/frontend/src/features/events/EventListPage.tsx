import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEvent, useEvents } from "../../hooks/useEvents";
import { useStore } from "../../app/stores/store";
import { Button } from "../../components/design-system/ui/button";
import { EventCard } from "./components/EventCard";
import { LoadingState } from "../../components/design-system/ui/loading-state";
import { EventsFilterBar } from "./components/EventsFilterBar";
import { EventsPagination } from "./components/EventsPagination";
import { AdminEventForm } from "./components/AdminEventForm";
import { useJoinEvent, useLeaveEvent } from "../../hooks/useAttendance";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import { toApiError, type ApiErrorEnvelope } from "../auth/authApiError";
import type { CreateEventFormValues, EventFilter } from "../../types/event";
import { useState } from "react";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import { BRAND } from "../../app/branding";

export function EventListPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<ApiErrorEnvelope | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<
    string | null
  >(null);

  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const createMutation = useCreateEvent();

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

  const handleCreateSubmit = async (values: CreateEventFormValues) => {
    setCreateError(null);
    setCreateSuccessMessage(null);

    try {
      const created = await createMutation.mutateAsync(values);
      setCreateSuccessMessage(`Event created successfully: ${created.title}`);
      setCreateOpen(false);
    } catch (error) {
      const next = toApiError(error);
      setCreateError(next ?? { message: "Failed to create event." });
    }
  };

  return (
    <section className="space-y-6 rounded-3xl bg-surface/70 p-4 sm:p-5">
      <div>
        <BackNavigationButton to="/" label="Back to home" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-hairline bg-page p-5">
        <div>
          <p className="font-auth-ui text-xs font-semibold tracking-[0.2em] text-signal-display uppercase">
            Community Calendar
          </p>
          <h1 className="font-heading text-3xl font-bold text-ink-display">
            {BRAND.appName}
          </h1>
          <p className="mt-2 text-ink-muted">
            Find upcoming events and manage your attendance.
          </p>
        </div>
      </div>

      {authStore.isAdmin && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setCreateOpen((prev) => !prev);
              setCreateError(null);
              setCreateSuccessMessage(null);
            }}
            className="min-h-11"
          >
            {createOpen ? "Hide Create Event Form" : "Create New Event"}
          </Button>

          {createSuccessMessage && (
            <div className="rounded-xl border border-accent/45 bg-accent-faded p-4 text-accent-display">
              {createSuccessMessage}
            </div>
          )}

          {createOpen && (
            <div className="animate-fade-up animate-delay-100">
              <AdminEventForm
                mode="create"
                isSubmitting={createMutation.isPending}
                apiError={createError}
                onCancel={() => {
                  setCreateOpen(false);
                  setCreateError(null);
                }}
                onSubmit={handleCreateSubmit}
              />
            </div>
          )}
        </div>
      )}

      <EventsFilterBar filter={filter} onFilterChange={updateFilter} />

      {isLoading && <LoadingState label="Loading events..." />}

      {isError && (
        <div className="rounded-xl border border-danger bg-danger-faded p-4 text-danger-display">
          Failed to load events. Please refresh and try again.
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-danger bg-danger-faded p-4 text-danger-display">
          {actionError}
        </div>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="rounded-xl border border-hairline bg-page p-8 text-center text-ink-muted">
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
    </section>
  );
}
