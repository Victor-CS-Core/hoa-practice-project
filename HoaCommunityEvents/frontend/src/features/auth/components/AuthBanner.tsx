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
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-stone-200 bg-stone-100 text-stone-800",
  };

  const Icon = type === "info" ? Info : AlertCircle;

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${styles[type]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
