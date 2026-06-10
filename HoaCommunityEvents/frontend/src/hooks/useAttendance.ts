import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Attendance } from '../app/api/agent';

export function useJoinEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => Attendance.join(eventId),
    onSuccess: (_, eventId) => {
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => Attendance.leave(eventId),
    onSuccess: (_, eventId) => {
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useAttendees(eventId?: string, enabled = false) {
  return useQuery({
    queryKey: ['attendees', eventId],
    queryFn: () => Attendance.list(eventId as string),
    enabled: !!eventId && enabled,
  });
}
