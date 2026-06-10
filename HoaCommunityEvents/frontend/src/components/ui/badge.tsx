import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BadgeVariant = "default" | "secondary" | "outline";

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-emerald-600 text-white",
        variant === "secondary" && "bg-stone-200 text-stone-800",
        variant === "outline" &&
          "border border-stone-300 bg-white text-stone-700",
        className,
      )}
      {...props}
    />
  );
}
