import { AlertCircle, Info } from "lucide-react";

export function AuthBanner({
  type,
  message,
}: {
  type: "error" | "warning" | "info";
  message: string;
}) {
  if (!message) return null;

  const styles = {
    error: "border-danger bg-danger-faded text-danger-display",
    warning: "border-signal bg-signal-faded text-signal-display",
    info: "border-accent bg-accent-faded text-accent-display",
  };

  const Icon = type === "info" ? Info : AlertCircle;

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${styles[type]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
