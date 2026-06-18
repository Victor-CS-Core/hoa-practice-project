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
      className={`rounded-xl border border-hairline bg-page p-6 text-center ${
        compact ? "" : "shadow-sm"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-accent/25 bg-accent-faded">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
      <p className="font-medium text-ink-display">{label}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
