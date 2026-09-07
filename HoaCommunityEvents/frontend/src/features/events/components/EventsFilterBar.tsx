import type { EventFilter } from "../../../types/event";
import {
  EVENT_CATEGORY_FILTER_OPTIONS,
  EVENT_STATUS_FILTER_OPTIONS,
} from "../eventFilterOptions";

interface EventsFilterBarProps {
  filter: EventFilter;
  onFilterChange: (newFilter: EventFilter) => void;
}

const CATEGORIES = ["All", ...EVENT_CATEGORY_FILTER_OPTIONS];
const STATUSES = ["All", ...EVENT_STATUS_FILTER_OPTIONS];

export function EventsFilterBar({
  filter,
  onFilterChange,
}: EventsFilterBarProps) {
  const currentCategory = filter.category || "All";
  const currentStatus = filter.status || "All";

  return (
    <div className="mb-8 flex flex-col gap-6 rounded-xl border border-hairline bg-page p-4 shadow-sm md:flex-row">
      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold tracking-wider text-ink-muted uppercase">
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
              className={`inline-flex min-h-11 items-center justify-center rounded-full text-sm transition-colors ${
                category === "All" ? "h-11 w-11 px-0 py-0" : "px-3 py-1.5"
              } ${
                currentCategory === category
                  ? "bg-accent font-medium text-accent-ink dark:text-[#111827] shadow-sm"
                  : "border border-hairline bg-surface text-ink-muted hover:bg-hairline/35"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden w-px bg-hairline md:block" />

      <div className="flex-1 space-y-3">
        <h4 className="font-heading text-xs font-semibold tracking-wider text-ink-muted uppercase">
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
              className={`inline-flex min-h-11 items-center justify-center rounded-full text-sm transition-colors ${
                status === "All" ? "h-11 w-11 px-0 py-0" : "px-3 py-1.5"
              } ${
                currentStatus === status
                  ? "bg-accent font-medium text-accent-ink dark:text-[#111827] shadow-sm"
                  : "border border-hairline bg-surface text-ink-muted hover:bg-hairline/35"
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
