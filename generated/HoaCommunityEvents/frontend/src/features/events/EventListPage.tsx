import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useEvents } from "../../hooks/useEvents";
import { useStore } from "../../app/stores/store";

export function EventListPage() {
  const { authStore } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";

  const filter = useMemo(
    () => ({
      category: category || undefined,
      status: status || undefined,
      sortBy: "upcoming",
      page: 1,
      pageSize: 20,
    }),
    [category, status],
  );

  const { data, isLoading, isError } = useEvents(filter);

  if (isLoading) return <p>Loading events...</p>;
  if (isError) return <p>Failed to load events.</p>;

  return (
    <section>
      <h2>Events</h2>
      {authStore.isAdmin && (
        <p>
          <Link to="/events/create">Create a new event</Link>
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select
          value={category}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set("category", e.target.value);
              else next.delete("category");
              return next;
            })
          }
        >
          <option value="">All categories</option>
          <option value="Board Meeting">Board Meeting</option>
          <option value="Community Cleanup">Community Cleanup</option>
          <option value="Pool Event">Pool Event</option>
        </select>

        <select
          value={status}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set("status", e.target.value);
              else next.delete("status");
              return next;
            })
          }
        >
          <option value="">All statuses</option>
          <option value="Published">Published</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
        {(data?.items ?? []).map((evt) => (
          <li
            key={evt.id}
            style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}
          >
            <h3 style={{ marginTop: 0 }}>{evt.title}</h3>
            <p>{evt.description}</p>
            <p>
              {evt.category} | {new Date(evt.startDate).toLocaleString()} |{" "}
              {evt.status}
            </p>
            <p>Attendees: {evt.attendeeCount}</p>
            <Link to={`/events/${evt.id}`}>View details</Link>
          </li>
        ))}
      </ul>

      {data && (
        <p>
          Showing page {data.page} of {data.totalPages} ({data.totalCount} total events)
        </p>
      )}
    </section>
  );
}
