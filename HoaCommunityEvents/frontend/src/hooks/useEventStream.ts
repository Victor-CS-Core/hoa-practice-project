import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useEventStream(eventId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const eventSource = new EventSource(`/api/events/${eventId}/stream`);
    let hasOpened = false;

    const invalidateEventQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["attendees", eventId] });
    };

    const onAttendanceChanged = () => {
      invalidateEventQueries();
    };

    const onOpen = () => {
      if (!hasOpened) {
        hasOpened = true;
        return;
      }

      invalidateEventQueries();
    };

    eventSource.addEventListener("attendance-changed", onAttendanceChanged);
    eventSource.addEventListener("open", onOpen);

    return () => {
      eventSource.removeEventListener("attendance-changed", onAttendanceChanged);
      eventSource.removeEventListener("open", onOpen);
      eventSource.close();
    };
  }, [eventId, queryClient]);
}
