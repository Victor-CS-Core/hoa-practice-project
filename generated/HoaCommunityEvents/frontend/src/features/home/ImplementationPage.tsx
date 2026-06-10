import { useMutation, useQuery } from "@tanstack/react-query";
import { Account, Diagnostics, Events } from "../../app/api/agent";
import { useStore } from "../../app/stores/store";

function StatusLine({
  title,
  ok,
  detail,
  loading,
}: {
  title: string;
  ok: boolean;
  detail: string;
  loading: boolean;
}) {
  return (
    <li>
      <strong>{title}:</strong> {loading ? "Checking..." : ok ? "PASS" : "FAIL"}
      <div>{detail}</div>
    </li>
  );
}

export function ImplementationPage() {
  const { authStore } = useStore();
  const hasToken = !!localStorage.getItem("jwt");

  const healthQuery = useQuery({
    queryKey: ["implementation", "health"],
    queryFn: () => Diagnostics.health(),
  });

  const eventsQuery = useQuery({
    queryKey: ["implementation", "events", "paged"],
    queryFn: () => Events.list({ page: 1, pageSize: 2, sortBy: "upcoming" }),
  });

  const currentUserQuery = useQuery({
    queryKey: ["implementation", "auth", "current"],
    queryFn: () => Account.current(),
    enabled: hasToken,
    retry: false,
  });

  const validationQuery = useQuery({
    queryKey: ["implementation", "validation-envelope"],
    queryFn: () =>
      Diagnostics.invalidRegister({
        email: "bad",
        username: "x",
        displayName: "",
        password: "123",
      }),
    retry: false,
  });

  const hasPagedShape = !!(
    eventsQuery.data &&
    Array.isArray(eventsQuery.data.items) &&
    typeof eventsQuery.data.totalCount === "number" &&
    typeof eventsQuery.data.page === "number" &&
    typeof eventsQuery.data.pageSize === "number" &&
    typeof eventsQuery.data.totalPages === "number"
  );

  const hasValidationEnvelope = !!(
    validationQuery.data &&
    validationQuery.data.code === "validation_failed" &&
    typeof validationQuery.data.message === "string" &&
    validationQuery.data.details &&
    typeof validationQuery.data.details === "object"
  );

  const adminProbeMutation = useMutation({
    mutationFn: () => Diagnostics.adminCreateProbe(),
  });

  const adminProbeResult = adminProbeMutation.data;
  const isAdmin = authStore.user?.role === "hoa_admin";
  const isResident = authStore.user?.role === "resident";

  const adminProbePass =
    adminProbeResult &&
    ((isAdmin &&
      adminProbeResult.status === 400 &&
      adminProbeResult.code === "validation_failed") ||
      (isResident && adminProbeResult.status === 403));

  return (
    <section>
      <h1>Implementation Status</h1>
      <p>
        This page captures the stable API contracts and readiness milestones for
        UI integration.
      </p>

      <h2>Live Contract Checks</h2>
      <ul>
        <StatusLine
          title="Health endpoint"
          ok={!healthQuery.isError}
          loading={healthQuery.isLoading}
          detail={
            healthQuery.isError
              ? "Could not reach /health."
              : `API reachable${healthQuery.data?.status ? ` (${healthQuery.data.status})` : ""}.`
          }
        />
        <StatusLine
          title="Paged events contract"
          ok={hasPagedShape}
          loading={eventsQuery.isLoading}
          detail={
            eventsQuery.isError
              ? "Failed to load event list sample."
              : hasPagedShape
                ? `Shape OK. page=${eventsQuery.data?.page}, pageSize=${eventsQuery.data?.pageSize}, totalPages=${eventsQuery.data?.totalPages}.`
                : "Missing one or more required paging fields."
          }
        />
        <StatusLine
          title="Validation envelope"
          ok={hasValidationEnvelope}
          loading={validationQuery.isLoading}
          detail={
            validationQuery.isError
              ? "Validation check request failed unexpectedly."
              : hasValidationEnvelope
                ? "validation_failed envelope and details map detected."
                : "Expected validation_failed envelope was not returned."
          }
        />
        <StatusLine
          title="Current-user auth contract"
          ok={!hasToken || !currentUserQuery.isError}
          loading={hasToken && currentUserQuery.isLoading}
          detail={
            !hasToken
              ? "Skipped (no JWT in localStorage)."
              : currentUserQuery.isError
                ? "Token did not resolve to current user."
                : `Authenticated as ${currentUserQuery.data?.username ?? "user"}.`
          }
        />
      </ul>

      <h2>Admin Policy Probe</h2>
      <p>
        Runs a non-destructive check against <code>POST /api/events</code> using
        an intentionally invalid payload.
      </p>
      <p>Expected: resident gets 403; admin gets 400 validation_failed.</p>
      <button
        type="button"
        onClick={() => adminProbeMutation.mutate()}
        disabled={!hasToken || adminProbeMutation.isPending}
      >
        {adminProbeMutation.isPending ? "Running..." : "Run Admin Policy Probe"}
      </button>
      {!hasToken && <p>Login required to run this probe.</p>}
      {adminProbeResult && (
        <p>
          Result: {adminProbePass ? "PASS" : "FAIL"} (status=
          {adminProbeResult.status}
          {adminProbeResult.code ? `, code=${adminProbeResult.code}` : ""}
          {adminProbeResult.message
            ? `, message=${adminProbeResult.message}`
            : ""}
          )
        </p>
      )}

      <h2>Completed Foundations</h2>
      <ul>
        <li>
          Event list API returns paged metadata (items, totalCount, page,
          pageSize, totalPages).
        </li>
        <li>
          API errors use a unified envelope (code, message, details, traceId).
        </li>
        <li>
          FluentValidation is active for request DTOs with field-level details.
        </li>
        <li>
          Authorization is policy-based with AdminOnly and ResidentOrAdmin
          policies.
        </li>
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
        <li>
          ResidentOrAdmin: current user, logout, attendance join/leave,
          profiles.
        </li>
      </ul>
    </section>
  );
}
