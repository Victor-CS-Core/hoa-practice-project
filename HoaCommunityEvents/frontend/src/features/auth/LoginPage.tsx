import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../../app/stores/store";
import type { LoginFormValues } from "../../types/user";
import { Button } from "../../components/design-system/ui/button";
import { Input } from "../../components/design-system/ui/input";
import { AuthLayout } from "./components/AuthLayout";
import { AuthBanner } from "./components/AuthBanner";
import { BRAND } from "../../app/branding";
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
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
          <p className="font-medium text-ink-muted">
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
      title="Welcome back, neighbor"
      subtitle="Sign in to check upcoming Cedar Grove events, neighborhood updates, and resident notices."
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
        <div className="auth-motion-item auth-motion-delay-1 space-y-2">
          <label
            htmlFor="email"
            className={`font-auth-ui text-sm tracking-[0.02em] ${emailError ? "text-danger-display" : ""}`}
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@neighborhood.org"
            disabled={isSubmitting}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "login-email-error" : undefined}
            className={
              emailError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("email", { required: true })}
          />
          {emailError && (
            <p id="login-email-error" className="text-sm text-danger-display">
              {emailError}
            </p>
          )}
        </div>

        <div className="auth-motion-item auth-motion-delay-2 space-y-2">
          <label
            htmlFor="password"
            className={`font-auth-ui text-sm tracking-[0.02em] ${passwordError ? "text-danger-display" : ""}`}
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            disabled={isSubmitting}
            aria-invalid={!!passwordError}
            aria-describedby={
              passwordError ? "login-password-error" : undefined
            }
            className={
              passwordError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("password", { required: true })}
          />
          {passwordError && (
            <p
              id="login-password-error"
              className="text-sm text-danger-display"
            >
              {passwordError}
            </p>
          )}
        </div>

        <p className="auth-motion-item auth-motion-delay-3 rounded-lg border border-hairline bg-surface px-3 py-2 text-xs leading-relaxed text-ink-muted">
          Your {BRAND.communityLabel} account keeps event updates tied to your
          resident profile.
        </p>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="auth-motion-item auth-motion-delay-4 h-auto w-full py-2.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Unlocking portal...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <div className="auth-motion-item auth-motion-delay-5 mt-8 text-center">
        <p className="text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-accent-display hover:text-accent"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});
