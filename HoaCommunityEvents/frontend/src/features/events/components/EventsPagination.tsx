import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";

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
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-stone-200 py-6 sm:flex-row">
      <div className="text-sm text-stone-600">
        Showing <span className="font-medium text-stone-900">{startItem}</span>{" "}
        to <span className="font-medium text-stone-900">{endItem}</span> of{" "}
        <span className="font-medium text-stone-900">{totalCount}</span> events
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 border-stone-300 text-stone-700 hover:bg-stone-50 sm:h-9 sm:min-h-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="rounded-md bg-stone-100 px-3 py-1 text-sm font-medium text-stone-900">
          {page} / {totalPages || 1}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="min-h-11 border-stone-300 text-stone-700 hover:bg-stone-50 sm:h-9 sm:min-h-0"
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
