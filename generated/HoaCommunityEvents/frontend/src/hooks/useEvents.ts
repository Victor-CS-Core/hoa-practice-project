import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Events } from '../app/api/agent';
import type { CreateEventFormValues, EditEventFormValues, EventFilter } from '../types/event';

export function useEvents(filter: EventFilter) {
  return useQuery({
    queryKey: ['events', filter],
    queryFn: () => Events.list(filter),
  });
}

export function useEvent(id?: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => Events.detail(id as string),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateEventFormValues) => Events.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useEditEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditEventFormValues }) =>
      Events.edit(id, values),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => Events.cancel(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => Events.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
