import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  toApiError,
  toApiErrorWithFallback,
} from "./authApiError";

function axiosError(status: number, data: unknown) {
  return new axios.AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status,
      statusText: "Error",
      data,
      headers: {},
      config: {} as never,
    },
  );
}

describe("toApiError", () => {
  it("maps the API login envelope", () => {
    expect(
      toApiError(
        axiosError(401, {
          code: "invalid_credentials",
          message: "Invalid email or password.",
          details: null,
          traceId: "trace-1",
        }),
      ),
    ).toEqual({
      code: "invalid_credentials",
      message: "Invalid email or password.",
      details: undefined,
      traceId: "trace-1",
    });
  });

  it("returns null for ProblemDetails that only carry a title-less trace", () => {
    expect(
      toApiError(
        axiosError(400, {
          type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
          status: 400,
          traceId: "trace-2",
        }),
      ),
    ).toBeNull();
  });

  it("uses ProblemDetails title when message is missing", () => {
    expect(
      toApiError(
        axiosError(400, {
          title: "Bad Request",
          status: 400,
          traceId: "trace-3",
        }),
      ),
    ).toEqual({
      code: undefined,
      message: "Bad Request",
      details: undefined,
      traceId: "trace-3",
    });
  });
});

describe("toApiErrorWithFallback", () => {
  it("always provides a UI message", () => {
    expect(
      toApiErrorWithFallback(axiosError(401, ""), "Invalid email or password."),
    ).toEqual({
      code: undefined,
      message: "Invalid email or password.",
      details: undefined,
      traceId: undefined,
    });
  });

  it("keeps the server message when present", () => {
    expect(
      toApiErrorWithFallback(
        axiosError(401, {
          code: "invalid_credentials",
          message: "Invalid email or password.",
        }),
        "Unable to login. Please try again.",
      ).message,
    ).toBe("Invalid email or password.");
  });
});
