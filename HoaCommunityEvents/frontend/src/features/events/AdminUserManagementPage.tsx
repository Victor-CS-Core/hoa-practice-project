import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Shield, UserCheck, UserX } from "lucide-react";
import { useStore } from "../../app/stores/store";
import { Button } from "../../components/design-system/ui/button";
import { Input } from "../../components/design-system/ui/input";
import { BackNavigationButton } from "../../components/navigation/BackNavigationButton";
import { LoadingState } from "../../components/design-system/ui/loading-state";
import {
  useAdminUsers,
  useDeleteUser,
  usePromoteUserToAdmin,
} from "../../hooks/useAdminUsers";
import { toApiError } from "../auth/authApiError";
import { BRAND } from "../../app/branding";

export function AdminUserManagementPage() {
  const { authStore } = useStore();
  const [userSearch, setUserSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const usersQuery = useAdminUsers();
  const promoteUserMutation = usePromoteUserToAdmin();
  const deleteUserMutation = useDeleteUser();
  const allUsers = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

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

  if (!authStore.isAdmin) {
    return (
      <section className="rounded-xl border border-signal/45 bg-signal-faded p-6">
        <h2 className="font-heading text-2xl font-bold text-signal-display">
          Admin Access Required
        </h2>
        <p className="mt-2 text-signal-display">
          This page is available only to community administrators.
        </p>
        <p className="mt-4">
          <Link to="/events" className="text-signal-display underline">
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
    <section className="space-y-6 rounded-3xl bg-surface/70 p-4 sm:p-6">
      <div>
        <BackNavigationButton to="/events" label="Back to events" />
      </div>

      <div className="auth-motion-board rounded-[1.75rem] border border-hairline bg-page p-6 text-ink-body shadow-[0_30px_50px_-38px_rgba(0,0,0,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-auth-ui text-xs tracking-[0.22em] text-signal-display uppercase">
              {BRAND.adminToolsLabel}
            </p>
            <h1 className="mt-2 font-auth-display text-3xl font-semibold text-ink-display sm:text-4xl">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink-muted">
              Manage role assignments and account controls with a clear view of
              admin coverage across your community. Keep board access tightly
              governed while residents stay informed.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-hairline bg-surface p-4">
            <p className="font-auth-ui text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">
              Total Users
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-ink-display">
              {totalUsers}
            </p>
          </div>
          <div className="rounded-xl border border-signal/45 bg-signal-faded p-4">
            <p className="font-auth-ui text-xs font-semibold tracking-[0.16em] text-signal-display uppercase">
              Admins
            </p>
            <p className="mt-2 flex items-center gap-2 font-heading text-2xl font-bold text-signal-display">
              <Shield className="h-5 w-5" /> {adminUsers}
            </p>
          </div>
          <div className="rounded-xl border border-accent/45 bg-accent-faded p-4">
            <p className="font-auth-ui text-xs font-semibold tracking-[0.16em] text-accent-display uppercase">
              Residents
            </p>
            <p className="mt-2 flex items-center gap-2 font-heading text-2xl font-bold text-accent-display">
              <UserCheck className="h-5 w-5" /> {residentUsers}
            </p>
          </div>
        </div>
      </div>

      {flashMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/45 bg-accent-faded p-3 text-accent-display">
          <span>{flashMessage}</span>
          <Button
            type="button"
            variant="link"
            onClick={() => setFlashMessage(null)}
            className="h-auto p-0"
          >
            Dismiss
          </Button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-danger bg-danger-faded p-3 text-danger-display">
          <span>{actionError}</span>
          <Button
            type="button"
            variant="link"
            onClick={() => setActionError(null)}
            className="h-auto p-0"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="auth-motion-card rounded-2xl border border-hairline bg-page shadow-[0_22px_45px_-34px_rgba(0,0,0,0.65)]">
        <div className="border-b border-hairline px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-auth-display text-2xl font-semibold text-ink-display">
                Accounts Directory
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Search by display name, username, or email and take role
                actions.
              </p>
            </div>

            <label className="relative block w-full sm:w-90">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                type="search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users..."
                className="min-h-11 w-full pl-10 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          {!usersQuery.isLoading && !usersQuery.isError && (
            <p className="mb-3 text-xs font-medium text-ink-muted">
              Showing {filteredUsers.length} of {totalUsers} users
            </p>
          )}

          {usersQuery.isLoading && (
            <LoadingState label="Loading users..." compact />
          )}

          {usersQuery.isError && (
            <p className="rounded-lg border border-danger bg-danger-faded p-3 text-sm text-danger-display">
              Failed to load users.
            </p>
          )}

          {!usersQuery.isLoading &&
            !usersQuery.isError &&
            filteredUsers.length === 0 && (
              <p className="rounded-lg border border-hairline bg-surface p-3 text-sm text-ink-muted">
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
                      className="rounded-xl border border-hairline bg-page p-4 transition-colors hover:bg-surface"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-display">
                            {user.displayName}
                          </p>
                          <p className="truncate text-sm text-ink-muted">
                            @{user.username}
                          </p>
                          <p className="truncate text-sm text-ink-muted">
                            {user.email}
                          </p>
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          <span
                            className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold sm:w-auto ${
                              isAdminRole
                                ? "bg-signal-faded text-signal-display"
                                : "bg-surface text-ink-body"
                            }`}
                          >
                            {user.isMasterAdmin
                              ? "Master Admin"
                              : isAdminRole
                                ? "Admin"
                                : "Resident"}
                          </span>

                          {!isAdminRole && (
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => handlePromote(user.email)}
                              disabled={isBusy}
                              className="min-h-11 w-full sm:w-auto"
                            >
                              {promoteUserMutation.isPending
                                ? "Updating..."
                                : "Promote to Admin"}
                            </Button>
                          )}

                          {user.canDelete ? (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() =>
                                handleDeleteUser(user.email, user.displayName)
                              }
                              disabled={isBusy}
                              className="min-h-11 w-full gap-1 sm:w-auto"
                            >
                              <UserX className="h-4 w-4" />
                              {deleteUserMutation.isPending
                                ? "Deleting..."
                                : "Delete User"}
                            </Button>
                          ) : (
                            <span className="inline-flex min-h-8 items-center rounded-md bg-surface px-3 py-1 text-xs font-medium text-ink-muted sm:bg-transparent sm:px-0 sm:py-0">
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
