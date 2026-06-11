import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

  const { register, handleSubmit, reset } = useForm<CreateEventFormValues>({
    defaultValues: buildDefaults(initialValues),
  });

  useEffect(() => {
    reset(buildDefaults(initialValues));
  }, [initialValues, reset]);

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
                onClick={() => setBannerEnabled((prev) => !prev)}
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
                      {...register("imageUrl")}
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
                    Upload mode is scaffolded for Cloudinary integration.
                    Connect this button to your signed upload flow when ready.
                    <div className="mt-2">
                      <Button type="button" variant="outline" disabled>
                        Upload to Cloudinary (coming soon)
                      </Button>
                    </div>
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
