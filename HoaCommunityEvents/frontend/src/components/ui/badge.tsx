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
        variant === "default" && "bg-(--ui-accent) text-(--ui-accent-ink)",
        variant === "secondary" &&
          "bg-(--ui-highlight-soft) text-(--text-primary)",
        variant === "outline" &&
          "border border-(--surface-border) bg-(--surface) text-(--text-muted)",
        className,
      )}
      {...props}
    />
  );
}
