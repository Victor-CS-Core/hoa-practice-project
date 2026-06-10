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
  const publishedCount = events.filter((e) => e.status === "Published").length;
  const cancelledCount = events.filter((e) => e.status === "Cancelled").length;

  return (
    <section className="animate-fade-up animate-delay-300 overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm">
      <div className="border-b border-amber-200 bg-amber-100/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-amber-700" />
            <h2 className="font-heading text-xl font-bold text-amber-900">
              Admin Quick Actions
            </h2>
          </div>
          <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
            Admin
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-amber-700">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {publishedCount} published
          </span>
          {cancelledCount > 0 && (
            <span>{cancelledCount} cancelled</span>
          )}
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <ActionCard
          to="/events/create"
          icon={<Plus className="h-5 w-5" />}
          title="Create Event"
          description="Add a new community event"
          accent="border-amber-200 bg-white hover:border-amber-300"
        />
        <ActionCard
          to="/admin/events"
          icon={<LayoutDashboard className="h-5 w-5" />}
          title="Manage Events"
          description="Edit, cancel, or delete events"
          accent="border-amber-200 bg-white hover:border-amber-300"
        />
        <ActionCard
          to="/admin/attendees"
          icon={<Users className="h-5 w-5" />}
          title="Manage Attendees"
          description="View attendance across events"
          accent="border-amber-200 bg-white hover:border-amber-300"
        />
      </div>
    </section>
  );
}
