import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../../app/stores/store";
import type { LoginFormValues } from "../../types/user";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthLayout } from "./components/AuthLayout";
import { AuthBanner } from "./components/AuthBanner";
import {
  getFieldError,
  toApiError,
  type ApiErrorEnvelope,
} from "./authApiError";

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<ApiErrorEnvelope | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>();

  useEffect(() => {
    if (authStore.isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [authStore.isLoggedIn, navigate]);

  useEffect(() => {
    if (sessionStorage.getItem("sessionExpired") === "1") {
      setSessionExpired(true);
      sessionStorage.removeItem("sessionExpired");
    }
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    setSessionExpired(false);

    try {
      await authStore.login(values);
      navigate("/");
    } catch (error) {
      const next = toApiError(error);
      setApiError(next ?? { message: "Unable to login. Please try again." });
    }
  };

  if (authStore.loadingUser && !authStore.isLoggedIn) {
    return (
      <AuthLayout title="Restoring session">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-600" />
          <p className="font-medium text-stone-500">
            Restoring your session...
          </p>
        </div>
      </AuthLayout>
    );
  }

  const emailError = getFieldError(apiError?.details, "Email");
  const passwordError = getFieldError(apiError?.details, "Password");

  const showValidationBanner = apiError?.code === "validation_failed";
  const showMessageBanner = !!apiError?.message && !showValidationBanner;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Use your community account credentials to log in."
    >
      {sessionExpired && (
        <AuthBanner
          type="warning"
          message="Your session expired. Please log in again."
        />
      )}
      {showValidationBanner && (
        <AuthBanner type="error" message="Please fix the highlighted fields." />
      )}
      {showMessageBanner && (
        <AuthBanner
          type="error"
          message={apiError?.message ?? "Login failed."}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className={`text-sm ${emailError ? "text-red-600" : "text-stone-700"}`}
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={
              emailError ? "border-red-300 focus-visible:ring-red-500" : ""
            }
            {...register("email", { required: true })}
          />
          {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className={`text-sm ${passwordError ? "text-red-600" : "text-stone-700"}`}
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            disabled={isSubmitting}
            className={
              passwordError ? "border-red-300 focus-visible:ring-red-500" : ""
            }
            {...register("password", { required: true })}
          />
          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-auto w-full py-2.5 text-white disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-stone-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});
