import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../../app/stores/store";
import type { RegisterFormValues } from "../../types/user";
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

export const RegisterPage = observer(function RegisterPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<ApiErrorEnvelope | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>();

  useEffect(() => {
    if (authStore.isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [authStore.isLoggedIn, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);

    try {
      await authStore.register(values);
      navigate("/");
    } catch (error) {
      const next = toApiError(error);
      setApiError(
        next ?? { message: "Unable to create account. Please try again." },
      );
    }
  };

  const displayNameError = getFieldError(apiError?.details, "DisplayName");
  const usernameError = getFieldError(apiError?.details, "Username");
  const emailError = getFieldError(apiError?.details, "Email");
  const passwordError = getFieldError(apiError?.details, "Password");

  const showValidationBanner = apiError?.code === "validation_failed";
  const showMessageBanner = !!apiError?.message && !showValidationBanner;

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your resident profile to RSVP, follow board updates, and stay in neighborhood sync."
    >
      {showValidationBanner && (
        <AuthBanner type="error" message="Please fix the highlighted fields." />
      )}
      {showMessageBanner && (
        <AuthBanner
          type="error"
          message={apiError?.message ?? "Registration failed."}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="auth-motion-item auth-motion-delay-1 space-y-2">
          <label
            htmlFor="displayName"
            className={`font-auth-ui text-sm tracking-[0.02em] ${displayNameError ? "text-danger-display" : ""}`}
          >
            Display Name
          </label>
          <Input
            id="displayName"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!displayNameError}
            aria-describedby={
              displayNameError ? "register-displayName-error" : undefined
            }
            className={
              displayNameError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("displayName", { required: true })}
          />
          {displayNameError && (
            <p
              id="register-displayName-error"
              className="text-sm text-danger-display"
            >
              {displayNameError}
            </p>
          )}
        </div>

        <div className="auth-motion-item auth-motion-delay-2 space-y-2">
          <label
            htmlFor="username"
            className={`font-auth-ui text-sm tracking-[0.02em] ${usernameError ? "text-danger-display" : ""}`}
          >
            Username
          </label>
          <Input
            id="username"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!usernameError}
            aria-describedby={
              usernameError ? "register-username-error" : undefined
            }
            className={
              usernameError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("username", { required: true })}
          />
          {usernameError && (
            <p
              id="register-username-error"
              className="text-sm text-danger-display"
            >
              {usernameError}
            </p>
          )}
        </div>

        <div className="auth-motion-item auth-motion-delay-3 space-y-2">
          <label
            htmlFor="email"
            className={`font-auth-ui text-sm tracking-[0.02em] ${emailError ? "text-danger-display" : ""}`}
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            disabled={isSubmitting}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "register-email-error" : undefined}
            className={
              emailError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("email", { required: true })}
          />
          {emailError && (
            <p
              id="register-email-error"
              className="text-sm text-danger-display"
            >
              {emailError}
            </p>
          )}
        </div>

        <div className="auth-motion-item auth-motion-delay-4 space-y-2">
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
              passwordError ? "register-password-error" : undefined
            }
            className={
              passwordError ? "border-danger focus-visible:ring-danger" : ""
            }
            {...register("password", { required: true })}
          />
          {passwordError && (
            <p
              id="register-password-error"
              className="text-sm text-danger-display"
            >
              {passwordError}
            </p>
          )}
        </div>

        <p className="auth-motion-item auth-motion-delay-4 rounded-lg border border-hairline bg-surface px-3 py-2 text-xs leading-relaxed text-ink-muted">
          Your profile is used only for {BRAND.communityLabel} communication,
          participation tracking, and secure resident access.
        </p>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="auth-motion-item auth-motion-delay-5 h-auto w-full py-2.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating resident profile...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="auth-motion-item auth-motion-delay-5 mt-8 text-center">
        <p className="text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-accent-display hover:text-accent"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});
