import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventsPagination } from "./EventsPagination";

describe("EventsPagination", () => {
  it("shows range and disables previous on first page", () => {
    const onPageChange = vi.fn();

    render(
      <EventsPagination
        page={1}
        totalPages={4}
        totalCount={35}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("fires page change when next is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <EventsPagination
        page={2}
        totalPages={4}
        totalCount={35}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
