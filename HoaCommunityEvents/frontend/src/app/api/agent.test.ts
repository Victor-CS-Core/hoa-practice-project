import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Account, agent, Events, resetCsrfTokenCache } from "./agent";

type Request = AxiosRequestConfig & { url?: string; method?: string };

const requests: Request[] = [];

beforeEach(() => {
  requests.length = 0;
  resetCsrfTokenCache();
  agent.defaults.adapter = async (config) => {
    requests.push(config);
    if (config.url === "/security/csrf") {
      return { data: { requestToken: "csrf-one" }, status: 200, statusText: "OK", headers: {}, config };
    }
    return { data: {}, status: 200, statusText: "OK", headers: {}, config };
  };
});

afterEach(() => {
  resetCsrfTokenCache();
});

describe("BFF API client", () => {
  it("uses same-origin cookies without a bearer token", async () => {
    globalThis.localStorage?.setItem("jwt", "stale-legacy-token");
    await Account.current();

    const request = requests.at(-1)!;
    expect(agent.defaults.baseURL).toBe("/api");
    expect(agent.defaults.withCredentials).toBe(true);
    expect(request.headers?.Authorization).toBeUndefined();
  });

  it("adds the antiforgery header to unsafe API requests", async () => {
    await Events.cancel("event-1");

    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe("/security/csrf");
    expect(requests[1].headers?.["X-CSRF-TOKEN"]).toBe("csrf-one");
  });

  it("shares one antiforgery bootstrap for concurrent unsafe requests", async () => {
    await Promise.all([Events.cancel("event-1"), Events.publish("event-2")]);

    expect(requests.filter((request) => request.url === "/security/csrf")).toHaveLength(1);
    expect(requests.filter((request) => request.url !== "/security/csrf").every(
      (request) => request.headers?.["X-CSRF-TOKEN"] === "csrf-one",
    )).toBe(true);
  });

  it("does not cache a stale in-flight antiforgery response after invalidation", async () => {
    let resolveStaleToken!: (token: string) => void;
    const staleToken = new Promise<string>((resolve) => { resolveStaleToken = resolve; });
    let csrfRequests = 0;

    agent.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/security/csrf") {
        csrfRequests += 1;
        const requestToken = csrfRequests === 1 ? await staleToken : "csrf-current";
        return { data: { requestToken }, status: 200, statusText: "OK", headers: {}, config };
      }
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };

    const oldRequest = Events.cancel("event-1");
    await Promise.resolve();
    resetCsrfTokenCache();
    await Events.publish("event-2");
    resolveStaleToken("csrf-stale");
    await oldRequest;
    await Events.unpublish("event-3");

    expect(csrfRequests).toBe(2);
    expect(requests.at(-1)?.headers?.["X-CSRF-TOKEN"]).toBe("csrf-current");
  });

  it("refreshes the antiforgery token after each successful identity transition", async () => {
    await Account.login({ email: "resident@example.com", password: "Password123!" });
    await Events.cancel("event-1");
    await Account.register({
      displayName: "Resident",
      username: "resident",
      email: "resident@example.com",
      password: "Password123!",
    });
    await Events.cancel("event-1");
    await Account.logout();
    await Events.cancel("event-1");

    expect(requests.filter((request) => request.url === "/security/csrf")).toHaveLength(4);
  });

  it("does not treat a failed login 401 as session expiry", async () => {
    sessionStorage.clear();
    agent.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/security/csrf") {
        return { data: { requestToken: "csrf-one" }, status: 200, statusText: "OK", headers: {}, config };
      }
      if (config.url === "/account/login") {
        throw new AxiosError(
          "Request failed",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          {
            status: 401,
            statusText: "Unauthorized",
            data: { code: "invalid_credentials", message: "Invalid email or password." },
            headers: {},
            config,
          },
        );
      }
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };

    await expect(
      Account.login({ email: "resident@example.com", password: "wrong" }),
    ).rejects.toBeTruthy();
    expect(sessionStorage.getItem("sessionExpired")).toBeNull();
  });

  it("marks session expiry for authenticated request 401s", async () => {
    sessionStorage.clear();
    agent.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/security/csrf") {
        return { data: { requestToken: "csrf-one" }, status: 200, statusText: "OK", headers: {}, config };
      }
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          status: 401,
          statusText: "Unauthorized",
          data: { message: "Authentication is required." },
          headers: {},
          config,
        },
      );
    };

    await expect(Events.cancel("event-1")).rejects.toBeTruthy();
    expect(sessionStorage.getItem("sessionExpired")).toBe("1");
  });
});
