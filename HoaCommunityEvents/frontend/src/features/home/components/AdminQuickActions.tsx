import {
  Plus,
  LayoutDashboard,
  Users,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-signal-faded text-signal-display transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold text-ink-display">
          {title}
        </p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-signal-display" />
    </Link>
  );
}

export function AdminQuickActions({ events }: AdminQuickActionsProps) {
  const publishedCount = events.filter((e) => e.status === "Published").length;
  const cancelledCount = events.filter((e) => e.status === "Cancelled").length;

  const actionAccent =
    "border-signal/35 bg-page hover:border-signal-display hover:bg-signal-faded";

  return (
    <section className="animate-fade-up animate-delay-300 h-full overflow-hidden rounded-xl border border-signal/35 bg-signal-faded/40 shadow-sm">
      <div className="border-b border-signal/35 bg-signal-faded px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-signal-display" />
            <h2 className="font-heading text-xl font-bold text-ink-display">
              Admin Quick Actions
            </h2>
          </div>
          <span className="rounded-full bg-signal px-3 py-1 text-xs font-semibold text-page">
            Admin
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-signal-display">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {publishedCount} published
          </span>
          {cancelledCount > 0 && <span>{cancelledCount} cancelled</span>}
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <ActionCard
          to="/admin/events?create=1"
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
