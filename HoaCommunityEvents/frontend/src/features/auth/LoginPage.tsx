import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../../app/stores/store";
import type { LoginFormValues } from "../../types/user";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useTheme } from "../../app/theme/theme-context";
import { AuthLayout } from "./components/AuthLayout";
import { AuthBanner } from "./components/AuthBanner";
import {
  getFieldError,
  toApiError,
  type ApiErrorEnvelope,
} from "./authApiError";

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
      title="Welcome back, neighbor"
      subtitle="Sign in to check upcoming HOA meetings, event updates, and resident notices."
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
            className={`font-auth-ui text-sm font-medium tracking-[0.02em] ${emailError ? "text-[#b73f28]" : isDark ? "text-[#b8cadf]" : "text-[#5f412e]"}`}
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
              emailError
                ? "border-[#cf6345] focus-visible:ring-[#cf6345]"
                : isDark
                  ? "border-[#35465e] bg-[#0f1826] text-[#eaf4ff] placeholder:text-[#8ea5bf] focus-visible:ring-[#2d8d67]"
                  : "border-[#d7b087] bg-[#fffcf5] focus-visible:ring-[#4d7a52]"
            }
            {...register("email", { required: true })}
          />
          {emailError && (
            <p id="login-email-error" className="text-sm text-[#b73f28]">
              {emailError}
            </p>
          )}
        </div>

        <div className="auth-motion-item auth-motion-delay-2 space-y-2">
          <label
            htmlFor="password"
            className={`font-auth-ui text-sm font-medium tracking-[0.02em] ${passwordError ? "text-[#b73f28]" : isDark ? "text-[#b8cadf]" : "text-[#5f412e]"}`}
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
              passwordError
                ? "border-[#cf6345] focus-visible:ring-[#cf6345]"
                : isDark
                  ? "border-[#35465e] bg-[#0f1826] text-[#eaf4ff] focus-visible:ring-[#2d8d67]"
                  : "border-[#d7b087] bg-[#fffcf5] focus-visible:ring-[#4d7a52]"
            }
            {...register("password", { required: true })}
          />
          {passwordError && (
            <p id="login-password-error" className="text-sm text-[#b73f28]">
              {passwordError}
            </p>
          )}
        </div>

        <p
          className={`auth-motion-item auth-motion-delay-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            isDark
              ? "border-[#2d4057] bg-[#132033] text-[#a9bfd8]"
              : "border-[#e5cfb4] bg-[#f9f2e5] text-[#694a32]"
          }`}
        >
          Your HOA account keeps event updates tied to your resident profile.
        </p>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`auth-motion-item auth-motion-delay-4 h-auto w-full border py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
            isDark
              ? "border-[#2e8f67] bg-[#1f815c] text-[#eafff6] hover:bg-[#1a6f4f]"
              : "border-[#2e5f3b] bg-[#356b43] text-[#fff8ea] hover:bg-[#2e5f3b]"
          }`}
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
        <p
          className={`text-sm ${isDark ? "text-[#98acc4]" : "text-[#745743]"}`}
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className={`font-semibold ${isDark ? "text-[#70d6ad] hover:text-[#8cebc6]" : "text-[#af5f19] hover:text-[#8e4d14]"}`}
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});
