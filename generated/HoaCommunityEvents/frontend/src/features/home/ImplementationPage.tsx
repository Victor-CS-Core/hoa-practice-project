export function ImplementationPage() {
  return (
    <section>
      <h1>Implementation Status</h1>
      <p>
        This page captures the stable API contracts and readiness milestones for
        UI integration.
      </p>

      <h2>Completed Foundations</h2>
      <ul>
        <li>Event list API returns paged metadata (items, totalCount, page, pageSize, totalPages).</li>
        <li>API errors use a unified envelope (code, message, details, traceId).</li>
        <li>FluentValidation is active for request DTOs with field-level details.</li>
        <li>Authorization is policy-based with AdminOnly and ResidentOrAdmin policies.</li>
      </ul>

      <h2>Contract Samples</h2>
      <p>GET /api/events?page=1&pageSize=2</p>
      <pre>
        <code>{`{
  "items": [{ "id": "...", "title": "..." }],
  "totalCount": 11,
  "page": 1,
  "pageSize": 2,
  "totalPages": 6
}`}</code>
      </pre>

      <p>Validation error envelope</p>
      <pre>
        <code>{`{
  "code": "validation_failed",
  "message": "Validation failed.",
  "details": {
    "Email": ["'Email' is not a valid email address."]
  },
  "traceId": "..."
}`}</code>
      </pre>

      <h2>Authorization Matrix</h2>
      <ul>
        <li>AdminOnly: event create, edit, cancel, delete; attendee list.</li>
        <li>ResidentOrAdmin: current user, logout, attendance join/leave, profiles.</li>
      </ul>
    </section>
  );
}
