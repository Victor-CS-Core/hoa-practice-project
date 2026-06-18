import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/design-system/ui/button";

interface EventsPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function EventsPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: EventsPaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-hairline py-6 sm:flex-row">
      <div className="text-sm text-ink-body">
        Showing{" "}
        <span className="font-medium text-ink-display">{startItem}</span> to{" "}
        <span className="font-medium text-ink-display">{endItem}</span> of{" "}
        <span className="font-medium text-ink-display">{totalCount}</span>{" "}
        events
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="min-h-11 sm:h-9 sm:min-h-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="rounded-md bg-surface px-3 py-1 text-sm font-medium text-ink-display border border-hairline">
          {page} / {totalPages || 1}
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="min-h-11 sm:h-9 sm:min-h-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
