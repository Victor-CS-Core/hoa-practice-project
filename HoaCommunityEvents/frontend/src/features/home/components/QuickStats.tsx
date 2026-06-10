import { Calendar, UserCheck, Users, LayoutGrid } from "lucide-react";
import type { HoaEvent } from "../../../types/event";

interface QuickStatsProps {
  events: HoaEvent[];
  isLoading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  delay: string;
}

function StatCard({ icon, value, label, color, delay }: StatCardProps) {
  return (
    <div
      className={`animate-fade-up ${delay} group flex items-center gap-4 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold text-stone-900">
          {value}
        </p>
        <p className="text-sm text-stone-500">{label}</p>
      </div>
    </div>
  );
}

export function QuickStats({ events, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-stone-200 bg-stone-100"
          />
        ))}
      </div>
    );
  }

  const publishedEvents = events.filter((e) => e.status === "Published");
  const myRsvps = events.filter((e) => e.isCurrentUserAttending);
  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0);
  const categories = new Set(events.map((e) => e.category));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Calendar className="h-6 w-6 text-emerald-600" />}
        value={publishedEvents.length}
        label="Upcoming Events"
        color="bg-emerald-50"
        delay="animate-delay-100"
      />
      <StatCard
        icon={<UserCheck className="h-6 w-6 text-blue-600" />}
        value={myRsvps.length}
        label="My RSVPs"
        color="bg-blue-50"
        delay="animate-delay-200"
      />
      <StatCard
        icon={<Users className="h-6 w-6 text-violet-600" />}
        value={totalAttendees}
        label="Total Attendees"
        color="bg-violet-50"
        delay="animate-delay-300"
      />
      <StatCard
        icon={<LayoutGrid className="h-6 w-6 text-amber-600" />}
        value={categories.size}
        label="Categories"
        color="bg-amber-50"
        delay="animate-delay-400"
      />
    </div>
  );
}
