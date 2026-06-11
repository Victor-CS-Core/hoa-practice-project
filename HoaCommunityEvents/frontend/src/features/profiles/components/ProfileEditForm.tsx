import { AlertCircle, User } from "lucide-react";
import { useState } from "react";
import { Uploads } from "../../../app/api/agent";
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

export function ProfileEditForm({
  initialValues,
  isSubmitting,
  apiError,
  onCancel,
  onSubmit,
}: ProfileEditFormProps) {
  const [formValues, setFormValues] =
    useState<UpdateProfileValues>(initialValues);
  const [avatarEnabled, setAvatarEnabled] = useState(
    Boolean(initialValues.profileImageUrl),
  );
  const [imageSource, setImageSource] = useState<"url" | "upload">("url");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);

  const displayNameError = getFieldError(apiError?.details, "DisplayName");
  const bioError = getFieldError(apiError?.details, "Bio");
  const profileImageError = getFieldError(apiError?.details, "ProfileImageUrl");

  const imageUrl = formValues.profileImageUrl?.trim() ?? "";
  const canShowPreview =
    avatarEnabled && imageUrl.length > 0 && failedPreviewUrl !== imageUrl;

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
      const signed = await Uploads.getCloudinarySignature("profile");

      const formData = new FormData();
      formData.append("file", uploadFile);
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

      setFormValues((prev) => ({
        ...prev,
        profileImageUrl: payload.secure_url,
      }));
      setFailedPreviewUrl(null);
      setImageSource("url");
      setUploadFile(null);
      setUploadSuccess("Avatar uploaded successfully.");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border theme-border-surface theme-bg-surface shadow-sm">
      <div className="border-b theme-border-surface theme-bg-surface-muted px-8 py-6">
        <h2 className="font-heading text-2xl font-bold theme-text-primary">
          Edit Profile
        </h2>
        <p className="mt-1 text-sm theme-text-muted">
          Update your public identity details.
        </p>
      </div>

      <div className="space-y-6 p-8">
        {apiError && apiError.code !== "validation_failed" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">
              {apiError.message ?? "Failed to update profile."}
            </p>
          </div>
        )}

        <div className="flex flex-col items-start gap-8 sm:flex-row">
          <div className="mx-auto flex shrink-0 flex-col items-center gap-3 sm:mx-0">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border theme-border-surface theme-bg-surface-muted shadow-sm">
              {canShowPreview ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => setFailedPreviewUrl(imageUrl)}
                />
              ) : (
                <User className="h-12 w-12 theme-text-muted" />
              )}
            </div>
            <span className="text-xs font-medium uppercase tracking-wider theme-text-muted">
              Avatar Preview
            </span>
          </div>

          <div className="w-full flex-1 space-y-5">
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
                className={`flex min-h-30 w-full rounded-md border bg-transparent px-3 py-2 text-sm theme-text-primary shadow-sm theme-placeholder-text-muted focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
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

            <div className="rounded-lg border theme-border-surface theme-bg-surface-muted p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold theme-text-primary">
                    Avatar image
                  </p>
                  <p className="text-xs theme-text-muted">
                    Upload to Cloudinary or use a direct image URL.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={avatarEnabled ? "default" : "outline"}
                  className="min-w-26"
                  onClick={() => {
                    setAvatarEnabled((prev) => {
                      const next = !prev;
                      if (!next) {
                        setFormValues((current) => ({
                          ...current,
                          profileImageUrl: "",
                        }));
                        setFailedPreviewUrl(null);
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

              {avatarEnabled && (
                <div className="space-y-3">
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
                          setFailedPreviewUrl(null);
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
                    <div className="rounded-md border border-dashed theme-border-surface theme-bg-surface p-3 text-sm theme-text-muted">
                      Upload directly to Cloudinary using a signed request.
                      <div className="mt-2">
                        <Input
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
                          {isUploading
                            ? "Uploading..."
                            : "Upload to Cloudinary"}
                        </Button>
                        {uploadFile && (
                          <span className="text-xs theme-text-muted">
                            Selected: {uploadFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="flex items-center justify-between gap-2 rounded-md border theme-border-surface theme-bg-surface p-2">
                      <p className="truncate text-xs theme-text-muted">
                        Current avatar URL: {imageUrl}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setFormValues((prev) => ({
                            ...prev,
                            profileImageUrl: "",
                          }));
                          setFailedPreviewUrl(null);
                          setUploadError(null);
                          setUploadSuccess(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  {uploadSuccess && (
                    <p className="text-xs font-medium text-emerald-700">
                      {uploadSuccess}
                    </p>
                  )}
                  {uploadError && (
                    <p className="text-xs font-medium text-red-600">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t theme-border-surface theme-bg-surface-muted px-8 py-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="theme-text-muted theme-hover-text-primary"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting}
          onClick={() =>
            onSubmit({
              ...formValues,
              profileImageUrl: avatarEnabled
                ? (formValues.profileImageUrl?.trim() ?? "") || undefined
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
