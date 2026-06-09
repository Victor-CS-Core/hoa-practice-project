import { observer } from "mobx-react-lite";
import { useStore } from "../../app/stores/store";

export const ProfilePage = observer(function ProfilePage() {
  const { authStore } = useStore();

  if (!authStore.user) {
    return <p>Profile not available.</p>;
  }

  return (
    <section>
      <h2>Profile</h2>
      <p>Display name: {authStore.user.displayName}</p>
      <p>Username: {authStore.user.username}</p>
      <p>Email: {authStore.user.email}</p>
      <p>Role: {authStore.user.role}</p>
    </section>
  );
});
