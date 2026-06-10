import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStore } from "./authStore";

const mockCurrent = vi.fn();

vi.mock("../api/agent", () => ({
  Account: {
    current: () => mockCurrent(),
  },
}));

describe("AuthStore session state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("clears loading state when no token exists", async () => {
    const store = new AuthStore({} as never);

    await store.getCurrentUser();

    expect(store.loadingUser).toBe(false);
    expect(store.user).toBeNull();
  });

  it("rehydrates user from token without losing state", async () => {
    const store = new AuthStore({} as never);
    localStorage.setItem("jwt", "fake-token");

    mockCurrent.mockResolvedValue({
      displayName: "Resident One",
      username: "resident1",
      email: "resident1@hoa.local",
      token: "fake-token",
      role: "resident",
      profileImageUrl: null,
    });

    await store.getCurrentUser();

    expect(store.loadingUser).toBe(false);
    expect(store.isLoggedIn).toBe(true);
    expect(store.user?.username).toBe("resident1");
  });

  it("logout clears token and signed-in state", () => {
    const store = new AuthStore({} as never);

    store.user = {
      displayName: "Resident One",
      username: "resident1",
      email: "resident1@hoa.local",
      token: "fake-token",
      role: "resident",
      profileImageUrl: null,
    };
    localStorage.setItem("jwt", "fake-token");

    store.logout();

    expect(localStorage.getItem("jwt")).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
  });
});
