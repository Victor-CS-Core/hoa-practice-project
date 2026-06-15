import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--ui-card-radius)] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:pointer-events-none disabled:opacity-60",
        variant === "default" &&
          "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] shadow-[0_12px_24px_-18px_var(--ui-accent)] hover:bg-[var(--ui-accent-hover)]",
        variant === "outline" &&
          "border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
        variant === "secondary" &&
          "bg-[var(--ui-highlight-soft)] text-[var(--text-primary)] hover:brightness-95",
        variant === "ghost" &&
          "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
        size === "default" && "h-11 px-4 py-2 sm:h-10",
        size === "sm" && "h-11 px-3 sm:h-8",
        size === "icon" && "h-11 w-11 sm:h-9 sm:w-9",
        className,
      )}
      {...props}
    />
  );
}
