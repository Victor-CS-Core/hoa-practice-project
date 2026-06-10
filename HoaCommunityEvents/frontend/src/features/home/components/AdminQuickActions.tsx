import {
  Plus,
  LayoutDashboard,
  Users,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../app/theme/theme-context";
import type { HoaEvent } from "../../../types/event";

interface AdminQuickActionsProps {
  events: HoaEvent[];
}

interface ActionCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

function ActionCard({ to, icon, title, description, accent }: ActionCardProps) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold text-stone-900">
          {title}
        </p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-amber-600" />
    </Link>
  );
}

export function AdminQuickActions({ events }: AdminQuickActionsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const publishedCount = events.filter((e) => e.status === "Published").length;
  const cancelledCount = events.filter((e) => e.status === "Cancelled").length;

  const sectionTone = isDark
    ? "border-amber-700/40 bg-linear-to-br from-stone-900 to-stone-800/80"
    : "border-amber-200 bg-linear-to-br from-amber-50 to-orange-50/50";

  const headerTone = isDark
    ? "border-amber-700/30 bg-amber-900/25"
    : "border-amber-200 bg-amber-100/50";

  const titleTone = isDark ? "text-amber-200" : "text-amber-900";
  const statsTone = isDark ? "text-amber-300" : "text-amber-700";
  const badgeTone = isDark
    ? "bg-amber-800/60 text-amber-100"
    : "bg-amber-200 text-amber-800";
  const actionAccent = isDark
    ? "border-amber-700/40 bg-stone-900/70 hover:border-amber-500"
    : "border-amber-200 bg-white hover:border-amber-300";

  return (
    <section
      className={`animate-fade-up animate-delay-300 h-full overflow-hidden rounded-xl border-2 shadow-sm ${sectionTone}`}
    >
      <div className={`border-b px-6 py-4 ${headerTone}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className={`h-5 w-5 ${titleTone}`} />
            <h2 className={`font-heading text-xl font-bold ${titleTone}`}>
              Admin Quick Actions
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone}`}
          >
            Admin
          </span>
        </div>
        <div className={`mt-2 flex gap-4 text-sm ${statsTone}`}>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {publishedCount} published
          </span>
          {cancelledCount > 0 && <span>{cancelledCount} cancelled</span>}
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <ActionCard
          to="/events/create"
          icon={<Plus className="h-5 w-5" />}
          title="Create Event"
          description="Add a new community event"
          accent={actionAccent}
        />
        <ActionCard
          to="/admin/events"
          icon={<LayoutDashboard className="h-5 w-5" />}
          title="Manage Events"
          description="Edit, cancel, or delete events"
          accent={actionAccent}
        />
        <ActionCard
          to="/admin/users"
          icon={<Users className="h-5 w-5" />}
          title="Manage Users"
          description="Promote roles and manage accounts"
          accent={actionAccent}
        />
      </div>
    </section>
  );
}
