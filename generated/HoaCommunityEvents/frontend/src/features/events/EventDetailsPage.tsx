import { Link, useParams } from 'react-router-dom';
import { useEvent } from '../../hooks/useEvents';

export function EventDetailsPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useEvent(id);

  if (isLoading) return <p>Loading event...</p>;
  if (isError || !data) return <p>Event not found.</p>;

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
    </section>
  );
}
