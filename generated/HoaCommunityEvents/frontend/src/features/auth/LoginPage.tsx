import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../app/stores/store";
import type { LoginFormValues } from "../../types/user";

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    await authStore.login(values);
    navigate("/");
  };

  return (
    <section>
      <h2>Login</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 8, maxWidth: 360 }}
      >
        <input placeholder="Email" {...register("email", { required: true })} />
        <input
          placeholder="Password"
          type="password"
          {...register("password", { required: true })}
        />
        <button type="submit">Login</button>
      </form>
    </section>
  );
});
