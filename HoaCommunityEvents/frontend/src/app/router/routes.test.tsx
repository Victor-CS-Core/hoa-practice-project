import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "./routes";

const mockUseStore = vi.fn();

vi.mock("../stores/store", () => ({
  useStore: () => mockUseStore(),
}));

vi.mock("../layout/AppLayout", () => ({
  AppLayout: () => (
    <div data-testid="layout-shell">
      <Outlet />
    </div>
  ),
}));

vi.mock("../../features/home/HomePage", () => ({
  HomePage: () => <h1>Home Page</h1>,
}));

vi.mock("../../features/auth/LoginPage", () => ({
  LoginPage: () => <h1>Login Page</h1>,
}));

vi.mock("../../features/events/EventListPage", () => ({
  EventListPage: () => <h1>Events Page</h1>,
}));

describe("Root/Home auth routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests from / to /login", async () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isLoggedIn: false,
        isAdmin: false,
        loadingUser: false,
        user: null,
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
      },
    });

    const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects guests from /home to /login", async () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isLoggedIn: false,
        isAdmin: false,
        loadingUser: false,
        user: null,
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
      },
    });

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/home"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("allows signed-in users to access /home", async () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isLoggedIn: true,
        isAdmin: false,
        loadingUser: false,
        user: { username: "resident1", role: "resident" },
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
      },
    });

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/home"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });

  it("redirects guests from /events to /login", async () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isLoggedIn: false,
        isAdmin: false,
        loadingUser: false,
        user: null,
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
      },
    });

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/events"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("allows signed-in users to access /events", async () => {
    mockUseStore.mockReturnValue({
      authStore: {
        isLoggedIn: true,
        isAdmin: false,
        loadingUser: false,
        user: { username: "resident1", role: "resident" },
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
      },
    });

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/events"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Events Page")).toBeInTheDocument();
  });
});
