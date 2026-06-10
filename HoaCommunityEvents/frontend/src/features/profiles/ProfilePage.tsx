import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import { useProfile, useUpdateProfile } from "../../hooks/useProfile";
import type { UpdateProfileValues } from "../../types/profile";
import { ProfileEditForm } from "./components/ProfileEditForm";
import { ProfileOverview } from "./components/ProfileOverview";
import { toApiError, type ApiErrorEnvelope } from "../auth/authApiError";

export const ProfilePage = observer(function ProfilePage() {
  const { username } = useParams();
  const { authStore } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState<ApiErrorEnvelope | null>(null);
  const { data, isLoading, isError } = useProfile(username);
  const updateMutation = useUpdateProfile();

  if (!authStore.user || !username) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
        Profile not available.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
        Loading profile...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-600">
        Profile not found.
      </div>
    );
  }

  const isOwnProfile =
    authStore.user.username.toLowerCase() === username.toLowerCase();

  const onSubmit = async (values: UpdateProfileValues) => {
    setApiError(null);

    try {
      await updateMutation.mutateAsync({ username, values });

      if (isOwnProfile) {
        await authStore.getCurrentUser();
      }

      setIsEditing(false);
    } catch (error) {
      const next = toApiError(error);
      setApiError(next ?? { message: "Failed to update profile." });
    }
  };

  return (
    <section className="space-y-6">
      {isEditing ? (
        <ProfileEditForm
          key={`${data.username}-${data.displayName}-${data.bio ?? ""}-${data.profileImageUrl ?? ""}`}
          initialValues={{
            displayName: data.displayName,
            bio: data.bio ?? "",
            profileImageUrl: data.profileImageUrl ?? "",
          }}
          isSubmitting={updateMutation.isPending}
          apiError={apiError}
          onCancel={() => {
            setApiError(null);
            setIsEditing(false);
          }}
          onSubmit={onSubmit}
        />
      ) : (
        <ProfileOverview
          profile={data}
          isOwner={isOwnProfile}
          onEditClick={() => {
            setApiError(null);
            setIsEditing(true);
          }}
        />
      )}
    </section>
  );
});
