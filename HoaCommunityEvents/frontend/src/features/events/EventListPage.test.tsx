import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { EventListPage } from "./EventListPage";
import type { HoaEvent, PagedResult } from "../../types/event";

const mockUseEvents = vi.fn();
const mockUseJoinEvent = vi.fn();
const mockUseLeaveEvent = vi.fn();
const mockUseStore = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../hooks/useEvents", () => ({
  useEvents: (filter: unknown) => mockUseEvents(filter),
}));

vi.mock("../../hooks/useAttendance", () => ({
  useJoinEvent: () => mockUseJoinEvent(),
  useLeaveEvent: () => mockUseLeaveEvent(),
}));

vi.mock("../../app/stores/store", () => ({
  useStore: () => mockUseStore(),
}));

vi.mock("../../app/theme/theme-context", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeEvent(overrides: Partial<HoaEvent> = {}): HoaEvent {
  return {
    id: "evt-1",
    title: "Community Cleanup",
    description: "Bring gloves and bags",
    category: "Community Cleanup",
    locationWithinCommunity: "Playground",
    startDate: "2026-07-08T10:00:00.000Z",
    endDate: "2026-07-08T12:00:00.000Z",
    maxAttendees: 100,
    imageUrl: null,
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    hostUserId: "host-1",
    hostDisplayName: "HOA Team",
    status: "Published",
    attendeeCount: 22,
    isCurrentUserAttending: false,
    ...overrides,
  };
}

function makeFeed(items: HoaEvent[]): PagedResult<HoaEvent> {
  return {
    items,
    totalCount: items.length,
    page: 1,
    pageSize: 9,
    totalPages: 1,
  };
}

function setupAuth(isAdmin: boolean) {
  mockUseStore.mockReturnValue({
    authStore: {
      isAdmin,
      isLoggedIn: true,
      user: {
        role: isAdmin ? "hoa_admin" : "resident",
      },
    },
  });
}

describe("EventListPage", () => {
  it("shows loading state", () => {
    setupAuth(false);
    mockUseJoinEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseLeaveEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <MemoryRouter>
        <EventListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    setupAuth(false);
    mockUseJoinEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseLeaveEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <MemoryRouter>
        <EventListPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /Failed to load events\. Please refresh and try again\./i,
      ),
    ).toBeInTheDocument();
  });

  it("shows filtered empty-state message", () => {
    setupAuth(false);
    mockUseJoinEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseLeaveEvent.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseEvents.mockReturnValue({
      data: makeFeed([]),
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter initialEntries={["/events?status=Published"]}>
        <EventListPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/No events match your current filters\./i),
    ).toBeInTheDocument();
  });

  it("renders events and supports joining", async () => {
    setupAuth(false);
    const joinMutateAsync = vi.fn().mockResolvedValue(undefined);
    const leaveMutateAsync = vi.fn().mockResolvedValue(undefined);

    mockUseJoinEvent.mockReturnValue({ mutateAsync: joinMutateAsync });
    mockUseLeaveEvent.mockReturnValue({ mutateAsync: leaveMutateAsync });
    mockUseEvents.mockReturnValue({
      data: makeFeed([makeEvent()]),
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <EventListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Bring gloves and bags")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /join event/i }));

    expect(joinMutateAsync).toHaveBeenCalledWith("evt-1");
    expect(leaveMutateAsync).not.toHaveBeenCalled();
  });
});
