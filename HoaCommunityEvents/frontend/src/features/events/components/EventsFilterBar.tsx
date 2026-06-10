import type { EventFilter } from "../../../types/event";

interface EventsFilterBarProps {
  filter: EventFilter;
  onFilterChange: (newFilter: EventFilter) => void;
}

const CATEGORIES = ["All", "Board Meeting", "Community Cleanup", "Pool Event"];
const STATUSES = ["All", "Published", "Cancelled"];

export function EventsFilterBar({
  filter,
  onFilterChange,
}: EventsFilterBarProps) {
  const currentCategory = filter.category || "All";
  const currentStatus = filter.status || "All";

  return (
    <div className="mb-8 flex flex-col gap-6 rounded-xl border theme-border-surface theme-bg-surface p-4 shadow-sm md:flex-row">
      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider theme-text-muted">
          Category
        </h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filter,
                  category: category === "All" ? undefined : category,
                  page: 1,
                })
              }
              className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentCategory === category
                  ? "bg-emerald-600 font-medium text-white shadow-sm"
                  : "theme-bg-surface-muted theme-text-muted hover:brightness-95"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden w-px theme-bg-surface-border md:block" />

      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider theme-text-muted">
          Status
        </h4>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filter,
                  status: status === "All" ? undefined : status,
                  page: 1,
                })
              }
              className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentStatus === status
                  ? "bg-emerald-600 font-medium text-white shadow-sm"
                  : "theme-bg-surface-muted theme-text-muted hover:brightness-95"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
