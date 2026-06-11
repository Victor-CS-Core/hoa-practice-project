import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import { useAttendees } from "../../hooks/useAttendance";
import {
  useCancelEvent,
  useCreateEvent,
  useDeleteEvent,
  useEditEvent,
  usePublishEvent,
  useUnpublishEvent,
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
      includePending: true,
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
  const publishMutation = usePublishEvent();
  const unpublishMutation = useUnpublishEvent();
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

    const hasStatus = Object.prototype.hasOwnProperty.call(next, "status");
    const hasCategory = Object.prototype.hasOwnProperty.call(next, "category");
    const hasPage = Object.prototype.hasOwnProperty.call(next, "page");

    const nextStatus = hasStatus ? next.status : filter.status;
    const nextCategory = hasCategory ? next.category : filter.category;
    const nextPage = hasPage ? (next.page ?? 1) : (filter.page ?? 1);

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

  const handlePublish = async (eventId: string) => {
    setActionError(null);

    try {
      await publishMutation.mutateAsync(eventId);
      setFlashMessage("Event published successfully.");
    } catch (error) {
      const next = toApiError(error);
      setActionError(next?.message ?? "Failed to publish event.");
    }
  };

  const handleUnpublish = async (eventId: string) => {
    setActionError(null);

    try {
      await unpublishMutation.mutateAsync(eventId);
      setFlashMessage("Event unpublished successfully.");
    } catch (error) {
      const next = toApiError(error);
      setActionError(next?.message ?? "Failed to unpublish event.");
    }
  };

  const isConfirmSubmitting =
    cancelMutation.isPending || deleteMutation.isPending;
  const isCreatingForm = createMutation.isPending;
  const isEditingForm = editMutation.isPending;

  const inFlightMessage =
    isCreatingForm || isEditingForm
      ? formState?.mode === "edit"
        ? "Saving event changes..."
        : "Creating event..."
      : cancelMutation.isPending
        ? "Cancelling event..."
        : publishMutation.isPending
          ? "Publishing event..."
          : unpublishMutation.isPending
            ? "Unpublishing event..."
            : deleteMutation.isPending
              ? "Deleting event..."
              : null;

  const isCreateOpen = formState?.mode === "create";
  const editingEvent = formState?.mode === "edit" ? formState.event : null;

  return (
    <section className="space-y-6">
      <div className="space-y-4">
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
            setFormState((prev) =>
              prev?.mode === "create" ? null : { mode: "create" },
            );
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {isCreateOpen ? "Hide Create Event Form" : "Create New Event"}
        </button>

        {isCreateOpen && (
          <AdminEventForm
            key="create"
            mode="create"
            isSubmitting={isCreatingForm}
            apiError={formError}
            onCancel={() => {
              setFormError(null);
              setFormState(null);
            }}
            onSubmit={handleCreate}
          />
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label
            htmlFor="admin-status-filter"
            className="text-sm text-stone-600"
          >
            Status
          </label>
          <select
            id="admin-status-filter"
            value={status}
            onChange={(event) =>
              updateFilter({ status: event.target.value || undefined, page: 1 })
            }
            className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Published">Published</option>
            <option value="Ended">Ended</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <label
            htmlFor="admin-category-filter"
            className="text-sm text-stone-600"
          >
            Category
          </label>
          <select
            id="admin-category-filter"
            value={category}
            onChange={(event) =>
              updateFilter({
                category: event.target.value || undefined,
                page: 1,
              })
            }
            className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 sm:w-auto"
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
              className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
            setSelectedAttendeesEventId(null);
            setFormState((prev) =>
              prev?.mode === "edit" && prev.event.id === eventId
                ? null
                : { mode: "edit", event: hit },
            );
          }}
          onCancel={(eventId) => setConfirmState({ action: "cancel", eventId })}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onDelete={(eventId) => setConfirmState({ action: "delete", eventId })}
          onViewAttendees={(eventId) => {
            setFormError(null);
            setFormState((prev) => (prev?.mode === "edit" ? null : prev));
            setSelectedAttendeesEventId((prev) =>
              prev === eventId ? null : eventId,
            );
          }}
          onPageChange={(nextPage) => updateFilter({ page: nextPage })}
          expandedEditEventId={editingEvent?.id ?? null}
          expandedAttendeesEventId={selectedAttendeesEventId}
          renderExpandedEdit={(event) => (
            <div className="animate-fade-up animate-delay-100">
              <AdminEventForm
                key={`edit-${event.id}`}
                mode="edit"
                initialValues={{
                  title: event.title,
                  description: event.description,
                  category: event.category,
                  locationWithinCommunity: event.locationWithinCommunity,
                  startDate: event.startDate,
                  endDate: event.endDate,
                  maxAttendees: event.maxAttendees ?? undefined,
                  imageUrl: event.imageUrl ?? undefined,
                }}
                isSubmitting={isEditingForm}
                apiError={formError}
                onCancel={() => {
                  setFormError(null);
                  setFormState(null);
                }}
                onSubmit={handleEdit}
              />
            </div>
          )}
          renderExpandedAttendees={(event) => (
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
                Viewing attendees for: {event.title}
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
