import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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

  useSignalR(id);

  if (isLoading) return <p>Loading event...</p>;
  if (isError || !data) return <p>Event not found.</p>;

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(data.id);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    await deleteMutation.mutateAsync(data.id);
    navigate("/events");
  };

  const handleJoin = async () => {
    await joinMutation.mutateAsync(data.id);
  };

  const handleLeave = async () => {
    await leaveMutation.mutateAsync(data.id);
  };

  const canJoinOrLeave = authStore.isLoggedIn && !authStore.isAdmin;

  return (
    <section>
      <Link to="/events">Back to events</Link>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <p>Category: {data.category}</p>
      <p>Location: {data.locationWithinCommunity}</p>
      <p>Host: {data.hostDisplayName}</p>
      <p>Status: {data.status}</p>
      <p>Starts: {new Date(data.startDate).toLocaleString()}</p>
      <p>Ends: {new Date(data.endDate).toLocaleString()}</p>
      <p>Attendees: {data.attendeeCount}</p>
      {canJoinOrLeave && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {!data.isCurrentUserAttending ? (
            <button type="button" onClick={handleJoin}>
              Join Event
            </button>
          ) : (
            <button type="button" onClick={handleLeave}>
              Leave Event
            </button>
          )}
        </div>
      )}
      {authStore.isAdmin && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to={`/events/${data.id}/edit`}>Edit</Link>
            <button type="button" onClick={handleCancel}>
              Cancel Event
            </button>
            <button type="button" onClick={handleDelete}>
              Delete Event
            </button>
          </div>

          <div>
            <h3>Attendee List</h3>
            {attendeesQuery.isLoading && <p>Loading attendees...</p>}
            {attendeesQuery.isError && <p>Failed to load attendees.</p>}
            {attendeesQuery.data && (
              <ul>
                {attendeesQuery.data.map((a) => (
                  <li key={a.userId + a.joinedAt}>{a.displayName}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
