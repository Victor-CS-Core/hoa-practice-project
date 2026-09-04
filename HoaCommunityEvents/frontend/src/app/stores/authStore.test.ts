import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStore } from "./authStore";

const mockCurrent = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockClear = vi.hoisted(() => vi.fn());

vi.mock("../api/agent", () => ({
  Account: {
    current: () => mockCurrent(),
    login: (values: unknown) => mockLogin(values),
    register: (values: unknown) => mockRegister(values),
    logout: () => mockLogout(),
  },
}));

vi.mock("../queryClient", () => ({ queryClient: { clear: mockClear } }));

const resident = {
  displayName: "Resident One",
  username: "resident1",
  email: "resident1@hoa.local",
  role: "resident",
  profileImageUrl: null,
};

describe("AuthStore session state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("checks the server session even when local storage is empty", async () => {
    const store = new AuthStore({} as never);
    mockCurrent.mockResolvedValue(resident);

    await store.getCurrentUser();

    expect(mockCurrent).toHaveBeenCalledOnce();
    expect(store.loadingUser).toBe(false);
    expect(store.user).toEqual(resident);
  });

  it("treats an Axios 401 current-user response as signed out without logging out", async () => {
    const store = new AuthStore({} as never);
    store.user = resident;
    mockCurrent.mockRejectedValue(new AxiosError("Unauthorized", undefined, undefined, undefined, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
      data: {},
    }));

    await store.getCurrentUser();

    expect(store.loadingUser).toBe(false);
    expect(store.user).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("keeps the current user when restoring the session fails without a 401", async () => {
    const store = new AuthStore({} as never);
    store.user = resident;
    mockCurrent.mockRejectedValue(new Error("Network unavailable"));

    await store.getCurrentUser();

    expect(store.user).toEqual(resident);
  });

  it("clears cached server data after a successful login", async () => {
    const store = new AuthStore({} as never);
    mockLogin.mockResolvedValue(resident);

    await store.login({ email: resident.email, password: "Password123!" });

    expect(store.user).toEqual(resident);
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it("clears cached server data after a successful registration", async () => {
    const store = new AuthStore({} as never);
    mockRegister.mockResolvedValue(resident);

    await store.register({
      displayName: resident.displayName,
      username: resident.username,
      email: resident.email,
      password: "Password123!",
    });

    expect(store.user).toEqual(resident);
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it("waits for server logout before clearing signed-in state and cached data", async () => {
    const store = new AuthStore({} as never);
    store.user = resident;
    let resolveLogout!: () => void;
    mockLogout.mockReturnValue(new Promise<void>((resolve) => { resolveLogout = resolve; }));

    const pending = store.logout();

    expect(store.user).toEqual(resident);
    expect(mockClear).not.toHaveBeenCalled();
    resolveLogout();
    await pending;

    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it("keeps signed-in state and cached data when server logout fails", async () => {
    const store = new AuthStore({} as never);
    store.user = resident;
    mockLogout.mockRejectedValue(new Error("Server unavailable"));

    await expect(store.logout()).rejects.toThrow("Server unavailable");

    expect(store.user).toEqual(resident);
    expect(mockClear).not.toHaveBeenCalled();
  });
});
