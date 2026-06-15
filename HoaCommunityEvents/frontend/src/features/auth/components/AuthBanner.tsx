import { AlertCircle, Info } from "lucide-react";
import { useTheme } from "../../../app/theme/theme-context";

export function AuthBanner({
  type,
  message,
}: {
  type: "error" | "warning" | "info";
  message: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!message) return null;

  const styles = isDark
    ? {
        error: "border-[#93312a] bg-[#311613] text-[#ffd7d1]",
        warning: "border-[#89611f] bg-[#2f240f] text-[#ffe7b2]",
        info: "border-[#2e6f5f] bg-[#122a25] text-[#c8f7e8]",
      }
    : {
        error: "border-[#d4634a] bg-[#fff0ec] text-[#8f311f]",
        warning: "border-[#d2a142] bg-[#fff6df] text-[#82580f]",
        info: "border-[#93a48f] bg-[#edf4ea] text-[#32512f]",
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
