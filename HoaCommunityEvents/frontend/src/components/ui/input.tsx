import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-(--ui-card-radius) border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm text-(--text-primary) shadow-sm placeholder:text-(--text-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface) disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
