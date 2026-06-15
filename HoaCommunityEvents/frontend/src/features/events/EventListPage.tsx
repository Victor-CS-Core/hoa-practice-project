import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEvent, useEvents } from "../../hooks/useEvents";
import { useStore } from "../../app/stores/store";
import { useTheme } from "../../app/theme/theme-context";
import { EventCard } from "./components/EventCard";
import { LoadingState } from "../../components/ui/loading-state";
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
    <section
      className={`space-y-6 rounded-3xl p-4 sm:p-5 ${
        isDark
          ? "bg-[linear-gradient(155deg,rgba(16,28,42,0.72),rgba(14,24,36,0.72))]"
          : "bg-[linear-gradient(155deg,rgba(255,249,238,0.88),rgba(243,251,246,0.88))]"
      }`}
    >
      <div>
        <BackNavigationButton to="/" label="Back to home" />
      </div>

      <div
        className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 ${isDark ? "border-[#28405b] bg-[#101a2a]" : "border-[#e2c8a9] bg-[#fffaf1]"}`}
      >
        <div>
          <p
            className={`font-auth-ui text-xs font-semibold tracking-[0.2em] uppercase ${isDark ? "text-[#93d9bc]" : "text-[#9b5d1f]"}`}
          >
            Community Calendar
          </p>
          <h1 className="font-heading text-3xl font-bold text-(--text-primary)">
            {BRAND.appName}
          </h1>
          <p className="mt-2 text-(--text-muted)">
            Find upcoming events and manage your attendance.
          </p>
        </div>
      </div>

      {authStore.isAdmin && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setCreateOpen((prev) => !prev);
              setCreateError(null);
              setCreateSuccessMessage(null);
            }}
            className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {createOpen ? "Hide Create Event Form" : "Create New Event"}
          </button>

          {createSuccessMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
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
        <div
          className={`rounded-xl border p-4 ${isDark ? "border-[#8b3a37] bg-[#311615] text-[#ffcbc8]" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          Failed to load events. Please refresh and try again.
        </div>
      )}

      {actionError && (
        <div
          className={`rounded-xl border p-4 ${isDark ? "border-[#8b3a37] bg-[#311615] text-[#ffcbc8]" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {actionError}
        </div>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-8 text-center text-(--text-muted)">
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
