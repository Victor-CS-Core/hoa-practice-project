import { Calendar, Clock3, MapPin, User, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import { FramedImage } from "../../components/media/FramedImage";
import { Badge } from "../../components/design-system/ui/badge";
import { Button } from "../../components/design-system/ui/button";
import { LoadingState } from "../../components/design-system/ui/loading-state";
import {
  useCancelEvent,
  useDeleteEvent,
  useEditEvent,
  useEvent,
  usePublishEvent,
} from "../../hooks/useEvents";
import {
  useAttendees,
  useJoinEvent,
  useLeaveEvent,
} from "../../hooks/useAttendance";
import { useStore } from "../../app/stores/store";
import { useEventStream } from "../../hooks/useEventStream";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import { toApiError, type ApiErrorEnvelope } from "../auth/authApiError";
import { AttendanceActionCard } from "./components/AttendanceActionCard";
import { AdminAttendeeList } from "./components/AdminAttendeeList";
import { AdminEventForm } from "./components/AdminEventForm";

export function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authStore } = useStore();
  const { data, isLoading, isError } = useEvent(id);
  const cancelMutation = useCancelEvent();
  const publishMutation = usePublishEvent();
  const deleteMutation = useDeleteEvent();
  const editMutation = useEditEvent();
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const attendeesQuery = useAttendees(id, authStore.isAdmin);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<ApiErrorEnvelope | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  useEventStream(id);

  if (isLoading) {
    return <LoadingState label="Loading event..." />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-hairline bg-page p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-ink-display">
          Event not found
        </h2>
        <p className="mt-2 text-ink-muted">
          The event may have been removed or is unavailable.
        </p>
        <Link
          to="/events"
          className="mt-4 inline-block underline text-accent-display hover:text-accent"
        >
          Back to events
        </Link>
      </div>
    );
  }

  const handleCancel = async () => {
    setActionError(null);
    try {
      await cancelMutation.mutateAsync(data.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to cancel event."));
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(data.id);
      navigate("/events");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to delete event."));
    }
  };

  const handlePublish = async () => {
    setActionError(null);
    try {
      await publishMutation.mutateAsync(data.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to publish event."));
    }
  };

  const handleJoin = async () => {
    setActionError(null);
    try {
      await joinMutation.mutateAsync(data.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to join event."));
    }
  };

  const handleLeave = async () => {
    setActionError(null);
    try {
      await leaveMutation.mutateAsync(data.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to leave event."));
    }
  };

  const handleEditSubmit = async (values: {
    title: string;
    description: string;
    category: string;
    locationWithinCommunity: string;
    startDate: string;
    endDate: string;
    maxAttendees?: number | null;
    imageUrl?: string | null;
    imagePositionX?: number | null;
    imagePositionY?: number | null;
    imageZoom?: number | null;
  }) => {
    setEditError(null);
    setActionError(null);

    try {
      await editMutation.mutateAsync({ id: data.id, values });
      setEditOpen(false);
    } catch (error) {
      const apiErr = toApiError(error);
      setEditError(apiErr ?? { message: "Failed to update event." });
    }
  };

  const isGuest = !authStore.isLoggedIn;
  const canJoin =
    authStore.isLoggedIn && !authStore.isAdmin && !data.isCurrentUserAttending;
  const canLeave =
    authStore.isLoggedIn && !authStore.isAdmin && data.isCurrentUserAttending;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const now = new Date();
  const isCancelled = data.status === "Cancelled";
  const isEnded = !isCancelled && end.getTime() < now.getTime();
  const statusLabel = isCancelled
    ? "Cancelled"
    : isEnded
      ? "Ended"
      : data.status;

  const statusTone = isCancelled
    ? "muted"
    : isEnded
      ? "muted"
      : data.status === "Pending"
        ? "signal"
        : "accent";

  const statusClass = isCancelled ? "bg-danger-faded text-danger-display" : "";

  const dateLabel = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeLabel = `${start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <section className="min-w-0 space-y-6 rounded-3xl bg-surface/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackNavigationButton to="/events" label="Back to events" />
      </div>

      <article className="animate-fade-up overflow-hidden rounded-xl border border-hairline bg-page shadow-sm">
        <div className="space-y-5 p-6 md:p-8">
          {data.imageUrl && failedImageUrl !== data.imageUrl && (
            <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8">
              <div className="h-52 w-full overflow-hidden border-b border-hairline md:h-64">
                <FramedImage
                  src={data.imageUrl}
                  alt={`${data.title} banner`}
                  positionX={data.imagePositionX}
                  positionY={data.imagePositionY}
                  zoom={data.imageZoom}
                  onError={() => setFailedImageUrl(data.imageUrl ?? null)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" className="border-hairline bg-surface">
              {data.category}
            </Badge>
            <Badge tone={statusTone} className={statusClass}>
              {statusLabel}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="wrap-break-word font-heading text-3xl font-bold leading-tight text-ink-display md:text-4xl">
              {data.title}
            </h1>
            <p className="flex min-w-0 items-center gap-2 text-ink-body">
              <User className="h-4 w-4 text-ink-muted" /> Hosted by{" "}
              <span className="wrap-break-word">{data.hostDisplayName}</span>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-hairline bg-surface p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Date
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-ink-display">
                <Calendar className="mt-0.5 h-4 w-4 text-ink-muted" />{" "}
                {dateLabel}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Time
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-ink-display">
                <Clock3 className="mt-0.5 h-4 w-4 text-ink-muted" /> {timeLabel}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Location
              </p>
              <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink-display">
                <MapPin className="mt-0.5 h-4 w-4 text-ink-muted" />{" "}
                <span className="wrap-break-word">
                  {data.locationWithinCommunity}
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Attendance
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-ink-display">
                <Users className="mt-0.5 h-4 w-4 text-ink-muted" />
                {data.attendeeCount}{" "}
                {data.maxAttendees ? `/ ${data.maxAttendees}` : ""}
              </p>
            </div>
          </div>
        </div>
      </article>

      {actionError && (
        <div className="rounded-xl border border-danger bg-danger-faded p-4 text-danger-display">
          {actionError}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {authStore.isAdmin && editOpen && (
            <div className="animate-fade-up animate-delay-100">
              <AdminEventForm
                mode="edit"
                initialValues={{
                  title: data.title,
                  description: data.description,
                  category: data.category,
                  locationWithinCommunity: data.locationWithinCommunity,
                  startDate: data.startDate,
                  endDate: data.endDate,
                  maxAttendees: data.maxAttendees ?? undefined,
                  imageUrl: data.imageUrl ?? "",
                  imagePositionX: data.imagePositionX,
                  imagePositionY: data.imagePositionY,
                  imageZoom: data.imageZoom,
                }}
                isSubmitting={editMutation.isPending}
                apiError={editError}
                onCancel={() => {
                  setEditOpen(false);
                  setEditError(null);
                }}
                onSubmit={handleEditSubmit}
              />
            </div>
          )}

          <article className="animate-fade-up animate-delay-100 rounded-xl border border-hairline bg-page shadow-sm">
            <div className="px-6 pb-3 pt-6">
              <h2 className="font-heading text-xl font-semibold text-ink-display">
                About this event
              </h2>
            </div>
            <div className="px-6 pb-6">
              <p className="whitespace-pre-line wrap-break-word leading-relaxed text-ink-body">
                {data.description}
              </p>
            </div>
          </article>

          {authStore.isLoggedIn && !authStore.isAdmin && isCancelled && (
            <div className="rounded-xl border border-signal/45 bg-signal-faded p-4 text-signal-display">
              This event is cancelled. Joining is disabled.
            </div>
          )}

          {authStore.isAdmin && (
            <article className="animate-fade-up animate-delay-200 rounded-xl border border-hairline bg-page shadow-sm">
              <div className="px-6 pb-3 pt-6">
                <h2 className="font-heading text-xl font-semibold text-ink-display">
                  Attendees
                </h2>
              </div>
              <div className="px-6 pb-6">
                {attendeesQuery.isLoading && (
                  <p className="text-ink-muted">Loading attendees...</p>
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
            </article>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <AttendanceActionCard
            event={data}
            canJoin={canJoin}
            canLeave={canLeave}
            isGuest={isGuest}
            errorMsg={null}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />

          {authStore.isAdmin && (
            <article className="rounded-xl border border-hairline bg-page shadow-sm xl:sticky xl:top-24">
              <div className="px-6 pb-3 pt-6">
                <h3 className="font-heading text-lg font-semibold text-ink-display">
                  Admin tools
                </h3>
              </div>
              <div className="flex flex-col gap-2 px-6 pb-6">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => {
                    setEditOpen((prev) => !prev);
                    setEditError(null);
                  }}
                >
                  {editOpen ? "Close editor" : "Edit event"}
                </Button>
                <Button
                  variant={isCancelled ? "primary" : "secondary"}
                  className={`w-full justify-start ${
                    isCancelled
                      ? ""
                      : "border-signal/45 bg-signal-faded text-signal-display hover:bg-signal-faded/85"
                  }`}
                  onClick={isCancelled ? handlePublish : handleCancel}
                  disabled={
                    isCancelled
                      ? publishMutation.isPending
                      : cancelMutation.isPending
                  }
                >
                  {isCancelled
                    ? publishMutation.isPending
                      ? "Publishing..."
                      : "Publish event"
                    : cancelMutation.isPending
                      ? "Cancelling..."
                      : "Cancel event"}
                </Button>
                <Button
                  variant="danger"
                  className="w-full justify-start"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete event"}
                </Button>
              </div>
            </article>
          )}
        </div>
      </div>

      {(joinMutation.isPending || leaveMutation.isPending) && (
        <div className="text-sm text-ink-muted">Updating attendance...</div>
      )}
    </section>
  );
}
