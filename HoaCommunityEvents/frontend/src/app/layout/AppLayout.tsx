import { useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  CalendarDays,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Moon,
  Sun,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useStore } from "../stores/store";
import { useState } from "react";
import { useTheme } from "../theme/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/design-system/ui/dropdown-menu";
import { Tooltip } from "../../components/ui/tooltip";
import { BRAND } from "../branding";

function roleToLabel(role?: string) {
  if (role === "hoa_admin") return "Admin";
  if (role === "resident") return "Resident";
  return "Guest";
}

function getInitials(displayName?: string, username?: string) {
  const source = (displayName ?? username ?? "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? "U"}${parts[1][0] ?? ""}`.toUpperCase();
}

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: typeof Home;
};

export const AppLayout = observer(function AppLayout() {
  const { authStore } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { themePreference, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    void authStore.getCurrentUser();
  }, [authStore]);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  const baseLinks: NavItem[] = [
    { to: "/", label: "Home", end: true, icon: Home },
    { to: "/events", label: "Events", icon: CalendarDays },
  ];

  const userLinks: NavItem[] =
    authStore.isLoggedIn && authStore.user
      ? [
          {
            to: `/profile/${authStore.user.username}`,
            label: "My Profile",
            icon: UserCircle,
          },
        ]
      : [];

  const adminLinks: NavItem[] = authStore.isAdmin
    ? [
        {
          to: "/admin/events",
          label: "Event Management",
          icon: LayoutDashboard,
        },
        {
          to: "/admin/users",
          label: "User Management",
          icon: Users,
        },
        {
          to: "/admin/design-system",
          label: "Design System",
          icon: Shield,
        },
      ]
    : [];

  const desktopLinks = baseLinks;

  const showTopNavigation = authStore.isLoggedIn;
  const user = authStore.user;

  const closeMobile = () => setMobileOpen(false);
  const isDark = resolvedTheme === "dark";

  const handleLogout = () => {
    authStore.logout();
    setMobileOpen(false);
    void navigate("/login", { replace: true });
  };

  const headerTone = isDark
    ? "border-white/10 bg-black/95 text-slate-100"
    : "border-hairline bg-surface/95 text-ink-display";
  const navTone = isDark
    ? "text-slate-100 hover:bg-white/10 hover:text-white"
    : "text-ink-body hover:bg-surface-muted hover:text-ink-display";
  const activeTone = "bg-accent text-white";
  const brandTextTone = isDark ? "text-white" : "text-ink-display";
  const controlTone = isDark
    ? "border-white/20 bg-white/10 text-slate-100 hover:bg-white/20"
    : "border-hairline bg-surface text-ink-display hover:bg-surface-muted";
  const mobilePanelTone = isDark
    ? "border-white/10 bg-black/95"
    : "border-hairline bg-surface";
  const mobileSectionTone = isDark ? "border-white/10" : "border-hairline";
  const mobileSectionLabelTone = isDark ? "text-slate-300" : "text-ink-muted";
  const mobileToggleTone = isDark
    ? "text-slate-100 hover:bg-white/10"
    : "text-ink-display hover:bg-surface-muted";

  const initials = getInitials(user?.displayName, user?.username);

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
      isActive ? activeTone : navTone,
    ].join(" ");

  return (
    <div className="app-shell-background min-h-screen font-body text-ink-body">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-page"
      >
        Skip to main content
      </a>

      {showTopNavigation && (
        <header
          className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${headerTone}`}
        >
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link
                to="/"
                className="group flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-heading font-bold text-page">
                  {BRAND.acronym}
                </div>
                <span
                  className={`hidden font-heading text-lg font-semibold sm:block ${brandTextTone}`}
                >
                  {BRAND.appName}
                </span>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                {desktopLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      [
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200",
                        isActive ? activeTone : navTone,
                      ].join(" ")
                    }
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                ))}

                {authStore.isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200 ${navTone}`}
                      >
                        <Shield className="h-4 w-4" />
                        {BRAND.adminLabel}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-52 animate-fade-in"
                    >
                      <DropdownMenuLabel>
                        {BRAND.adminToolsLabel}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => void navigate("/admin/events")}
                        className="gap-2"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Event Management
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void navigate("/admin/users")}
                        className="gap-2"
                      >
                        <Users className="h-4 w-4" /> User Management
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void navigate("/admin/design-system")}
                        className="gap-2"
                      >
                        <Shield className="h-4 w-4" /> Design System
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Tooltip
                content={`Theme: ${themePreference} (${resolvedTheme})`}
                side="bottom"
              >
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200 ${controlTone}`}
                  aria-label="Toggle header theme"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-2.5 py-1.5 transition-colors duration-200 ${controlTone}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-bold text-page">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.displayName ?? user.username ?? "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="max-w-36 text-left">
                      <span className="block truncate text-sm font-semibold">
                        {user?.displayName ?? user?.username ?? "User"}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {roleToLabel(user?.role)}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 animate-fade-in"
                >
                  <DropdownMenuLabel>
                    <div className="font-semibold text-ink-display">
                      {user?.displayName ?? user?.username}
                    </div>
                    <div className="text-xs font-normal text-ink-muted">
                      @{user?.username}
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-signal-faded px-2 py-0.5 text-[11px] font-semibold text-signal-display">
                      {roleToLabel(user?.role)}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      void navigate(`/profile/${user?.username ?? ""}`)
                    }
                    className="gap-2"
                  >
                    <UserCircle className="h-4 w-4" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-danger-display hover:bg-danger-faded"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={`rounded-md p-2 md:hidden ${mobileToggleTone}`}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileOpen && (
            <div className={`border-t px-4 py-4 md:hidden ${mobilePanelTone}`}>
              <nav className="flex flex-col gap-4">
                <div className="space-y-2">
                  {baseLinks.map((link) => (
                    <NavLink
                      key={`mobile-${link.to}`}
                      to={link.to}
                      end={link.end}
                      onClick={closeMobile}
                      className={mobileLinkClass}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </NavLink>
                  ))}
                </div>

                {authStore.isAdmin && (
                  <div
                    className={`space-y-2 border-t pt-3 ${mobileSectionTone}`}
                  >
                    <p
                      className={`px-3 text-xs font-semibold tracking-wide ${mobileSectionLabelTone}`}
                    >
                      ADMIN TOOLS
                    </p>
                    {adminLinks.map((link) => (
                      <NavLink
                        key={`mobile-admin-${link.to}`}
                        to={link.to}
                        onClick={closeMobile}
                        className={mobileLinkClass}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                )}

                <div className={`space-y-2 border-t pt-3 ${mobileSectionTone}`}>
                  <p
                    className={`px-3 text-xs font-semibold tracking-wide ${mobileSectionLabelTone}`}
                  >
                    ACCOUNT
                  </p>

                  {userLinks.map((link) => (
                    <NavLink
                      key={`mobile-user-${link.to}`}
                      to={link.to}
                      end={link.end}
                      onClick={closeMobile}
                      className={mobileLinkClass}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </NavLink>
                  ))}

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all duration-200 ${navTone}`}
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    Toggle Theme
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger-display transition-all duration-200 hover:bg-danger-faded"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </nav>
            </div>
          )}
        </header>
      )}

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 lg:px-8"
      >
        <Outlet />
      </main>
    </div>
  );
});
