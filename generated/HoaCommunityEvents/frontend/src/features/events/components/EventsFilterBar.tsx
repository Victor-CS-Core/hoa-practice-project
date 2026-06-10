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
    <div className="mb-8 flex flex-col gap-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:flex-row">
      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-stone-500">
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
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentCategory === category
                  ? "bg-emerald-600 font-medium text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden w-px bg-stone-200 md:block" />

      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-stone-500">
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
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                currentStatus === status
                  ? "bg-emerald-600 font-medium text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
