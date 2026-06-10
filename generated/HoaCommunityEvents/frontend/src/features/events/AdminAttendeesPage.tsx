import { Link } from "react-router-dom";

export function AdminAttendeesPage() {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-2xl font-bold text-stone-900">
        Admin Attendees
      </h2>
      <p className="mt-2 text-stone-600">
        Select an event from the events list to view attendee roster details.
      </p>
      <p className="mt-4">
        <Link
          to="/admin/events"
          className="text-emerald-700 underline hover:text-emerald-800"
        >
          Go to Admin Dashboard
        </Link>
      </p>
    </section>
  );
}
