import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import {
  useAdminUsers,
  useDeleteUser,
  usePromoteUserToAdmin,
} from "../../hooks/useAdminUsers";
import { toApiError } from "../auth/authApiError";

export function AdminUserManagementPage() {
  const { authStore } = useStore();
  const [userSearch, setUserSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const usersQuery = useAdminUsers();
  const promoteUserMutation = usePromoteUserToAdmin();
  const deleteUserMutation = useDeleteUser();

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) =>
      [user.displayName, user.username, user.email]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [userSearch, usersQuery.data]);

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-stone-900">
            User Management
          </h1>
          <p className="mt-2 text-stone-600">
            Promote residents to admin and manage account deletion rules.
          </p>
        </div>

        <input
          type="search"
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
          placeholder="Search by name, username, or email"
          className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-80"
        />
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

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {usersQuery.isLoading && (
          <p className="text-sm text-stone-500">Loading users...</p>
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
              No users match your search.
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
                    className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-900">
                        {user.displayName}
                      </p>
                      <p className="truncate text-sm text-stone-500">
                        @{user.username} • {user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                          className="inline-flex min-h-11 items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleteUserMutation.isPending
                            ? "Deleting..."
                            : "Delete User"}
                        </button>
                      ) : (
                        <span className="text-xs text-stone-500">
                          Delete locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
}
