import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

function ControlledSwitch({ disabled = false }: { disabled?: boolean }) {
  const [checked, setChecked] = useState(false);

  return (
    <Switch
      aria-label="Use banner image"
      checked={checked}
      disabled={disabled}
      onCheckedChange={setChecked}
    />
  );
}

describe("Switch", () => {
  it("exposes its name and checked state, then changes state on click", async () => {
    const user = userEvent.setup();
    render(<ControlledSwitch />);

    const control = screen.getByRole("switch", { name: "Use banner image" });
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);

    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("changes state with Space and Enter", async () => {
    const user = userEvent.setup();
    render(<ControlledSwitch />);

    const control = screen.getByRole("switch", { name: "Use banner image" });
    control.focus();

    await user.keyboard("[Space]");
    expect(control).toHaveAttribute("aria-checked", "true");

    await user.keyboard("[Enter]");
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("does not change when disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Switch
        aria-label="Use banner image"
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    const control = screen.getByRole("switch", { name: "Use banner image" });
    await user.click(control);

    expect(control).toBeDisabled();
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("keeps the shared focus-visible ring contract", () => {
    render(
      <Switch
        aria-label="Use banner image"
        checked={false}
        onCheckedChange={() => undefined}
      />,
    );

    const control = screen.getByRole("switch", { name: "Use banner image" });
    expect(control.className).toContain("focus-visible:outline-none");
    expect(control.className).toContain("focus-visible:ring-2");
    expect(control.className).toContain("focus-visible:ring-accent");
  });
});
