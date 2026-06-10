import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  useCancelEvent,
  useDeleteEvent,
  useEvent,
} from "../../hooks/useEvents";
import {
  useAttendees,
  useJoinEvent,
  useLeaveEvent,
} from "../../hooks/useAttendance";
import { useStore } from "../../app/stores/store";
import { useSignalR } from "../../hooks/useSignalR";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import { AttendanceActionCard } from "./components/AttendanceActionCard";
import { EventInfoPanel } from "./components/EventInfoPanel";
import { AdminAttendeeList } from "./components/AdminAttendeeList";

export function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authStore } = useStore();
  const { data, isLoading, isError } = useEvent(id);
  const cancelMutation = useCancelEvent();
  const deleteMutation = useDeleteEvent();
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const attendeesQuery = useAttendees(id, authStore.isAdmin);
  const [actionError, setActionError] = useState<string | null>(null);

  useSignalR(id);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
        Loading event...
      </div>
    );
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

  const isGuest = !authStore.isLoggedIn;
  const canJoin =
    authStore.isLoggedIn && !authStore.isAdmin && !data.isCurrentUserAttending;
  const canLeave =
    authStore.isLoggedIn && !authStore.isAdmin && data.isCurrentUserAttending;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/events"
          className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800"
        >
          Back to events
        </Link>

        {authStore.isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/events/${data.id}/edit`}
              className="inline-flex rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              Edit
            </Link>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Event"}
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <EventInfoPanel event={data} />

          {authStore.isAdmin && (
            <div>
              {attendeesQuery.isLoading && (
                <p className="mt-8 text-stone-500">Loading attendees...</p>
              )}
              {attendeesQuery.isError && (
                <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
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
        </div>

        <AttendanceActionCard
          event={data}
          canJoin={canJoin}
          canLeave={canLeave}
          isGuest={isGuest}
          errorMsg={actionError}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      </div>

      {joinMutation.isPending || leaveMutation.isPending ? (
        <div className="text-sm text-stone-500">Updating attendance...</div>
      ) : null}

      {authStore.isLoggedIn &&
        !authStore.isAdmin &&
        data.status === "Cancelled" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            This event is cancelled. Joining is disabled.
          </div>
        )}
    </section>
  );
}
