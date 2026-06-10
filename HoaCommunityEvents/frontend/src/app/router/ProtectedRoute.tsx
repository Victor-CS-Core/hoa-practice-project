import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/store";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export const ProtectedRoute = observer(function ProtectedRoute({
  children,
  requireAdmin = false,
}: Props) {
  const { authStore } = useStore();

  if (authStore.loadingUser) {
    return <p>Checking session...</p>;
  }

  if (!authStore.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !authStore.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
});
