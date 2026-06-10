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
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60",
        variant === "default" &&
          "bg-emerald-600 text-white hover:bg-emerald-700",
        variant === "outline" &&
          "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
        variant === "secondary" &&
          "bg-stone-200 text-stone-800 hover:bg-stone-300",
        variant === "ghost" &&
          "bg-transparent text-stone-700 hover:bg-stone-100",
        size === "default" && "h-11 px-4 py-2 sm:h-10",
        size === "sm" && "h-11 px-3 sm:h-8",
        size === "icon" && "h-11 w-11 sm:h-9 sm:w-9",
        className,
      )}
      {...props}
    />
  );
}
