import { AlertCircle, Image, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Uploads } from "../../../app/api/agent";
import { ImageCropEditor } from "../../../components/media/ImageCropEditor";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { UpdateProfileValues } from "../../../types/profile";
import type { ApiErrorEnvelope } from "../../auth/authApiError";
import { getFieldError } from "../../auth/authApiError";

interface ProfileEditFormProps {
  initialValues: UpdateProfileValues;
  isSubmitting: boolean;
  apiError?: ApiErrorEnvelope | null;
  onCancel: () => void;
  onSubmit: (values: UpdateProfileValues) => void;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const clampZoom = (value: number) => Math.max(1, Math.min(3, value));

export function ProfileEditForm({
  initialValues,
  isSubmitting,
  apiError,
  onCancel,
  onSubmit,
}: ProfileEditFormProps) {
  const [formValues, setFormValues] = useState<UpdateProfileValues>({
    ...initialValues,
    profileImagePositionX: initialValues.profileImagePositionX ?? 50,
    profileImagePositionY: initialValues.profileImagePositionY ?? 50,
    profileImageZoom: initialValues.profileImageZoom ?? 1,
    bannerImagePositionX: initialValues.bannerImagePositionX ?? 50,
    bannerImagePositionY: initialValues.bannerImagePositionY ?? 50,
    bannerImageZoom: initialValues.bannerImageZoom ?? 1,
  });
  const [avatarEnabled, setAvatarEnabled] = useState(
    Boolean(initialValues.profileImageUrl),
  );
  const [bannerEnabled, setBannerEnabled] = useState(
    Boolean(initialValues.bannerImageUrl),
  );
  const [imageSource, setImageSource] = useState<"url" | "upload">("url");
  const [bannerImageSource, setBannerImageSource] = useState<"url" | "upload">(
    "url",
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [bannerUploadFile, setBannerUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(
    null,
  );
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState<string | null>(
    null,
  );
  const [previewPulse, setPreviewPulse] = useState(false);

  const displayNameError = getFieldError(apiError?.details, "DisplayName");
  const bioError = getFieldError(apiError?.details, "Bio");
  const profileImageError = getFieldError(apiError?.details, "ProfileImageUrl");
  const bannerImageError = getFieldError(apiError?.details, "BannerImageUrl");

  const imageUrl = formValues.profileImageUrl?.trim() ?? "";
  const bannerImageUrl = formValues.bannerImageUrl?.trim() ?? "";
  const canShowPreview = avatarEnabled && imageUrl.length > 0;
  const canShowBannerPreview = bannerEnabled && bannerImageUrl.length > 0;

  useEffect(() => {
    if (!previewPulse) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPreviewPulse(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [previewPulse]);

  const uploadToCloudinary = async (
    file: File,
    assetType: "avatar" | "banner",
  ) => {
    const signed = await Uploads.getCloudinarySignature("profile", assetType);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("folder", signed.folder);
    formData.append("public_id", signed.publicId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok || !payload.secure_url) {
      throw new Error(payload.error?.message || "Image upload failed.");
    }

    return payload.secure_url;
  };

  const handleCloudinaryUpload = async () => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!uploadFile) {
      setUploadError("Select an image file first.");
      return;
    }

    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(uploadFile.type)) {
      setUploadError("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    if (uploadFile.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Image must be 5MB or smaller.");
      return;
    }

    try {
      setIsUploading(true);
      const secureUrl = await uploadToCloudinary(uploadFile, "avatar");

      setFormValues((prev) => ({
        ...prev,
        profileImageUrl: secureUrl,
      }));
      setImageSource("url");
      setUploadFile(null);
      setUploadSuccess("Avatar uploaded successfully.");
      setPreviewPulse(true);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerCloudinaryUpload = async () => {
    setBannerUploadError(null);
    setBannerUploadSuccess(null);

    if (!bannerUploadFile) {
      setBannerUploadError("Select a banner image file first.");
      return;
    }

    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(bannerUploadFile.type)) {
      setBannerUploadError("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    if (bannerUploadFile.size > MAX_IMAGE_SIZE_BYTES) {
      setBannerUploadError("Image must be 5MB or smaller.");
      return;
    }

    try {
      setIsBannerUploading(true);
      const secureUrl = await uploadToCloudinary(bannerUploadFile, "banner");

      setFormValues((prev) => ({
        ...prev,
        bannerImageUrl: secureUrl,
      }));
      setBannerImageSource("url");
      setBannerUploadFile(null);
      setBannerUploadSuccess("Banner uploaded successfully.");
    } catch (error) {
      setBannerUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsBannerUploading(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border theme-border-surface theme-bg-surface shadow-sm animate-fade-up">
      <div
        className="relative overflow-hidden border-b theme-border-surface px-6 pb-7 pt-6 sm:px-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,95,70,0.9) 0%, rgba(4,120,87,0.85) 45%, rgba(20,184,166,0.75) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Edit Profile
            </h2>
            <p className="mt-1 text-sm text-emerald-100">
              Update your public identity details, avatar, and banner.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-2">
        {apiError && apiError.code !== "validation_failed" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 lg:col-span-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">
              {apiError.message ?? "Failed to update profile."}
            </p>
          </div>
        )}

        <div className="animate-fade-up animate-delay-100 min-w-0 space-y-5 rounded-xl border theme-border-surface theme-bg-surface-muted p-5 lg:col-span-2">
          <div>
            <h3 className="font-heading text-lg font-semibold theme-text-primary">
              Account Identity
            </h3>
            <p className="mt-1 text-xs theme-text-muted">
              These values are visible to community members.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium theme-text-primary">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formValues.displayName}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  displayName: event.target.value,
                }))
              }
              placeholder="e.g., Jane Doe"
              className={
                displayNameError
                  ? "border-red-300 focus-visible:ring-red-500"
                  : ""
              }
            />
            {displayNameError && (
              <p className="mt-1 text-xs text-red-500">{displayNameError}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium theme-text-primary">
              Bio (Optional)
            </label>
            <textarea
              value={formValues.bio ?? ""}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  bio: event.target.value,
                }))
              }
              className={`flex min-h-36 w-full rounded-md border bg-transparent px-3 py-2 text-sm theme-text-primary shadow-sm theme-placeholder-text-muted focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                bioError
                  ? "border-red-300 focus-visible:ring-red-500"
                  : "theme-border-surface focus-visible:ring-emerald-500"
              }`}
              placeholder="Tell your neighbors a bit about yourself..."
            />
            {bioError && (
              <p className="mt-1 text-xs text-red-500">{bioError}</p>
            )}
          </div>
        </div>

        <div className="animate-fade-up animate-delay-200 min-w-0 space-y-4 rounded-xl border theme-border-surface theme-bg-surface-muted p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-semibold theme-text-primary">
                Avatar Image
              </h3>
              <p className="mt-1 text-xs theme-text-muted">
                Upload to Cloudinary or use a direct image URL.
              </p>
            </div>
            <Button
              type="button"
              variant={avatarEnabled ? "default" : "outline"}
              className="min-w-26 shrink-0"
              onClick={() => {
                setAvatarEnabled((prev) => {
                  const next = !prev;
                  if (!next) {
                    setFormValues((current) => ({
                      ...current,
                      profileImageUrl: "",
                      profileImagePositionX: 50,
                      profileImagePositionY: 50,
                      profileImageZoom: 1,
                    }));
                    setUploadError(null);
                    setUploadSuccess(null);
                    setUploadFile(null);
                  }
                  return next;
                });
              }}
            >
              {avatarEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="mx-auto flex w-full flex-col items-center gap-3 rounded-lg border theme-border-surface theme-bg-surface p-4">
            <div className="flex h-34 w-34 items-center justify-center overflow-hidden rounded-full border-4 border-white/70 bg-white/90 shadow-md">
              {canShowPreview ? (
                <div
                  className={`h-full w-full ${previewPulse ? "animate-zoom-in" : ""}`}
                >
                  <ImageCropEditor
                    imageUrl={imageUrl}
                    aspect={1}
                    positionX={formValues.profileImagePositionX ?? 50}
                    positionY={formValues.profileImagePositionY ?? 50}
                    zoom={formValues.profileImageZoom ?? 1}
                    heightClassName="h-full"
                    onPositionChange={(x, y) => {
                      setFormValues((prev) => ({
                        ...prev,
                        profileImagePositionX: x,
                        profileImagePositionY: y,
                      }));
                    }}
                    onZoomChange={(nextZoom) => {
                      setFormValues((prev) => ({
                        ...prev,
                        profileImageZoom: clampZoom(nextZoom),
                      }));
                    }}
                  />
                </div>
              ) : (
                <User className="h-12 w-12 text-emerald-700" />
              )}
            </div>
            <span className="text-xs font-medium uppercase tracking-wider theme-text-muted">
              Avatar Preview
            </span>
          </div>

          {avatarEnabled && (
            <div className="space-y-3 rounded-lg border theme-border-surface theme-bg-surface p-4">
              <div className="inline-flex rounded-md border theme-border-surface theme-bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setImageSource("url")}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    imageSource === "url"
                      ? "bg-emerald-600 text-white"
                      : "theme-text-muted theme-hover-bg-surface-muted"
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource("upload")}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    imageSource === "upload"
                      ? "bg-emerald-600 text-white"
                      : "theme-text-muted theme-hover-bg-surface-muted"
                  }`}
                >
                  Upload
                </button>
              </div>

              {imageSource === "url" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium theme-text-primary">
                    Avatar Image URL
                  </label>
                  <Input
                    value={formValues.profileImageUrl ?? ""}
                    onChange={(event) => {
                      setUploadError(null);
                      setUploadSuccess(null);
                      setFormValues((prev) => ({
                        ...prev,
                        profileImageUrl: event.target.value,
                      }));
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className={
                      profileImageError
                        ? "border-red-300 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {profileImageError && (
                    <p className="mt-1 text-xs text-red-500">
                      {profileImageError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed theme-border-surface theme-bg-surface-muted p-3 text-sm theme-text-muted">
                  Upload directly to Cloudinary using a signed request.
                  <div className="mt-2">
                    <label
                      htmlFor="profile-avatar-upload"
                      className="mb-1 block text-xs font-medium theme-text-primary"
                    >
                      Select avatar image
                    </label>
                    <Input
                      id="profile-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (
                          file &&
                          !ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)
                        ) {
                          setUploadFile(null);
                          setUploadError(
                            "Only JPG, PNG, and WebP images are supported.",
                          );
                          setUploadSuccess(null);
                          return;
                        }

                        if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
                          setUploadFile(null);
                          setUploadError("Image must be 5MB or smaller.");
                          setUploadSuccess(null);
                          return;
                        }

                        setUploadFile(file);
                        setUploadError(null);
                        setUploadSuccess(null);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs theme-text-muted">
                    Accepted: JPG, PNG, WebP. Max size: 5MB.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCloudinaryUpload()}
                      disabled={!uploadFile || isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload to Cloudinary"}
                    </Button>
                    {uploadFile && (
                      <span className="break-all text-xs theme-text-muted">
                        Selected: {uploadFile.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {imageUrl && (
                <div className="flex flex-col items-start gap-2 rounded-md border theme-border-surface theme-bg-surface-muted p-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all text-xs theme-text-muted">
                    Current avatar URL: {imageUrl}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setFormValues((current) => ({
                        ...current,
                        profileImageUrl: "",
                        profileImagePositionX: 50,
                        profileImagePositionY: 50,
                        profileImageZoom: 1,
                      }));
                      setUploadError(null);
                      setUploadSuccess(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {canShowPreview && (
                <div className="space-y-3 rounded-md border theme-border-surface theme-bg-surface-muted p-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide theme-text-muted">
                      Zoom ({(formValues.profileImageZoom ?? 1).toFixed(2)}x)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={formValues.profileImageZoom ?? 1}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setFormValues((prev) => ({
                          ...prev,
                          profileImageZoom: Number.isFinite(next)
                            ? clampZoom(next)
                            : 1,
                        }));
                      }}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs font-medium text-emerald-700"
                >
                  {uploadSuccess}
                </p>
              )}
              {uploadError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="text-xs font-medium text-red-600"
                >
                  {uploadError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="animate-fade-up animate-delay-[240ms] min-w-0 space-y-4 rounded-xl border theme-border-surface theme-bg-surface-muted p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-semibold theme-text-primary">
                Profile Banner
              </h3>
              <p className="mt-1 text-xs theme-text-muted">
                Stored in your Cloudinary profile folder under banners.
              </p>
            </div>
            <Button
              type="button"
              variant={bannerEnabled ? "default" : "outline"}
              className="min-w-26 shrink-0"
              onClick={() => {
                setBannerEnabled((prev) => {
                  const next = !prev;
                  if (!next) {
                    setFormValues((current) => ({
                      ...current,
                      bannerImageUrl: "",
                      bannerImagePositionX: 50,
                      bannerImagePositionY: 50,
                      bannerImageZoom: 1,
                    }));
                    setBannerUploadError(null);
                    setBannerUploadSuccess(null);
                    setBannerUploadFile(null);
                  }
                  return next;
                });
              }}
            >
              {bannerEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="space-y-2 rounded-lg border theme-border-surface theme-bg-surface p-3">
            <span className="text-xs font-medium uppercase tracking-wider theme-text-muted">
              Banner Preview
            </span>
            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-md border theme-border-surface theme-bg-surface-muted">
              {canShowBannerPreview ? (
                <ImageCropEditor
                  imageUrl={bannerImageUrl}
                  aspect={16 / 9}
                  positionX={formValues.bannerImagePositionX ?? 50}
                  positionY={formValues.bannerImagePositionY ?? 50}
                  zoom={formValues.bannerImageZoom ?? 1}
                  heightClassName="h-full"
                  onPositionChange={(x, y) => {
                    setFormValues((prev) => ({
                      ...prev,
                      bannerImagePositionX: x,
                      bannerImagePositionY: y,
                    }));
                  }}
                  onZoomChange={(nextZoom) => {
                    setFormValues((prev) => ({
                      ...prev,
                      bannerImageZoom: clampZoom(nextZoom),
                    }));
                  }}
                />
              ) : (
                <Image className="h-8 w-8 theme-text-muted" />
              )}
            </div>
          </div>

          {bannerEnabled && bannerImageUrl && (
            <div className="space-y-3 rounded-lg border theme-border-surface theme-bg-surface p-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide theme-text-muted">
                  Zoom ({(formValues.bannerImageZoom ?? 1).toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={formValues.bannerImageZoom ?? 1}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setFormValues((prev) => ({
                      ...prev,
                      bannerImageZoom: Number.isFinite(next)
                        ? clampZoom(next)
                        : 1,
                    }));
                  }}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          )}

          {bannerEnabled && (
            <div className="space-y-3 rounded-lg border theme-border-surface theme-bg-surface p-4">
              <div className="inline-flex rounded-md border theme-border-surface theme-bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setBannerImageSource("url")}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    bannerImageSource === "url"
                      ? "bg-emerald-600 text-white"
                      : "theme-text-muted theme-hover-bg-surface-muted"
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setBannerImageSource("upload")}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    bannerImageSource === "upload"
                      ? "bg-emerald-600 text-white"
                      : "theme-text-muted theme-hover-bg-surface-muted"
                  }`}
                >
                  Upload
                </button>
              </div>

              {bannerImageSource === "url" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium theme-text-primary">
                    Banner Image URL
                  </label>
                  <Input
                    value={formValues.bannerImageUrl ?? ""}
                    onChange={(event) => {
                      setBannerUploadError(null);
                      setBannerUploadSuccess(null);
                      setFormValues((prev) => ({
                        ...prev,
                        bannerImageUrl: event.target.value,
                      }));
                    }}
                    placeholder="https://example.com/profile-banner.jpg"
                    className={
                      bannerImageError
                        ? "border-red-300 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {bannerImageError && (
                    <p className="mt-1 text-xs text-red-500">
                      {bannerImageError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed theme-border-surface theme-bg-surface-muted p-3 text-sm theme-text-muted">
                  Upload banner to Cloudinary using a signed request.
                  <div className="mt-2">
                    <label
                      htmlFor="profile-banner-upload"
                      className="mb-1 block text-xs font-medium theme-text-primary"
                    >
                      Select banner image
                    </label>
                    <Input
                      id="profile-banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (
                          file &&
                          !ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)
                        ) {
                          setBannerUploadFile(null);
                          setBannerUploadError(
                            "Only JPG, PNG, and WebP images are supported.",
                          );
                          setBannerUploadSuccess(null);
                          return;
                        }

                        if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
                          setBannerUploadFile(null);
                          setBannerUploadError("Image must be 5MB or smaller.");
                          setBannerUploadSuccess(null);
                          return;
                        }

                        setBannerUploadFile(file);
                        setBannerUploadError(null);
                        setBannerUploadSuccess(null);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs theme-text-muted">
                    Accepted: JPG, PNG, WebP. Max size: 5MB.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleBannerCloudinaryUpload()}
                      disabled={!bannerUploadFile || isBannerUploading}
                    >
                      {isBannerUploading
                        ? "Uploading..."
                        : "Upload banner to Cloudinary"}
                    </Button>
                    {bannerUploadFile && (
                      <span className="break-all text-xs theme-text-muted">
                        Selected: {bannerUploadFile.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {bannerImageUrl && (
                <div className="flex flex-col items-start gap-2 rounded-md border theme-border-surface theme-bg-surface-muted p-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all text-xs theme-text-muted">
                    Current banner URL: {bannerImageUrl}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setFormValues((current) => ({
                        ...current,
                        bannerImageUrl: "",
                        bannerImagePositionX: 50,
                        bannerImagePositionY: 50,
                        bannerImageZoom: 1,
                      }));
                      setBannerUploadError(null);
                      setBannerUploadSuccess(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {bannerUploadSuccess && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs font-medium text-emerald-700"
                >
                  {bannerUploadSuccess}
                </p>
              )}
              {bannerUploadError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="text-xs font-medium text-red-600"
                >
                  {bannerUploadError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="animate-fade-up animate-delay-300 flex flex-wrap items-center justify-end gap-3 border-t theme-border-surface theme-bg-surface-muted px-4 py-4 sm:px-8">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full theme-text-muted theme-hover-text-primary sm:w-auto"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
          disabled={isSubmitting}
          onClick={() =>
            onSubmit({
              ...formValues,
              profileImageUrl: avatarEnabled
                ? (formValues.profileImageUrl?.trim() ?? "") || undefined
                : undefined,
              profileImagePositionX: avatarEnabled
                ? (formValues.profileImagePositionX ?? 50)
                : undefined,
              profileImagePositionY: avatarEnabled
                ? (formValues.profileImagePositionY ?? 50)
                : undefined,
              profileImageZoom: avatarEnabled
                ? clampZoom(formValues.profileImageZoom ?? 1)
                : undefined,
              bannerImageUrl: bannerEnabled
                ? (formValues.bannerImageUrl?.trim() ?? "") || undefined
                : undefined,
              bannerImagePositionX: bannerEnabled
                ? (formValues.bannerImagePositionX ?? 50)
                : undefined,
              bannerImagePositionY: bannerEnabled
                ? (formValues.bannerImagePositionY ?? 50)
                : undefined,
              bannerImageZoom: bannerEnabled
                ? clampZoom(formValues.bannerImageZoom ?? 1)
                : undefined,
            })
          }
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
