import { useEffect } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';

function getHubUrl() {
  const apiUrl = import.meta.env.VITE_API_URL as string;
  if (!apiUrl) return 'http://localhost:5000/hubs/events';
  const base = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  return `${base}/hubs/events`;
}

export function useSignalR(eventId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const token = localStorage.getItem('jwt') ?? '';

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveAttendeeCount', async (incomingEventId: string) => {
      if (incomingEventId?.toString() !== eventId.toString()) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['attendees', eventId] });
    });

    let active = true;

    void (async () => {
      try {
        await connection.start();
        if (active) {
          await connection.invoke('JoinEventGroup', eventId);
        }
      } catch {
        // Keep silent in MVP; query invalidation still happens on normal actions.
      }
    })();

    return () => {
      active = false;
      void (async () => {
        try {
          await connection.invoke('LeaveEventGroup', eventId);
        } catch {
          // ignore
        }
        await connection.stop();
      })();
    };
  }, [eventId, queryClient]);
}
