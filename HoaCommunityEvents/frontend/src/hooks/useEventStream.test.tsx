import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEventStream } from "./useEventStream";

type Listener = EventListenerOrEventListenerObject;

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;

  readonly addEventListener = vi.fn((type: string, listener: Listener) => {
    const listeners = this.listeners.get(type) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  });

  readonly removeEventListener = vi.fn((type: string, listener: Listener) => {
    this.listeners.get(type)?.delete(listener);
  });

  readonly close = vi.fn();
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  emit(type: string, data?: string) {
    const event = data === undefined ? new Event(type) : new MessageEvent(type, { data });

    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    }
  }
}

const eventId = "event-123";
const queryKeys = [
  ["event", eventId],
  ["events"],
  ["attendees", eventId],
] as const;

function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  for (const key of queryKeys) {
    queryClient.setQueryData(key, { cached: true });
  }
  queryClient.setQueryData(["event", "another-event"], { cached: true });

  return queryClient;
}

function createWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function expectOnlyEventQueriesInvalidated(queryClient: QueryClient) {
  for (const key of queryKeys) {
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  }
  expect(queryClient.getQueryState(["event", "another-event"])?.isInvalidated).toBe(
    false,
  );
}

describe("useEventStream", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the path-scoped SSE endpoint and only responds to attendance changes", async () => {
    const queryClient = createQueryClient();
    renderHook(() => useEventStream(eventId), {
      wrapper: createWrapper(queryClient),
    });

    const stream = MockEventSource.instances[0];
    expect(stream.url).toBe("/api/events/event-123/stream");

    stream.emit("another-event", JSON.stringify({ eventId }));
    for (const key of queryKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }

    stream.emit("attendance-changed", JSON.stringify({ eventId }));
    await waitFor(() => expectOnlyEventQueriesInvalidated(queryClient));
  });

  it("does not refetch on its initial open but invalidates after a reconnect", async () => {
    const queryClient = createQueryClient();
    renderHook(() => useEventStream(eventId), {
      wrapper: createWrapper(queryClient),
    });

    const stream = MockEventSource.instances[0];
    stream.emit("open");
    for (const key of queryKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }

    stream.emit("open");
    await waitFor(() => expectOnlyEventQueriesInvalidated(queryClient));
  });

  it("closes the old stream once and ignores it when the event changes", async () => {
    const queryClient = createQueryClient();
    const { rerender, unmount } = renderHook(({ id }) => useEventStream(id), {
      initialProps: { id: eventId },
      wrapper: createWrapper(queryClient),
    });

    const firstStream = MockEventSource.instances[0];
    rerender({ id: "event-456" });

    const secondStream = MockEventSource.instances[1];
    queryClient.setQueryData(["event", "event-456"], { cached: true });
    queryClient.setQueryData(["attendees", "event-456"], { cached: true });
    expect(firstStream.close).toHaveBeenCalledTimes(1);
    expect(firstStream.removeEventListener).toHaveBeenCalledWith(
      "attendance-changed",
      expect.any(Function),
    );
    expect(firstStream.removeEventListener).toHaveBeenCalledWith(
      "open",
      expect.any(Function),
    );
    firstStream.emit("attendance-changed", JSON.stringify({ eventId }));
    for (const key of queryKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }

    secondStream.emit("attendance-changed", JSON.stringify({ eventId: "event-456" }));
    await waitFor(() => {
      expect(queryClient.getQueryState(["event", "event-456"])?.isInvalidated).toBe(
        true,
      );
      expect(queryClient.getQueryState(["events"])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(["attendees", "event-456"])?.isInvalidated).toBe(
        true,
      );
    });

    unmount();
    expect(secondStream.close).toHaveBeenCalledTimes(1);
    expect(secondStream.removeEventListener).toHaveBeenCalledWith(
      "attendance-changed",
      expect.any(Function),
    );
    expect(secondStream.removeEventListener).toHaveBeenCalledWith(
      "open",
      expect.any(Function),
    );
  });
});
