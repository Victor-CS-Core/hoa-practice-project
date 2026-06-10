import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Menu, X } from "lucide-react";
import { useStore } from "../stores/store";
import { useState } from "react";

function navClass(isActive: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-emerald-100 text-emerald-800"
      : "text-stone-600 hover:bg-stone-100 hover:text-emerald-700",
  ].join(" ");
}

function roleToLabel(role?: string) {
  if (role === "hoa_admin") return "Admin";
  if (role === "resident") return "Resident";
  return "Guest";
}

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

export const AppLayout = observer(function AppLayout() {
  const { authStore } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void authStore.getCurrentUser();
  }, [authStore]);

  const baseLinks: NavItem[] = [
    { to: "/", label: "Home", end: true },
    { to: "/events", label: "Events" },
    { to: "/implementation", label: "Implementation Status" },
  ];

  const userLinks: NavItem[] =
    authStore.isLoggedIn && authStore.user
      ? [{ to: `/profile/${authStore.user.username}`, label: "My Profile" }]
      : [];

  const adminLinks: NavItem[] = authStore.isAdmin
    ? [
        { to: "/admin/events", label: "Admin Dashboard" },
        { to: "/events/create", label: "Quick Create" },
        { to: "/admin/attendees", label: "Admin Attendees" },
      ]
    : [];

  const links = [...baseLinks, ...userLinks, ...adminLinks];
  const showTopNavigation = authStore.isLoggedIn;

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    authStore.logout();
    setMobileOpen(false);
    void navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen font-body text-stone-900">
      {showTopNavigation && (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-sm font-heading font-bold text-white">
                  HOA
                </div>
                <span className="hidden font-heading text-lg font-semibold text-emerald-900 sm:block">
                  Community Events
                </span>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => navClass(isActive)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {roleToLabel(authStore.user?.role)}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
              >
                Logout
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-md p-2 text-stone-600 hover:bg-stone-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileOpen && (
            <div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden">
              <nav className="flex flex-col gap-2">
                {links.map((link) => (
                  <NavLink
                    key={`mobile-${link.to}`}
                    to={link.to}
                    end={link.end}
                    onClick={closeMobile}
                    className={({ isActive }) => navClass(isActive)}
                  >
                    {link.label}
                  </NavLink>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full px-3 py-1.5 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  Logout
                </button>
              </nav>
            </div>
          )}
        </header>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
});
