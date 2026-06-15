import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../app/stores/store";
import { useTheme } from "../../app/theme/theme-context";
import { useEvents } from "../../hooks/useEvents";
import { useJoinEvent, useLeaveEvent } from "../../hooks/useAttendance";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import type { EventFilter } from "../../types/event";

import { HeroBanner } from "./components/HeroBanner";
import { QuickStats } from "./components/QuickStats";
import { UpcomingEventsPreview } from "./components/UpcomingEventsPreview";
import { MyEventsWidget } from "./components/MyEventsWidget";
import { AdminQuickActions } from "./components/AdminQuickActions";
import { CommunityInfo } from "./components/CommunityInfo";

export const HomePage = observer(function HomePage() {
  const { authStore } = useStore();
  const { resolvedTheme } = useTheme();
  const [actionError, setActionError] = useState<string | null>(null);
  const isDark = resolvedTheme === "dark";

  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();

  // Query used for the upcoming-events hero preview.
  const upcomingPreviewFilter = useMemo(
    (): EventFilter => ({
      sortBy: "upcoming",
      status: "Published",
      pageSize: 3,
      page: 1,
    }),
    [],
  );

  // Broader dataset for stats and role-specific widgets (includes cancelled events).
  const dashboardDataFilter = useMemo(
    (): EventFilter => ({
      sortBy: "upcoming",
      pageSize: 50,
      page: 1,
    }),
    [],
  );

  const upcomingPreviewQuery = useEvents(upcomingPreviewFilter);
  const dashboardDataQuery = useEvents(dashboardDataFilter);

  const allEvents = dashboardDataQuery.data?.items ?? [];
  const upcomingEvents = upcomingPreviewQuery.data?.items ?? [];

  const role =
    authStore.user?.role === "hoa_admin"
      ? ("hoa_admin" as const)
      : authStore.user?.role === "resident"
        ? ("resident" as const)
        : ("guest" as const);

  const showResidentSection = authStore.isLoggedIn && role === "resident";
  const showAdminSection = authStore.isLoggedIn && authStore.isAdmin;
  const roleSectionCount =
    Number(showResidentSection) + Number(showAdminSection);

  const handleJoinLeave = async (eventId: string, joining: boolean) => {
    setActionError(null);
    try {
      if (joining) {
        await joinMutation.mutateAsync(eventId);
      } else {
        await leaveMutation.mutateAsync(eventId);
      }
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          joining ? "Failed to join event." : "Failed to leave event.",
        ),
      );
    }
  };

  return (
    <div
      className={`space-y-8 rounded-3xl p-4 sm:p-5 ${
        isDark
          ? "bg-[linear-gradient(155deg,rgba(16,28,42,0.72),rgba(14,24,36,0.72))]"
          : "bg-[linear-gradient(155deg,rgba(255,249,238,0.88),rgba(243,251,246,0.88))]"
      }`}
    >
      {/* Hero Banner */}
      <HeroBanner user={authStore.user} isAdmin={authStore.isAdmin} />

      {/* Quick Stats — authenticated users only */}
      {authStore.isLoggedIn && (
        <QuickStats
          events={allEvents}
          isLoading={dashboardDataQuery.isLoading}
        />
      )}

      {/* Action error toast */}
      {actionError && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
            isDark
              ? "border-[#8b3a37] bg-[#311615] text-[#ffcbc8]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="text-sm">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Conditional role sections rendered side by side on wider screens */}
      {authStore.isLoggedIn && (
        <div
          className={`grid gap-6 ${
            roleSectionCount > 1 ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* My Events — residents see their RSVPs */}
          {showResidentSection && (
            <MyEventsWidget
              events={allEvents}
              isLoading={dashboardDataQuery.isLoading}
            />
          )}

          {/* Admin Quick Actions */}
          {showAdminSection && <AdminQuickActions events={allEvents} />}
        </div>
      )}

      {/* Upcoming Events Preview */}
      <UpcomingEventsPreview
        events={upcomingEvents}
        isLoading={upcomingPreviewQuery.isLoading}
        isError={upcomingPreviewQuery.isError}
        role={role}
        onJoinLeave={authStore.isLoggedIn ? handleJoinLeave : undefined}
      />

      {/* Community Info Footer */}
      <CommunityInfo />
    </div>
  );
});
