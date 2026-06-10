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
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
        variant === "default" && "bg-emerald-600 text-white hover:bg-emerald-700",
        variant === "outline" && "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
        variant === "secondary" && "bg-stone-200 text-stone-800 hover:bg-stone-300",
        variant === "ghost" && "bg-transparent text-stone-700 hover:bg-stone-100",
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-8 px-3",
        size === "icon" && "h-9 w-9",
        className,
      )}
      {...props}
    />
  );
}
