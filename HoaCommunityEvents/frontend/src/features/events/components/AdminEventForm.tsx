import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Uploads } from "../../../app/api/agent";
import { ImageCropEditor } from "../../../components/media/ImageCropEditor";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { getFieldError, type ApiErrorEnvelope } from "../../auth/authApiError";
import type { CreateEventFormValues } from "../../../types/event";

interface AdminEventFormProps {
  mode: "create" | "edit";
  initialValues?: CreateEventFormValues;
  isSubmitting: boolean;
  apiError?: ApiErrorEnvelope | null;
  onCancel: () => void;
  onSubmit: (values: CreateEventFormValues) => void;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const clampZoom = (value: number) => Math.max(1, Math.min(3, value));

function toLocalDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function buildDefaults(values?: CreateEventFormValues): CreateEventFormValues {
  return {
    title: values?.title ?? "",
    description: values?.description ?? "",
    category: values?.category ?? "",
    locationWithinCommunity: values?.locationWithinCommunity ?? "",
    startDate: toLocalDateInput(values?.startDate),
    endDate: toLocalDateInput(values?.endDate),
    maxAttendees: values?.maxAttendees ?? undefined,
    imageUrl: values?.imageUrl ?? "",
    imagePositionX: values?.imagePositionX ?? 50,
    imagePositionY: values?.imagePositionY ?? 50,
    imageZoom: values?.imageZoom ?? 1,
  };
}

export function AdminEventForm({
  mode,
  initialValues,
  isSubmitting,
  apiError,
  onCancel,
  onSubmit,
}: AdminEventFormProps) {
  const [bannerEnabled, setBannerEnabled] = useState(
    Boolean(initialValues?.imageUrl),
  );
  const [imageSource, setImageSource] = useState<"url" | "upload">("url");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, control } =
    useForm<CreateEventFormValues>({
      defaultValues: buildDefaults(initialValues),
    });

  const imageUrlValue = useWatch({ control, name: "imageUrl" })?.trim() ?? "";
  const imagePositionX = useWatch({ control, name: "imagePositionX" }) ?? 50;
  const imagePositionY = useWatch({ control, name: "imagePositionY" }) ?? 50;
  const imageZoom = useWatch({ control, name: "imageZoom" }) ?? 1;
  const canShowPreview = bannerEnabled && imageUrlValue.length > 0;

  useEffect(() => {
    reset(buildDefaults(initialValues));
  }, [initialValues, reset]);

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
      const signed = await Uploads.getCloudinarySignature("event");

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

      setValue("imageUrl", payload.secure_url, { shouldDirty: true });
      setImageSource("url");
      setUploadFile(null);
      setUploadSuccess("Image uploaded successfully.");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
        <h2 className="font-heading text-xl font-bold text-stone-900">
          {mode === "create" ? "Create New Event" : "Edit Event"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit((values) => {
          const next: CreateEventFormValues = {
            ...values,
            imageUrl: bannerEnabled
              ? (values.imageUrl?.trim() ?? "") || undefined
              : undefined,
            imagePositionX: bannerEnabled
              ? (values.imagePositionX ?? 50)
              : undefined,
            imagePositionY: bannerEnabled
              ? (values.imagePositionY ?? 50)
              : undefined,
            imageZoom: bannerEnabled
              ? clampZoom(values.imageZoom ?? 1)
              : undefined,
            maxAttendees:
              typeof values.maxAttendees === "number" &&
              Number.isFinite(values.maxAttendees)
                ? values.maxAttendees
                : undefined,
          };
          onSubmit(next);
        })}
        className="space-y-6 p-6"
      >
        {apiError && apiError.code !== "validation_failed" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{apiError.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Event Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("title")}
              placeholder="e.g., Annual HOA Meeting"
              className={
                getFieldError(apiError?.details, "Title")
                  ? "border-red-300 focus-visible:ring-red-500"
                  : ""
              }
            />
            {getFieldError(apiError?.details, "Title") && (
              <p className="mt-1 text-xs text-red-500">
                {getFieldError(apiError?.details, "Title")}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description")}
              className={`flex min-h-25 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                getFieldError(apiError?.details, "Description")
                  ? "border-red-300 focus-visible:ring-red-500"
                  : "border-stone-200 focus-visible:ring-emerald-500"
              }`}
              placeholder="Describe the event..."
            />
            {getFieldError(apiError?.details, "Description") && (
              <p className="mt-1 text-xs text-red-500">
                {getFieldError(apiError?.details, "Description")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                {...register("startDate")}
                className={
                  getFieldError(apiError?.details, "StartDate")
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {getFieldError(apiError?.details, "StartDate") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError(apiError?.details, "StartDate")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                {...register("endDate")}
                className={
                  getFieldError(apiError?.details, "EndDate")
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {getFieldError(apiError?.details, "EndDate") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError(apiError?.details, "EndDate")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Category <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("category")}
                placeholder="e.g., Board Meeting"
                className={
                  getFieldError(apiError?.details, "Category")
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {getFieldError(apiError?.details, "Category") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError(apiError?.details, "Category")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("locationWithinCommunity")}
                placeholder="e.g., Clubhouse Room A"
                className={
                  getFieldError(apiError?.details, "LocationWithinCommunity")
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {getFieldError(apiError?.details, "LocationWithinCommunity") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError(apiError?.details, "LocationWithinCommunity")}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Max Attendees (Optional)
              </label>
              <Input
                type="number"
                {...register("maxAttendees", { valueAsNumber: true })}
                placeholder="e.g., 50"
                className={
                  getFieldError(apiError?.details, "MaxAttendees")
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {getFieldError(apiError?.details, "MaxAttendees") && (
                <p className="mt-1 text-xs text-red-500">
                  {getFieldError(apiError?.details, "MaxAttendees")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Banner image
                </p>
                <p className="text-xs text-stone-500">
                  Add a hero image for event cards and details.
                </p>
              </div>
              <Button
                type="button"
                variant={bannerEnabled ? "default" : "outline"}
                className="min-w-26"
                onClick={() => {
                  setBannerEnabled((prev) => {
                    const next = !prev;
                    if (!next) {
                      setValue("imageUrl", "", { shouldDirty: true });
                      setValue("imagePositionX", 50, { shouldDirty: true });
                      setValue("imagePositionY", 50, { shouldDirty: true });
                      setValue("imageZoom", 1, { shouldDirty: true });
                      setUploadError(null);
                      setUploadSuccess(null);
                      setUploadFile(null);
                    }
                    return next;
                  });
                }}
              >
                {bannerEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {bannerEnabled && (
              <div className="space-y-3">
                <div className="inline-flex rounded-md border border-stone-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setImageSource("url")}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      imageSource === "url"
                        ? "bg-emerald-600 text-white"
                        : "text-stone-600 hover:bg-stone-100"
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
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    Upload
                  </button>
                </div>

                {imageSource === "url" ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Image URL
                    </label>
                    <Input
                      {...register("imageUrl", {
                        onChange: () => {
                          setUploadError(null);
                          setUploadSuccess(null);
                        },
                      })}
                      placeholder="https://example.com/banner.jpg"
                      className={
                        getFieldError(apiError?.details, "ImageUrl")
                          ? "border-red-300 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {getFieldError(apiError?.details, "ImageUrl") && (
                      <p className="mt-1 text-xs text-red-500">
                        {getFieldError(apiError?.details, "ImageUrl")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-stone-300 bg-white p-3 text-sm text-stone-600">
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
                    <p className="mt-2 text-xs text-stone-500">
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
                        <span className="text-xs text-stone-500">
                          Selected: {uploadFile.name}
                        </span>
                      )}
                    </div>
                    {uploadSuccess && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        {uploadSuccess}
                      </p>
                    )}
                    {uploadError && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {bannerEnabled && imageUrlValue && (
                  <div className="rounded-md border border-stone-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-stone-600">
                        Banner preview
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setValue("imageUrl", "", { shouldDirty: true });
                          setValue("imagePositionX", 50, { shouldDirty: true });
                          setValue("imagePositionY", 50, { shouldDirty: true });
                          setValue("imageZoom", 1, { shouldDirty: true });
                          setUploadError(null);
                          setUploadSuccess(null);
                        }}
                      >
                        Remove image
                      </Button>
                    </div>

                    {canShowPreview ? (
                      <>
                        <ImageCropEditor
                          imageUrl={imageUrlValue}
                          aspect={16 / 9}
                          positionX={imagePositionX}
                          positionY={imagePositionY}
                          zoom={imageZoom}
                          heightClassName="h-36"
                          onPositionChange={(x, y) => {
                            setValue("imagePositionX", x, {
                              shouldDirty: true,
                            });
                            setValue("imagePositionY", y, {
                              shouldDirty: true,
                            });
                          }}
                          onZoomChange={(nextZoom) => {
                            setValue("imageZoom", clampZoom(nextZoom), {
                              shouldDirty: true,
                            });
                          }}
                        />
                        <div className="mt-3">
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Zoom ({imageZoom.toFixed(2)}x)
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            {...register("imageZoom", {
                              valueAsNumber: true,
                            })}
                            className="w-full accent-emerald-600"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Unable to preview this image URL.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4 -mx-6 -mb-6">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-stone-600 hover:text-stone-900"
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Event"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
