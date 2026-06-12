import { Calendar, Clock3, MapPin, User, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import { FramedImage } from "../../components/media/FramedImage";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { LoadingState } from "../../components/ui/loading-state";
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
import { useSignalR } from "../../hooks/useSignalR";
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

  useSignalR(id);

  if (isLoading) {
    return <LoadingState label="Loading event..." />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-stone-900">
          Event not found
        </h2>
        <p className="mt-2 text-stone-600">
          The event may have been removed or is unavailable.
        </p>
        <Link
          to="/events"
          className="mt-4 inline-block text-emerald-700 underline hover:text-emerald-800"
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
    ? "bg-red-100 text-red-700"
    : isEnded
      ? "bg-slate-200 text-slate-700"
      : data.status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

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
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackNavigationButton to="/events" label="Back to events" />
      </div>

      <Card className="overflow-hidden border-stone-200 bg-white shadow-sm animate-fade-up">
        <CardContent className="space-y-5 p-6 md:p-8">
          {data.imageUrl && failedImageUrl !== data.imageUrl && (
            <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8">
              <div className="h-52 w-full overflow-hidden border-b border-stone-200 md:h-64">
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
            <Badge
              variant="outline"
              className="border-stone-300 bg-stone-100 text-stone-700"
            >
              {data.category}
            </Badge>
            <Badge variant="secondary" className={statusTone}>
              {statusLabel}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold leading-tight text-stone-900 md:text-4xl">
              {data.title}
            </h1>
            <p className="flex items-center gap-2 text-stone-600">
              <User className="h-4 w-4 text-stone-400" /> Hosted by{" "}
              {data.hostDisplayName}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Date
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-stone-800">
                <Calendar className="mt-0.5 h-4 w-4 text-stone-500" />{" "}
                {dateLabel}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Time
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-stone-800">
                <Clock3 className="mt-0.5 h-4 w-4 text-stone-500" /> {timeLabel}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Location
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-stone-800">
                <MapPin className="mt-0.5 h-4 w-4 text-stone-500" />{" "}
                {data.locationWithinCommunity}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Attendance
              </p>
              <p className="flex items-start gap-2 text-sm font-medium text-stone-800">
                <Users className="mt-0.5 h-4 w-4 text-stone-500" />
                {data.attendeeCount}{" "}
                {data.maxAttendees ? `/ ${data.maxAttendees}` : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
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

          <Card className="border-stone-200 bg-white shadow-sm animate-fade-up animate-delay-100">
            <CardHeader>
              <h2 className="font-heading text-xl font-semibold text-stone-900">
                About this event
              </h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-relaxed text-stone-600">
                {data.description}
              </p>
            </CardContent>
          </Card>

          {authStore.isLoggedIn && !authStore.isAdmin && isCancelled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              This event is cancelled. Joining is disabled.
            </div>
          )}

          {authStore.isAdmin && (
            <Card className="border-stone-200 bg-white shadow-sm animate-fade-up animate-delay-200">
              <CardHeader>
                <h2 className="font-heading text-xl font-semibold text-stone-900">
                  Attendees
                </h2>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
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
            <Card className="sticky top-96 border-stone-200 bg-white shadow-sm">
              <CardHeader>
                <h3 className="font-heading text-lg font-semibold text-stone-900">
                  Admin tools
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setEditOpen((prev) => !prev);
                    setEditError(null);
                  }}
                >
                  {editOpen ? "Close editor" : "Edit event"}
                </Button>
                <Button
                  className={`w-full justify-start text-white ${
                    isCancelled
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
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
                  className="w-full justify-start bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete event"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {(joinMutation.isPending || leaveMutation.isPending) && (
        <div className="text-sm text-stone-500">Updating attendance...</div>
      )}
    </section>
  );
}
