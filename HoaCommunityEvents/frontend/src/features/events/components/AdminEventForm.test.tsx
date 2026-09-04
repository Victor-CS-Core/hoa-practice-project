import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Uploads } from "../../../app/api/agent";
import type { CreateEventFormValues } from "../../../types/event";
import { AdminEventForm } from "./AdminEventForm";

const initialValues: CreateEventFormValues = {
  title: "Annual HOA Meeting",
  description: "Community update",
  category: "Meeting",
  locationWithinCommunity: "Clubhouse",
  startDate: "2099-07-01T18:00:00",
  endDate: "2099-07-01T19:00:00",
  maxAttendees: 50,
  imageUrl: "https://example.com/event-banner.jpg",
  imagePositionX: 22,
  imagePositionY: 64,
  imageZoom: 2.2,
};

function renderForm(onSubmit = vi.fn()) {
  render(
    <AdminEventForm
      mode="edit"
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

describe("AdminEventForm banner switch", () => {
  it("uses a labeled switch and omits a disabled banner from submission", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    const banner = screen.getByRole("switch", { name: "Use event banner" });

    expect(banner).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(/off means the banner is not saved or displayed/i),
    ).toBeVisible();

    await user.click(banner);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: undefined,
        imagePositionX: undefined,
        imagePositionY: undefined,
        imageZoom: undefined,
      }),
    );
  });

  it("clears the URL and resets crop values before the switch is re-enabled", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    const banner = screen.getByRole("switch", { name: "Use event banner" });

    await user.click(banner);
    await user.click(banner);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: undefined,
        imagePositionX: 50,
        imagePositionY: 50,
        imageZoom: 1,
      }),
    );
  });

  it("clears upload feedback and the selected file when the banner is turned off", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();
    const banner = screen.getByRole("switch", { name: "Use event banner" });

    await user.click(screen.getByRole("button", { name: "Upload" }));
    const fileInput = screen.getByLabelText("Select event banner image");
    await user.upload(
      fileInput,
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
      screen.getByLabelText("Select event banner image"),
      new File(["image"], "banner.png", { type: "image/png" }),
    );
    expect(screen.getByText("Selected: banner.png")).toBeVisible();

    await user.click(banner);
    await user.click(banner);
    expect(screen.queryByText("Selected: banner.png")).not.toBeInTheDocument();
  });

  it("clears successful upload feedback before the banner panel remounts", async () => {
    const user = userEvent.setup();
    mockSuccessfulUpload(
      "https://res.cloudinary.com/test/image/upload/event-banner.png",
    );
    renderForm();
    const banner = screen.getByRole("switch", { name: "Use event banner" });

    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(
      screen.getByLabelText("Select event banner image"),
      new File(["image"], "banner.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Upload Image" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Image uploaded successfully.",
    );

    await user.click(banner);
    await user.click(banner);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
