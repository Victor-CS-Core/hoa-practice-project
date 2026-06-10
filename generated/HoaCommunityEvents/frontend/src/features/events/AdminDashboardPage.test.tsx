import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboardPage } from "./AdminDashboardPage";
import type { HoaEvent, PagedResult } from "../../types/event";

const mockUseStore = vi.fn();
const mockUseEvents = vi.fn();
const mockUseCreateEvent = vi.fn();
const mockUseEditEvent = vi.fn();
const mockUseCancelEvent = vi.fn();
const mockUseDeleteEvent = vi.fn();
const mockUseAttendees = vi.fn();

vi.mock("../../app/stores/store", () => ({
  useStore: () => mockUseStore(),
}));

vi.mock("../../hooks/useEvents", () => ({
  useEvents: (filter: unknown) => mockUseEvents(filter),
  useCreateEvent: () => mockUseCreateEvent(),
  useEditEvent: () => mockUseEditEvent(),
  useCancelEvent: () => mockUseCancelEvent(),
  useDeleteEvent: () => mockUseDeleteEvent(),
}));

vi.mock("../../hooks/useAttendance", () => ({
  useAttendees: (eventId?: string, enabled?: boolean) =>
    mockUseAttendees(eventId, enabled),
}));

function makeEvent(overrides: Partial<HoaEvent> = {}): HoaEvent {
  return {
    id: "evt-1",
    title: "Board Meeting",
    description: "Monthly board updates",
    category: "Board Meeting",
    locationWithinCommunity: "Clubhouse",
    startDate: "2026-07-10T18:00:00.000Z",
    endDate: "2026-07-10T19:00:00.000Z",
    maxAttendees: 40,
    imageUrl: null,
    hostUserId: "host-1",
    hostDisplayName: "HOA Board",
    status: "Published",
    attendeeCount: 12,
    isCurrentUserAttending: false,
    ...overrides,
  };
}

function makeFeed(items: HoaEvent[]): PagedResult<HoaEvent> {
  return {
    items,
    totalCount: items.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };
}

function setupDefaults() {
  mockUseStore.mockReturnValue({
    authStore: {
      isAdmin: true,
      isLoggedIn: true,
      user: { role: "hoa_admin" },
    },
  });

  mockUseEvents.mockReturnValue({
    data: makeFeed([makeEvent()]),
    isLoading: false,
    isError: false,
  });

  mockUseCreateEvent.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  mockUseEditEvent.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  mockUseCancelEvent.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  mockUseDeleteEvent.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });

  mockUseAttendees.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });
}

describe("AdminDashboardPage", () => {
  it("blocks non-admin users", () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isAdmin: false,
        isLoggedIn: true,
        user: { role: "resident" },
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Admin Access Required/i)).toBeInTheDocument();
  });

  it("shows filtered empty state when no events match", () => {
    setupDefaults();
    mockUseEvents.mockReturnValue({
      data: makeFeed([]),
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin/events?status=Published"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/No events match your filters\./i),
    ).toBeInTheDocument();
  });

  it("shows loading and error states", () => {
    setupDefaults();
    mockUseEvents.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { rerender } = render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading events/i)).toBeInTheDocument();

    mockUseEvents.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    rerender(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Failed to load admin events list\./i),
    ).toBeInTheDocument();
  });

  it("renders filters and allows clearing active filters", async () => {
    setupDefaults();
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          "/admin/events?status=Published&category=Board%20Meeting",
        ]}
      >
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Filters active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(window.location.search).toBe("");
  });
});
