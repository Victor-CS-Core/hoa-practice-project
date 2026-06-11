import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminEventList } from "./AdminEventList";
import type { HoaEvent, PagedResult } from "../../../types/event";

vi.mock("../../../app/theme/theme-context", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
  }),
}));

function makeEvent(overrides: Partial<HoaEvent> = {}): HoaEvent {
  return {
    id: "evt-1",
    title: "Board Meeting",
    description: "Monthly meeting",
    category: "Board Meeting",
    locationWithinCommunity: "Clubhouse",
    startDate: "2026-07-01T18:00:00.000Z",
    endDate: "2026-07-01T19:00:00.000Z",
    maxAttendees: 50,
    imageUrl: null,
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
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

describe("AdminEventList", () => {
  it("renders event details and mobile action buttons", () => {
    render(
      <AdminEventList
        feed={makeFeed([makeEvent()])}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
        onDelete={vi.fn()}
        onViewAttendees={vi.fn()}
        onPageChange={vi.fn()}
        expandedEditEventId={null}
        expandedAttendeesEventId={null}
        renderExpandedEdit={() => null}
        renderExpandedAttendees={() => null}
      />,
    );

    expect(screen.getByText("Board Meeting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /attendees/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^cancel$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^unpublish$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^publish$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it("calls mobile action handlers", async () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();
    const onPublish = vi.fn();
    const onUnpublish = vi.fn();
    const onDelete = vi.fn();
    const onViewAttendees = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminEventList
        feed={makeFeed([makeEvent()])}
        onEdit={onEdit}
        onCancel={onCancel}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onDelete={onDelete}
        onViewAttendees={onViewAttendees}
        onPageChange={vi.fn()}
        expandedEditEventId={null}
        expandedAttendeesEventId={null}
        renderExpandedEdit={() => null}
        renderExpandedAttendees={() => null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.click(screen.getByRole("button", { name: /attendees/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await user.click(screen.getByRole("button", { name: /^unpublish$/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(onEdit).toHaveBeenCalledWith("evt-1");
    expect(onViewAttendees).toHaveBeenCalledWith("evt-1");
    expect(onCancel).toHaveBeenCalledWith("evt-1");
    expect(onPublish).not.toHaveBeenCalled();
    expect(onUnpublish).toHaveBeenCalledWith("evt-1");
    expect(onDelete).toHaveBeenCalledWith("evt-1");
  });

  it("does not show publish action for cancelled events", () => {
    render(
      <AdminEventList
        feed={makeFeed([makeEvent({ status: "Cancelled" })])}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
        onDelete={vi.fn()}
        onViewAttendees={vi.fn()}
        onPageChange={vi.fn()}
        expandedEditEventId={null}
        expandedAttendeesEventId={null}
        renderExpandedEdit={() => null}
        renderExpandedAttendees={() => null}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /^publish$/i }),
    ).not.toBeInTheDocument();
  });
});
