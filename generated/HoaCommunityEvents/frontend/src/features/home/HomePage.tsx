import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStore } from "../../app/stores/store";

export const HomePage = observer(function HomePage() {
  const { authStore } = useStore();

  return (
    <section>
      <h1>HOA Community Events</h1>
      <p>Single-page app shell is active.</p>
      {authStore.user ? (
        <p>Welcome back, {authStore.user.displayName}.</p>
      ) : (
        <p>Please login or register to continue.</p>
      )}
      <p>
        <Link to="/events">Browse community events</Link>
      </p>
    </section>
  );
});
