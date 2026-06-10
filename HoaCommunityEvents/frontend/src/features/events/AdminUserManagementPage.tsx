import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Shield, UserCheck, UserX } from "lucide-react";
import { useStore } from "../../app/stores/store";
import { useTheme } from "../../app/theme/theme-context";
import {
  useAdminUsers,
  useDeleteUser,
  usePromoteUserToAdmin,
} from "../../hooks/useAdminUsers";
import { toApiError } from "../auth/authApiError";

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
  const rowHoverTone = isDark ? "hover:bg-stone-800/45" : "hover:bg-stone-100";

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
  const adminUsers = allUsers.filter((user) => user.role === "hoa_admin").length;
  const residentUsers = allUsers.filter((user) => user.role !== "hoa_admin").length;

  if (!authStore.isAdmin) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-heading text-2xl font-bold text-amber-900">
          Admin Access Required
        </h2>
        <p className="mt-2 text-amber-800">
          This page is available only to HOA administrators.
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
    <section className="space-y-6">
      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          isDark
            ? "border-emerald-700/40 bg-linear-to-r from-stone-900 via-stone-900 to-emerald-950/25"
            : "border-emerald-200/70 bg-linear-to-r from-emerald-50 via-white to-emerald-50/30"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-(--text-primary)">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl text-(--text-muted)">
              Manage role assignments and account controls with a clear view of
              admin coverage across your community.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-stone-700 bg-stone-900/70"
                : "border-stone-200 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              Total Users
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-(--text-primary)">
              {totalUsers}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-amber-700/40 bg-amber-950/30"
                : "border-amber-200 bg-amber-50/70"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isDark ? "text-amber-300" : "text-amber-700"
              }`}
            >
              Admins
            </p>
            <p
              className={`mt-2 flex items-center gap-2 font-heading text-2xl font-bold ${
                isDark ? "text-amber-200" : "text-amber-900"
              }`}
            >
              <Shield className="h-5 w-5" /> {adminUsers}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-emerald-700/40 bg-emerald-950/30"
                : "border-emerald-200 bg-emerald-50/70"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isDark ? "text-emerald-300" : "text-emerald-700"
              }`}
            >
              Residents
            </p>
            <p
              className={`mt-2 flex items-center gap-2 font-heading text-2xl font-bold ${
                isDark ? "text-emerald-200" : "text-emerald-900"
              }`}
            >
              <UserCheck className="h-5 w-5" /> {residentUsers}
            </p>
          </div>
        </div>
      </div>

      {flashMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
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

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-stone-900">
                Accounts Directory
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Search by display name, username, or email and take role actions.
              </p>
            </div>

            <label className="relative block w-full sm:w-90">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users..."
                className="min-h-11 w-full rounded-md border border-stone-300 bg-white pl-10 pr-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          {!usersQuery.isLoading && !usersQuery.isError && (
            <p className="mb-3 text-xs font-medium text-stone-500">
              Showing {filteredUsers.length} of {totalUsers} users
            </p>
          )}

        {usersQuery.isLoading && (
          <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-500">
            Loading users...
          </p>
        )}

        {usersQuery.isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load users.
          </p>
        )}

        {!usersQuery.isLoading &&
          !usersQuery.isError &&
          filteredUsers.length === 0 && (
            <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
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
                  promoteUserMutation.isPending || deleteUserMutation.isPending;

                return (
                  <div
                    key={user.email}
                    className={`rounded-xl border border-stone-200 p-4 transition-colors ${rowHoverTone}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-stone-900">
                          {user.displayName}
                        </p>
                        <p className="truncate text-sm text-stone-500">
                          @{user.username}
                        </p>
                        <p className="truncate text-sm text-stone-500">{user.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isAdminRole
                              ? "bg-amber-100 text-amber-800"
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
                            className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
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
                            className="inline-flex min-h-11 items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            <UserX className="h-4 w-4" />
                            {deleteUserMutation.isPending
                              ? "Deleting..."
                              : "Delete User"}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-stone-500">
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
