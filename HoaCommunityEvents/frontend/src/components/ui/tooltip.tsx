import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import { cn } from "../../lib/cn";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
  contentClassName?: string;
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  contentClassName,
}: TooltipProps) {
  const tooltipId = useId();

  const childWithDescription = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby": tooltipId,
      })
    : children;

  return (
    <span className={cn("group relative inline-flex", className)}>
      <span className="inline-flex">{childWithDescription}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          contentClassName,
        )}
      >
        {content}
      </span>
    </span>
  );
}
