import { AlertCircle, User } from "lucide-react";
import { useState } from "react";
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

export function ProfileEditForm({
  initialValues,
  isSubmitting,
  apiError,
  onCancel,
  onSubmit,
}: ProfileEditFormProps) {
  const [formValues, setFormValues] =
    useState<UpdateProfileValues>(initialValues);

  const displayNameError = getFieldError(apiError?.details, "DisplayName");
  const bioError = getFieldError(apiError?.details, "Bio");
  const profileImageError = getFieldError(apiError?.details, "ProfileImageUrl");

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-50 px-8 py-6">
        <h2 className="font-heading text-2xl font-bold text-stone-900">
          Edit Profile
        </h2>
        <p className="mt-1 text-sm text-stone-500">
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
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-sm">
              {formValues.profileImageUrl ? (
                <img
                  src={formValues.profileImageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-stone-400" />
              )}
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Avatar Preview
            </span>
          </div>

          <div className="w-full flex-1 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
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
              <label className="mb-1 block text-sm font-medium text-stone-700">
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
                className={`flex min-h-30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                  bioError
                    ? "border-red-300 focus-visible:ring-red-500"
                    : "border-stone-200 focus-visible:ring-emerald-500"
                }`}
                placeholder="Tell your neighbors a bit about yourself..."
              />
              {bioError && (
                <p className="mt-1 text-xs text-red-500">{bioError}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Avatar Image URL (Optional)
              </label>
              <Input
                value={formValues.profileImageUrl ?? ""}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    profileImageUrl: event.target.value,
                  }))
                }
                placeholder="https://example.com/avatar.jpg"
                className={
                  profileImageError
                    ? "border-red-300 focus-visible:ring-red-500"
                    : ""
                }
              />
              {profileImageError && (
                <p className="mt-1 text-xs text-red-500">{profileImageError}</p>
              )}
              <p className="mt-1 text-xs text-stone-400">
                Provide an absolute URL to an image for your avatar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-stone-50 px-8 py-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-stone-600 hover:text-stone-900"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting}
          onClick={() => onSubmit(formValues)}
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
