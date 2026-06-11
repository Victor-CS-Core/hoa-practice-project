interface LoadingStateProps {
  label?: string;
  hint?: string;
  compact?: boolean;
}

export function LoadingState({
  label = "Loading...",
  hint,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`rounded-xl border theme-border-surface theme-bg-surface p-6 text-center ${
        compact ? "" : "shadow-sm"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-50/70">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
      <p className="font-medium theme-text-primary">{label}</p>
      {hint && <p className="mt-1 text-sm theme-text-muted">{hint}</p>}
    </div>
  );
}
