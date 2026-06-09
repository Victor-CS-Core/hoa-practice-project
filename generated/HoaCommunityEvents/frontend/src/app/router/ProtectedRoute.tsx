import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/store";

type Props = {
  children: React.ReactNode;
};

export const ProtectedRoute = observer(function ProtectedRoute({
  children,
}: Props) {
  const { authStore } = useStore();

  if (!authStore.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
});
