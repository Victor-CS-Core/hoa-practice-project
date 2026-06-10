import { createElement, lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { ErrorPage } from "../../features/errors/ErrorPage";

const homePageRoute = lazy(() =>
  import("../../features/home/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const loginPageRoute = lazy(() =>
  import("../../features/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const registerPageRoute = lazy(() =>
  import("../../features/auth/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const profilePageRoute = lazy(() =>
  import("../../features/profiles/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const eventListPageRoute = lazy(() =>
  import("../../features/events/EventListPage").then((module) => ({
    default: module.EventListPage,
  })),
);
const eventDetailsPageRoute = lazy(() =>
  import("../../features/events/EventDetailsPage").then((module) => ({
    default: module.EventDetailsPage,
  })),
);
const eventFormPageRoute = lazy(() =>
  import("../../features/events/EventFormPage").then((module) => ({
    default: module.EventFormPage,
  })),
);
const adminAttendeesPageRoute = lazy(() =>
  import("../../features/events/AdminAttendeesPage").then((module) => ({
    default: module.AdminAttendeesPage,
  })),
);
const adminDashboardPageRoute = lazy(() =>
  import("../../features/events/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const notFoundPageRoute = lazy(() =>
  import("../../features/errors/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const implementationPageRoute = lazy(() =>
  import("../../features/home/ImplementationPage").then((module) => ({
    default: module.ImplementationPage,
  })),
);

function withPageLoader(element: ReactNode) {
  return <Suspense fallback={<p>Loading page...</p>}>{element}</Suspense>;
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: withPageLoader(
          <ProtectedRoute>{createElement(homePageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "home",
        element: withPageLoader(
          <ProtectedRoute>{createElement(homePageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "implementation",
        element: withPageLoader(
          <ProtectedRoute>{createElement(implementationPageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "login",
        element: withPageLoader(createElement(loginPageRoute)),
      },
      {
        path: "register",
        element: withPageLoader(createElement(registerPageRoute)),
      },
      {
        path: "profile/:username",
        element: withPageLoader(
          <ProtectedRoute>{createElement(profilePageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "events",
        element: withPageLoader(
          <ProtectedRoute>{createElement(eventListPageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "events/:id",
        element: withPageLoader(
          <ProtectedRoute>{createElement(eventDetailsPageRoute)}</ProtectedRoute>,
        ),
      },
      {
        path: "events/create",
        element: withPageLoader(
          <ProtectedRoute requireAdmin>
            {createElement(eventFormPageRoute)}
          </ProtectedRoute>,
        ),
      },
      {
        path: "events/:id/edit",
        element: withPageLoader(
          <ProtectedRoute requireAdmin>
            {createElement(eventFormPageRoute)}
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/events",
        element: withPageLoader(
          <ProtectedRoute requireAdmin>
            {createElement(adminDashboardPageRoute)}
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin/attendees",
        element: withPageLoader(
          <ProtectedRoute requireAdmin>
            {createElement(adminAttendeesPageRoute)}
          </ProtectedRoute>,
        ),
      },
      {
        path: "*",
        element: withPageLoader(
          <ProtectedRoute>{createElement(notFoundPageRoute)}</ProtectedRoute>,
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
