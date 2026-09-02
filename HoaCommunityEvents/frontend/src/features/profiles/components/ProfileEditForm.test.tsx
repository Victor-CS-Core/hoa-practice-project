import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { UpdateProfileValues } from "../../../types/profile";
import { ProfileEditForm } from "./ProfileEditForm";

const initialValues: UpdateProfileValues = {
  displayName: "Casey Resident",
  bio: "Neighbor",
  profileImageUrl: "https://example.com/avatar.jpg",
  profileImagePositionX: 24,
  profileImagePositionY: 36,
  profileImageZoom: 2,
  bannerImageUrl: "https://example.com/profile-banner.jpg",
  bannerImagePositionX: 62,
  bannerImagePositionY: 71,
  bannerImageZoom: 1.8,
};

function renderForm(onSubmit = vi.fn()) {
  render(
    <ProfileEditForm
      initialValues={initialValues}
      isSubmitting={false}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("ProfileEditForm image switches", () => {
  it("uses labeled switches and omits disabled images from the submitted profile", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    const avatar = screen.getByRole("switch", { name: "Use avatar image" });
    const banner = screen.getByRole("switch", { name: "Use profile banner" });

    expect(avatar).toHaveAttribute("aria-checked", "true");
    expect(banner).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(/off means the avatar is not saved or displayed/i),
    ).toBeVisible();
    expect(
      screen.getByText(/off means the banner is not saved or displayed/i),
    ).toBeVisible();

    await user.click(avatar);
    await user.click(banner);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        profileImageUrl: undefined,
        profileImagePositionX: undefined,
        profileImagePositionY: undefined,
        profileImageZoom: undefined,
        bannerImageUrl: undefined,
        bannerImagePositionX: undefined,
        bannerImagePositionY: undefined,
        bannerImageZoom: undefined,
      }),
    );
  });

  it("clears image URLs and resets crop values before either switch is re-enabled", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    const avatar = screen.getByRole("switch", { name: "Use avatar image" });
    const banner = screen.getByRole("switch", { name: "Use profile banner" });

    await user.click(avatar);
    await user.click(avatar);
    await user.click(banner);
    await user.click(banner);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        profileImageUrl: undefined,
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: undefined,
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
      }),
    );
  });

  it("clears avatar upload errors and selected files when the setting is turned off", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();
    const avatar = screen.getByRole("switch", { name: "Use avatar image" });

    await user.click(screen.getAllByRole("button", { name: "Upload" })[0]);
    const fileInput = screen.getByLabelText("Select avatar image");
    await user.upload(
      fileInput,
      new File(["nope"], "avatar.txt", { type: "text/plain" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /only jpg, png, and webp/i,
    );

    await user.click(avatar);
    expect(
      screen.queryByText(/only jpg, png, and webp/i),
    ).not.toBeInTheDocument();

    await user.click(avatar);
    await user.upload(
      screen.getByLabelText("Select avatar image"),
      new File(["image"], "avatar.png", { type: "image/png" }),
    );
    expect(screen.getByText("Selected: avatar.png")).toBeVisible();

    await user.click(avatar);
    await user.click(avatar);
    expect(screen.queryByText("Selected: avatar.png")).not.toBeInTheDocument();
  });
});
