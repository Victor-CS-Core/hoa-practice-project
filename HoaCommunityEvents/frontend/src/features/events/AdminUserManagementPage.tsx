import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Shield, UserCheck, UserX } from "lucide-react";
import { useStore } from "../../app/stores/store";
import { useTheme } from "../../app/theme/theme-context";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import { LoadingState } from "../../components/ui/loading-state";
import {
  useAdminUsers,
  useDeleteUser,
  usePromoteUserToAdmin,
} from "../../hooks/useAdminUsers";
import { toApiError } from "../auth/authApiError";
import { BRAND } from "../../app/branding";

export function AdminUserManagementPage() {
  const { authStore } = useStore();
  const { resolvedTheme } = useTheme();
  const [userSearch, setUserSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const isDark = resolvedTheme === "dark";

  const usersQuery = useAdminUsers();
  const promoteUserMutation = usePromoteUserToAdmin();
  const deleteUserMutation = useDeleteUser();
  const allUsers = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const rowHoverTone = isDark ? "hover:bg-[#1a2637]" : "hover:bg-[#f4eee3]";

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;

    return allUsers.filter((user) =>
      [user.displayName, user.username, user.email]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [allUsers, userSearch]);

  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter(
    (user) => user.role === "hoa_admin",
  ).length;
  const residentUsers = allUsers.filter(
    (user) => user.role !== "hoa_admin",
  ).length;

  const panelTone = isDark
    ? "border-[#2a3f58] bg-[#101b2b]/88 text-[#e8f3ff]"
    : "border-[#d9b58f] bg-[#fffaf0] text-[#3d2c1d]";

  const cardTone = isDark
    ? "border-[#27384f] bg-[#0f1a2a]"
    : "border-[#e2c7a8] bg-[#fffdf8]";

  const textMutedTone = isDark ? "text-[#9fb4c9]" : "text-[#7a5e46]";

  if (!authStore.isAdmin) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-heading text-2xl font-bold text-amber-900">
          Admin Access Required
        </h2>
        <p className="mt-2 text-amber-800">
          This page is available only to community administrators.
        </p>
        <p className="mt-4">
          <Link to="/events" className="text-amber-900 underline">
            Return to events
          </Link>
        </p>
      </section>
    );
  }

  const handlePromote = async (email: string) => {
    setActionError(null);

    try {
      const updated = await promoteUserMutation.mutateAsync(email);
      setFlashMessage(`Updated role: ${updated.displayName} is now admin.`);
    } catch (error) {
      const next = toApiError(error);
      setActionError(next?.message ?? "Failed to update user role.");
    }
  };

  const handleDeleteUser = async (email: string, displayName: string) => {
    setActionError(null);

    const confirmed = window.confirm(
      `Delete ${displayName}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteUserMutation.mutateAsync(email);
      setFlashMessage(`Deleted user: ${displayName}.`);
    } catch (error) {
      const next = toApiError(error);
      setActionError(next?.message ?? "Failed to delete user.");
    }
  };

  return (
    <section className="space-y-6 rounded-3xl p-4 sm:p-6">
      <div>
        <BackNavigationButton to="/events" label="Back to events" />
      </div>

      <div
        className={`auth-motion-board rounded-[1.75rem] border p-6 shadow-[0_30px_50px_-38px_rgba(0,0,0,0.55)] ${panelTone}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className={`font-auth-ui text-xs tracking-[0.22em] uppercase ${isDark ? "text-[#8dd8ba]" : "text-[#9b5d1f]"}`}
            >
              {BRAND.adminToolsLabel}
            </p>
            <h1
              className={`mt-2 font-auth-display text-3xl font-semibold sm:text-4xl ${isDark ? "text-[#f3fbff]" : "text-[#352214]"}`}
            >
              User Management
            </h1>
            <p className={`mt-2 max-w-2xl leading-relaxed ${textMutedTone}`}>
              Manage role assignments and account controls with a clear view of
              admin coverage across your community. Keep board access tightly
              governed while residents stay informed.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-xl border p-4 ${cardTone}`}>
            <p
              className={`font-auth-ui text-xs font-semibold tracking-[0.16em] uppercase ${textMutedTone}`}
            >
              Total Users
            </p>
            <p
              className={`mt-2 font-heading text-2xl font-bold ${isDark ? "text-[#f3fbff]" : "text-[#3c2a1a]"}`}
            >
              {totalUsers}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-[#6e5d2b] bg-[#2f2715]"
                : "border-[#e0b364] bg-[#fff3d8]"
            }`}
          >
            <p
              className={`font-auth-ui text-xs font-semibold tracking-[0.16em] uppercase ${
                isDark ? "text-[#efdb9c]" : "text-[#9a6814]"
              }`}
            >
              Admins
            </p>
            <p
              className={`mt-2 flex items-center gap-2 font-heading text-2xl font-bold ${
                isDark ? "text-[#fff1c0]" : "text-[#6f470c]"
              }`}
            >
              <Shield className="h-5 w-5" /> {adminUsers}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-[#2e7760] bg-[#122c24]"
                : "border-[#8ec7a8] bg-[#e9f7ed]"
            }`}
          >
            <p
              className={`font-auth-ui text-xs font-semibold tracking-[0.16em] uppercase ${
                isDark ? "text-[#99e4c7]" : "text-[#1f6a4f]"
              }`}
            >
              Residents
            </p>
            <p
              className={`mt-2 flex items-center gap-2 font-heading text-2xl font-bold ${
                isDark ? "text-[#d1f9e9]" : "text-[#16513d]"
              }`}
            >
              <UserCheck className="h-5 w-5" /> {residentUsers}
            </p>
          </div>
        </div>
      </div>

      {flashMessage && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${isDark ? "border-[#2e7b61] bg-[#102921] text-[#b8f5dc]" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${isDark ? "border-[#8b3a37] bg-[#311615] text-[#ffcbc8]" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        className={`auth-motion-card rounded-2xl border shadow-[0_22px_45px_-34px_rgba(0,0,0,0.65)] ${cardTone}`}
      >
        <div
          className={`border-b px-5 py-4 ${isDark ? "border-[#27384f]" : "border-[#e2c7a8]"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                className={`font-auth-display text-2xl font-semibold ${isDark ? "text-[#f2f8ff]" : "text-[#362214]"}`}
              >
                Accounts Directory
              </h2>
              <p className={`mt-1 text-sm ${textMutedTone}`}>
                Search by display name, username, or email and take role
                actions.
              </p>
            </div>

            <label className="relative block w-full sm:w-90">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-[#7f95ad]" : "text-[#9c826b]"}`}
              />
              <input
                type="search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users..."
                className={`min-h-11 w-full rounded-md border pl-10 pr-3 py-2 text-sm ${
                  isDark
                    ? "border-[#35465e] bg-[#0f1826] text-[#eaf4ff] placeholder:text-[#8ea5bf]"
                    : "border-[#d7b087] bg-[#fffcf5] text-[#3f2b1a] placeholder:text-[#8a6d55]"
                }`}
              />
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          {!usersQuery.isLoading && !usersQuery.isError && (
            <p className={`mb-3 text-xs font-medium ${textMutedTone}`}>
              Showing {filteredUsers.length} of {totalUsers} users
            </p>
          )}

          {usersQuery.isLoading && (
            <LoadingState label="Loading users..." compact />
          )}

          {usersQuery.isError && (
            <p
              className={`rounded-lg border p-3 text-sm ${isDark ? "border-[#8b3a37] bg-[#311615] text-[#ffcbc8]" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              Failed to load users.
            </p>
          )}

          {!usersQuery.isLoading &&
            !usersQuery.isError &&
            filteredUsers.length === 0 && (
              <p
                className={`rounded-lg border p-3 text-sm ${isDark ? "border-[#2f4159] bg-[#101b2b] text-[#9cb2c9]" : "border-stone-200 bg-stone-50 text-stone-600"}`}
              >
                No users match your current search.
              </p>
            )}

          {!usersQuery.isLoading &&
            !usersQuery.isError &&
            filteredUsers.length > 0 && (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isAdminRole = user.role === "hoa_admin";
                  const isBusy =
                    promoteUserMutation.isPending ||
                    deleteUserMutation.isPending;

                  return (
                    <div
                      key={user.email}
                      className={`rounded-xl border p-4 transition-colors ${rowHoverTone} ${isDark ? "border-[#2f4159] bg-[#101a2a]" : "border-[#ead4bb] bg-[#fffdfa]"}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p
                            className={`truncate font-semibold ${isDark ? "text-[#f3f9ff]" : "text-[#352214]"}`}
                          >
                            {user.displayName}
                          </p>
                          <p className={`truncate text-sm ${textMutedTone}`}>
                            @{user.username}
                          </p>
                          <p className={`truncate text-sm ${textMutedTone}`}>
                            {user.email}
                          </p>
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          <span
                            className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold sm:w-auto ${
                              isAdminRole
                                ? isDark
                                  ? "bg-[#3d3215] text-[#ffe8ab]"
                                  : "bg-amber-100 text-amber-800"
                                : isDark
                                  ? "bg-[#202f45] text-[#c0d2e6]"
                                  : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {user.isMasterAdmin
                              ? "Master Admin"
                              : isAdminRole
                                ? "Admin"
                                : "Resident"}
                          </span>

                          {!isAdminRole && (
                            <button
                              type="button"
                              onClick={() => handlePromote(user.email)}
                              disabled={isBusy}
                              className={`inline-flex min-h-11 w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 sm:w-auto ${
                                isDark
                                  ? "bg-[#1f815c] text-[#eafff6] hover:bg-[#1a6f4f]"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {promoteUserMutation.isPending
                                ? "Updating..."
                                : "Promote to Admin"}
                            </button>
                          )}

                          {user.canDelete ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUser(user.email, user.displayName)
                              }
                              disabled={isBusy}
                              className={`inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 sm:w-auto ${
                                isDark
                                  ? "bg-[#8b3a37] text-[#ffe5e3] hover:bg-[#7a2f2d]"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              <UserX className="h-4 w-4" />
                              {deleteUserMutation.isPending
                                ? "Deleting..."
                                : "Delete User"}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex min-h-8 items-center rounded-md px-3 py-1 text-xs font-medium sm:bg-transparent sm:px-0 sm:py-0 ${isDark ? "bg-[#202f45] text-[#9cb2c9]" : "bg-stone-100 text-stone-500"}`}
                            >
                              Delete locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
