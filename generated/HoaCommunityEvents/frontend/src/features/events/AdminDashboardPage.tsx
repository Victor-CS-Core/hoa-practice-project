import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import { useAttendees } from "../../hooks/useAttendance";
import {
  useCancelEvent,
  useCreateEvent,
  useDeleteEvent,
  useEditEvent,
  useEvents,
} from "../../hooks/useEvents";
import { toApiError, type ApiErrorEnvelope } from "../auth/authApiError";
import type {
  CreateEventFormValues,
  EventFilter,
  HoaEvent,
} from "../../types/event";
import { AdminAttendeeList } from "./components/AdminAttendeeList";
import { AdminConfirmModal } from "./components/AdminConfirmModal";
import { AdminEventForm } from "./components/AdminEventForm";
import { AdminEventList } from "./components/AdminEventList";

type FormState = { mode: "create" } | { mode: "edit"; event: HoaEvent } | null;

type ConfirmState = { action: "cancel" | "delete"; eventId: string } | null;

export function AdminDashboardPage() {
  const { authStore } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formState, setFormState] = useState<FormState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [selectedAttendeesEventId, setSelectedAttendeesEventId] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<ApiErrorEnvelope | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const filter = useMemo(
    (): EventFilter => ({
      status: status || undefined,
      category: category || undefined,
      sortBy: "upcoming",
      page: safePage,
      pageSize: 10,
    }),
    [category, safePage, status],
  );

  const eventsQuery = useEvents(filter);
  const createMutation = useCreateEvent();
  const editMutation = useEditEvent();
  const cancelMutation = useCancelEvent();
  const deleteMutation = useDeleteEvent();

  const attendeesQuery = useAttendees(
    selectedAttendeesEventId ?? undefined,
    !!selectedAttendeesEventId,
  );
  const hasActiveFilters = !!status || !!category;

  if (!authStore.isAdmin) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-heading text-2xl font-bold text-amber-900">
          Admin Access Required
        </h2>
        <p className="mt-2 text-amber-800">
          This dashboard is available only to HOA administrators.
        </p>
        <p className="mt-4">
          <Link to="/events" className="text-amber-900 underline">
            Return to events
          </Link>
        </p>
      </section>
    );
  }

  const updateFilter = (next: Partial<EventFilter>) => {
    const params = new URLSearchParams(searchParams);

    const nextStatus = next.status ?? filter.status;
    const nextCategory = next.category ?? filter.category;
    const nextPage = next.page ?? filter.page ?? 1;

    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");

    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");

    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");

    setSearchParams(params);
  };

  const handleCreate = async (values: CreateEventFormValues) => {
    setFormError(null);
    setActionError(null);

    try {
      const created = await createMutation.mutateAsync(values);
      setFlashMessage(`Created event: ${created.title}`);
      setFormState(null);
    } catch (error) {
      const next = toApiError(error);
      setFormError(next ?? { message: "Failed to create event." });
    }
  };

  const handleEdit = async (values: CreateEventFormValues) => {
    if (!formState || formState.mode !== "edit") return;

    setFormError(null);
    setActionError(null);

    try {
      const updated = await editMutation.mutateAsync({
        id: formState.event.id,
        values,
      });
      setFlashMessage(`Updated event: ${updated.title}`);
      setFormState(null);
    } catch (error) {
      const next = toApiError(error);
      setFormError(next ?? { message: "Failed to update event." });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    setActionError(null);

    try {
      if (confirmState.action === "cancel") {
        await cancelMutation.mutateAsync(confirmState.eventId);
        setFlashMessage("Event cancelled successfully.");
      } else {
        await deleteMutation.mutateAsync(confirmState.eventId);
        setFlashMessage("Event deleted successfully.");
      }
      setConfirmState(null);
    } catch (error) {
      const next = toApiError(error);
      setActionError(
        next?.message ?? `Failed to ${confirmState.action} event.`,
      );
    }
  };

  const isConfirmSubmitting =
    cancelMutation.isPending || deleteMutation.isPending;
  const isSavingForm = createMutation.isPending || editMutation.isPending;

  const inFlightMessage = isSavingForm
    ? formState?.mode === "edit"
      ? "Saving event changes..."
      : "Creating event..."
    : cancelMutation.isPending
      ? "Cancelling event..."
      : deleteMutation.isPending
        ? "Deleting event..."
        : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-stone-900">
            Admin Management Dashboard
          </h1>
          <p className="mt-2 text-stone-600">
            Manage events, attendees, and publish updates for residents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setFormState({ mode: "create" });
          }}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create Event
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-stone-600">Status</label>
          <select
            value={status}
            onChange={(event) =>
              updateFilter({ status: event.target.value || undefined, page: 1 })
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Published">Published</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <label className="text-sm text-stone-600">Category</label>
          <select
            value={category}
            onChange={(event) =>
              updateFilter({
                category: event.target.value || undefined,
                page: 1,
              })
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            <option value="Board Meeting">Board Meeting</option>
            <option value="Community Cleanup">Community Cleanup</option>
            <option value="Pool Event">Pool Event</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                updateFilter({
                  status: undefined,
                  category: undefined,
                  page: 1,
                })
              }
              className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              Clear Filters
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <p className="mt-3 text-xs text-stone-500">
            Filters active
            {status ? ` • status: ${status}` : ""}
            {category ? ` • category: ${category}` : ""}
          </p>
        )}

        {eventsQuery.data && (
          <p className="mt-2 text-xs text-stone-500">
            Total results: {eventsQuery.data.totalCount} • Page{" "}
            {eventsQuery.data.page} of {eventsQuery.data.totalPages}
          </p>
        )}
      </div>

      {inFlightMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          {inFlightMessage}
        </div>
      )}

      {flashMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {eventsQuery.isLoading && (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          Loading events...
        </div>
      )}

      {eventsQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load admin events list.
        </div>
      )}

      {!eventsQuery.isLoading &&
        !eventsQuery.isError &&
        eventsQuery.data &&
        eventsQuery.data.items.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
            {status || category
              ? "No events match your filters."
              : "No events found."}
          </div>
        )}

      {eventsQuery.data && eventsQuery.data.items.length > 0 && (
        <AdminEventList
          feed={eventsQuery.data}
          onEdit={(eventId) => {
            const hit = eventsQuery.data?.items.find(
              (item) => item.id === eventId,
            );
            if (!hit) return;
            setFormError(null);
            setFormState({ mode: "edit", event: hit });
          }}
          onCancel={(eventId) => setConfirmState({ action: "cancel", eventId })}
          onDelete={(eventId) => setConfirmState({ action: "delete", eventId })}
          onViewAttendees={(eventId) => setSelectedAttendeesEventId(eventId)}
          onPageChange={(nextPage) => updateFilter({ page: nextPage })}
        />
      )}

      {selectedAttendeesEventId && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-semibold text-stone-900">
              Attendees Panel
            </h2>
            <button
              type="button"
              onClick={() => setSelectedAttendeesEventId(null)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
            >
              Close Panel
            </button>
          </div>
          <p className="mb-4 mt-1 text-sm text-stone-600">
            Viewing attendees for event ID: {selectedAttendeesEventId}
          </p>

          {attendeesQuery.isLoading && (
            <p className="text-stone-500">Loading attendees...</p>
          )}
          {attendeesQuery.isError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Failed to load attendees.
            </p>
          )}
          {attendeesQuery.data && (
            <AdminAttendeeList
              attendees={attendeesQuery.data}
              totalCount={attendeesQuery.data.length}
            />
          )}
        </div>
      )}

      {formState && (
        <AdminEventForm
          key={formState.mode === "edit" ? formState.event.id : "create"}
          mode={formState.mode}
          initialValues={
            formState.mode === "edit"
              ? {
                  title: formState.event.title,
                  description: formState.event.description,
                  category: formState.event.category,
                  locationWithinCommunity:
                    formState.event.locationWithinCommunity,
                  startDate: formState.event.startDate,
                  endDate: formState.event.endDate,
                  maxAttendees: formState.event.maxAttendees ?? undefined,
                  imageUrl: formState.event.imageUrl ?? undefined,
                }
              : undefined
          }
          isSubmitting={isSavingForm}
          apiError={formError}
          onCancel={() => {
            setFormError(null);
            setFormState(null);
          }}
          onSubmit={formState.mode === "create" ? handleCreate : handleEdit}
        />
      )}

      {confirmState && (
        <AdminConfirmModal
          action={confirmState.action}
          isSubmitting={isConfirmSubmitting}
          onDismiss={() => setConfirmState(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </section>
  );
}
