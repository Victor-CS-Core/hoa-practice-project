import { useQuery } from '@tanstack/react-query';
import { Events } from '../app/api/agent';
import type { EventFilter } from '../types/event';

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
