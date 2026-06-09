import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import type { RegisterFormValues } from "../../types/user";

export const RegisterPage = observer(function RegisterPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<RegisterFormValues>();

  const onSubmit = async (values: RegisterFormValues) => {
    await authStore.register(values);
    navigate("/");
  };

  return (
    <section>
      <h2>Register</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 8, maxWidth: 360 }}
      >
        <input
          placeholder="Display Name"
          {...register("displayName", { required: true })}
        />
        <input
          placeholder="Username"
          {...register("username", { required: true })}
        />
        <input placeholder="Email" {...register("email", { required: true })} />
        <input
          placeholder="Password"
          type="password"
          {...register("password", { required: true })}
        />
        <button type="submit">Create Account</button>
      </form>
    </section>
  );
});
