import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Uploads } from "../../../app/api/agent";
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

function mockSuccessfulUpload(imageUrl: string) {
  vi.spyOn(Uploads, "getCloudinarySignature").mockResolvedValue({
    cloudName: "test-cloud",
    apiKey: "test-key",
    timestamp: 1_700_000_000,
    folder: "hoa/test",
    publicId: "test-image",
    signature: "test-signature",
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ secure_url: imageUrl }),
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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
    await user.click(avatar);
    expect(
      screen.queryByText(/only jpg, png, and webp/i),
    ).not.toBeInTheDocument();

    await user.upload(
      screen.getByLabelText("Select avatar image"),
      new File(["image"], "avatar.png", { type: "image/png" }),
    );
    expect(screen.getByText("Selected: avatar.png")).toBeVisible();

    await user.click(avatar);
    await user.click(avatar);
    expect(screen.queryByText("Selected: avatar.png")).not.toBeInTheDocument();
  });

  it("clears profile-banner upload errors, files, and success feedback across remounts", async () => {
    const user = userEvent.setup({ applyAccept: false });
    mockSuccessfulUpload(
      "https://res.cloudinary.com/test/image/upload/profile-banner.png",
    );
    renderForm();
    const banner = screen.getByRole("switch", { name: "Use profile banner" });

    await user.click(screen.getAllByRole("button", { name: "Upload" })[1]);
    await user.upload(
      screen.getByLabelText("Select banner image"),
      new File(["nope"], "banner.txt", { type: "text/plain" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /only jpg, png, and webp/i,
    );

    await user.click(banner);
    await user.click(banner);
    expect(
      screen.queryByText(/only jpg, png, and webp/i),
    ).not.toBeInTheDocument();

    await user.upload(
      screen.getByLabelText("Select banner image"),
      new File(["image"], "banner.png", { type: "image/png" }),
    );
    expect(screen.getByText("Selected: banner.png")).toBeVisible();

    await user.click(banner);
    await user.click(banner);
    expect(screen.queryByText("Selected: banner.png")).not.toBeInTheDocument();

    await user.upload(
      screen.getByLabelText("Select banner image"),
      new File(["image"], "banner.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Upload Banner" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Banner uploaded successfully.",
    );

    await user.click(banner);
    await user.click(banner);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
