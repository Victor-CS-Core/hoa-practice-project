import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "../../../components/design-system/ui/button";

interface AdminConfirmModalProps {
  action: "cancel" | "delete";
  isSubmitting: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function AdminConfirmModal({
  action,
  isSubmitting,
  onConfirm,
  onDismiss,
}: AdminConfirmModalProps) {
  const isDelete = action === "delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-display/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-hairline bg-page shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-4">
            <div
              className={`shrink-0 rounded-full p-3 ${isDelete ? "bg-danger-faded text-danger-display" : "bg-signal-faded text-signal-display"}`}
            >
              {isDelete ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-ink-display">
                {isDelete ? "Delete Event" : "Cancel Event"}
              </h3>
            </div>
          </div>

          <div className="pl-13 text-sm text-ink-muted">
            {isDelete ? (
              <p>
                Are you sure you want to permanently delete this event? This
                action cannot be undone and all attendee records will be lost.
              </p>
            ) : (
              <p>
                Are you sure you want to cancel this event? It will remain
                visible but marked cancelled, and joining will be disabled.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-hairline bg-surface px-6 py-4">
          <Button
            variant="secondary"
            onClick={onDismiss}
            disabled={isSubmitting}
          >
            Keep Event
          </Button>
          <Button
            variant={isDelete ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Processing..."
              : isDelete
                ? "Yes, Delete"
                : "Yes, Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
