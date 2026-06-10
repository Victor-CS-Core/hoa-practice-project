import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminConfirmModal } from "./AdminConfirmModal";

describe("AdminConfirmModal", () => {
  it("renders cancel mode content", () => {
    render(
      <AdminConfirmModal
        action="cancel"
        isSubmitting={false}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Cancel Event")).toBeInTheDocument();
    expect(screen.getByText(/marked cancelled/i)).toBeInTheDocument();
  });

  it("triggers confirm and dismiss callbacks", async () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminConfirmModal
        action="delete"
        isSubmitting={false}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: /yes, delete/i }));
    await user.click(screen.getByRole("button", { name: /keep event/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
