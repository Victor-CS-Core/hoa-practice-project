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
import { Button } from "../../components/design-system/ui/button";
import { LoadingState } from "../../components/design-system/ui/loading-state";
import { Select } from "../../components/design-system/ui/select";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import {
  ADMIN_EVENT_STATUS_FILTER_OPTIONS,
  EVENT_CATEGORY_FILTER_OPTIONS,
} from "./eventFilterOptions";

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
      <section className="rounded-xl border border-signal/45 bg-signal-faded p-6">
        <h2 className="font-heading text-2xl font-bold text-signal-display">
          Admin Access Required
        </h2>
        <p className="mt-2 text-signal-display">
          This dashboard is available only to community administrators.
        </p>
        <p className="mt-4">
          <Link to="/events" className="text-signal-display underline">
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
    <section className="min-w-0 space-y-6 rounded-3xl bg-surface/70 p-4 sm:p-5">
      <div>
        <BackNavigationButton to="/events" label="Back to events" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold leading-tight text-ink-display sm:text-3xl">
              Admin Management Dashboard
            </h1>
            <p className="mt-2 text-ink-body">
              Manage events, attendees, and publish updates for residents.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setFormError(null);
              setFormState((prev) =>
                prev?.mode === "create" ? null : { mode: "create" },
              );
            }}
            className="min-h-11 w-full shrink-0 sm:w-auto"
          >
            {isCreateOpen ? "Hide Create Event Form" : "Create New Event"}
          </Button>
        </div>

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

      <div className="rounded-xl border border-hairline bg-page p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-1">
            <label
              htmlFor="admin-status-filter"
              className="text-sm text-ink-body"
            >
              Status
            </label>
            <Select
              id="admin-status-filter"
              value={status}
              onChange={(event) =>
                updateFilter({
                  status: event.target.value || undefined,
                  page: 1,
                })
              }
              className="min-h-11 text-sm"
            >
              <option value="">All statuses</option>
              {ADMIN_EVENT_STATUS_FILTER_OPTIONS.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="admin-category-filter"
              className="text-sm text-ink-body"
            >
              Category
            </label>
            <Select
              id="admin-category-filter"
              value={category}
              onChange={(event) =>
                updateFilter({
                  category: event.target.value || undefined,
                  page: 1,
                })
              }
              className="min-h-11 text-sm"
            >
              <option value="">All categories</option>
              {EVENT_CATEGORY_FILTER_OPTIONS.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                updateFilter({
                  status: undefined,
                  category: undefined,
                  page: 1,
                })
              }
              className="min-h-11 w-full md:w-auto"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <p className="mt-3 text-xs text-ink-muted">
            Filters active
            {status ? ` • status: ${status}` : ""}
            {category ? ` • category: ${category}` : ""}
          </p>
        )}

        {eventsQuery.data && (
          <p className="mt-2 text-xs text-ink-muted">
            Total results: {eventsQuery.data.totalCount} • Page{" "}
            {eventsQuery.data.page} of {eventsQuery.data.totalPages}
          </p>
        )}
      </div>

      {inFlightMessage && (
        <div className="rounded-lg border border-signal/45 bg-signal-faded p-3 text-sm text-signal-display sm:text-base">
          {inFlightMessage}
        </div>
      )}

      {flashMessage && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-accent/45 bg-accent-faded p-3 text-accent-display sm:flex-row sm:items-center sm:justify-between">
          <span>{flashMessage}</span>
          <Button
            type="button"
            variant="link"
            onClick={() => setFlashMessage(null)}
            className="w-full justify-start p-0 sm:w-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {actionError && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger-faded p-3 text-danger-display sm:flex-row sm:items-center sm:justify-between">
          <span>{actionError}</span>
          <Button
            type="button"
            variant="link"
            onClick={() => setActionError(null)}
            className="w-full justify-start p-0 sm:w-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {eventsQuery.isLoading && <LoadingState label="Loading events..." />}

      {eventsQuery.isError && (
        <div className="rounded-xl border border-danger bg-danger-faded p-4 text-danger-display">
          Failed to load admin events list.
        </div>
      )}

      {!eventsQuery.isLoading &&
        !eventsQuery.isError &&
        eventsQuery.data &&
        eventsQuery.data.items.length === 0 && (
          <div className="rounded-xl border border-hairline bg-page p-8 text-center text-ink-muted">
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
                  imagePositionX: event.imagePositionX,
                  imagePositionY: event.imagePositionY,
                  imageZoom: event.imageZoom,
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
            <div className="rounded-xl border border-hairline bg-page p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-xl font-semibold text-ink-display">
                  Attendees Panel
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedAttendeesEventId(null)}
                >
                  Close Panel
                </Button>
              </div>
              <p className="mb-4 mt-1 text-sm text-ink-body">
                Viewing attendees for: {event.title}
              </p>

              {attendeesQuery.isLoading && (
                <LoadingState label="Loading attendees..." compact />
              )}
              {attendeesQuery.isError && (
                <p className="rounded-lg border border-danger bg-danger-faded p-3 text-danger-display">
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
