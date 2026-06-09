import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { HomePage } from "../../features/home/HomePage";
import { LoginPage } from "../../features/auth/LoginPage";
import { RegisterPage } from "../../features/auth/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { ProfilePage } from "../../features/profiles/ProfilePage";
import { EventListPage } from "../../features/events/EventListPage";
import { EventDetailsPage } from "../../features/events/EventDetailsPage";
import { EventFormPage } from "../../features/events/EventFormPage";
import { ErrorPage } from "../../features/errors/ErrorPage";
import { NotFoundPage } from "../../features/errors/NotFoundPage";
import { ImplementationPage } from "../../features/home/ImplementationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "implementation",
        element: <ImplementationPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "profile/:username",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events",
        element: <EventListPage />,
      },
      {
        path: "events/:id",
        element: <EventDetailsPage />,
      },
      {
        path: "events/create",
        element: (
          <ProtectedRoute requireAdmin>
            <EventFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id/edit",
        element: (
          <ProtectedRoute requireAdmin>
            <EventFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
