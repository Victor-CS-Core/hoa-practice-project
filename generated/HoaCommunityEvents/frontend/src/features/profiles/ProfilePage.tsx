import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import { useProfile, useUpdateProfile } from "../../hooks/useProfile";
import type { UpdateProfileValues } from "../../types/profile";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

export const ProfilePage = observer(function ProfilePage() {
  const { username } = useParams();
  const { authStore } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data, isLoading, isError } = useProfile(username);
  const updateMutation = useUpdateProfile();

  const { register, handleSubmit, reset } = useForm<UpdateProfileValues>({
    defaultValues: {
      displayName: "",
      bio: "",
      profileImageUrl: "",
    },
  });

  useEffect(() => {
    if (!data) return;

    reset({
      displayName: data.displayName,
      bio: data.bio ?? "",
      profileImageUrl: data.profileImageUrl ?? "",
    });
  }, [data, reset]);

  if (!authStore.user || !username) {
    return <p>Profile not available.</p>;
  }

  if (isLoading) return <p>Loading profile...</p>;
  if (isError || !data) return <p>Profile not found.</p>;

  const isOwnProfile =
    authStore.user.username.toLowerCase() === username.toLowerCase();

  const onSubmit = async (values: UpdateProfileValues) => {
    setSubmitError(null);

    try {
      await updateMutation.mutateAsync({ username, values });

      if (isOwnProfile) {
        await authStore.getCurrentUser();
      }

      setIsEditing(false);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to update profile."));
    }
  };

  return (
    <section>
      <h2>Profile</h2>

      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "grid", gap: 8, maxWidth: 520 }}
        >
          <input
            placeholder="Display name"
            {...register("displayName", { required: true })}
          />
          <textarea placeholder="Bio" {...register("bio")} />
          <input
            placeholder="Profile image URL"
            {...register("profileImageUrl")}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          {submitError && <p>{submitError}</p>}
        </form>
      ) : (
        <>
          <p>Display name: {data.displayName}</p>
          <p>Username: {data.username}</p>
          <p>Email: {data.email}</p>
          <p>Role: {data.role}</p>
          {data.bio && <p>Bio: {data.bio}</p>}
          {data.profileImageUrl && <p>Profile image: {data.profileImageUrl}</p>}
          {isOwnProfile && (
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </>
      )}
    </section>
  );
});
