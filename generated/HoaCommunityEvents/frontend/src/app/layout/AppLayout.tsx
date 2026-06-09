import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/store";

export const AppLayout = observer(function AppLayout() {
  const { authStore } = useStore();

  useEffect(() => {
    void authStore.getCurrentUser();
  }, [authStore]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px" }}>
      <header
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>
        {!authStore.isLoggedIn && <Link to="/login">Login</Link>}
        {!authStore.isLoggedIn && <Link to="/register">Register</Link>}
        {authStore.isLoggedIn && authStore.user && (
          <Link to={`/profile/${authStore.user.username}`}>Profile</Link>
        )}
        {authStore.isAdmin && <Link to="/events/create">Create Event</Link>}
        {authStore.isLoggedIn && (
          <button type="button" onClick={authStore.logout}>
            Logout
          </button>
        )}
      </header>
      <Outlet />
    </div>
  );
});
