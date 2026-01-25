import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { SupabaseMissing } from "@/components/SupabaseMissing";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isReady } = useSession();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (isReady && user) navigate("/onboarding/goals", { replace: true });
  }, [isReady, user, navigate]);

  const handleLogin = async (values: LoginValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!hasSupabaseEnv) {
      setErrorMsg("Supabase não está configurado.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate("/onboarding/goals", { replace: true });
  };

  const handleSignup = async (values: SignupValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!hasSupabaseEnv) {
      setErrorMsg("Supabase não está configurado.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg(
      "Conta criada. Se a confirmação por e-mail estiver habilitada no Supabase, verifique sua caixa de entrada.",
    );
  };

  const form = mode === "login" ? loginForm : signupForm;

  return (
    <div className="min-h-dvh bg-background px-4 pb-10 pt-10 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold">
            <span className="text-base font-extrabold text-black">R</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rotinas, hábitos, metas e comunidade — com gamificação e propósito.
          </p>
        </div>

        {!hasSupabaseEnv ? (
          <div className="mb-6">
            <SupabaseMissing />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={
              mode === "login"
                ? "h-10 rounded-xl bg-background text-sm font-semibold"
                : "h-10 rounded-xl text-sm text-muted-foreground"
            }
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={
              mode === "signup"
                ? "h-10 rounded-xl bg-background text-sm font-semibold"
                : "h-10 rounded-xl text-sm text-muted-foreground"
            }
          >
            Criar conta
          </button>
        </div>

        <form
          className="mt-4 space-y-3 rounded-3xl border border-border bg-card p-5"
          onSubmit={
            mode === "login"
              ? loginForm.handleSubmit(handleLogin)
              : signupForm.handleSubmit(handleSignup)
          }
        >
          {mode === "signup" ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Nome
              </label>
              <input
                {...signupForm.register("name")}
                placeholder="Seu nome"
                className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              {signupForm.formState.errors.name ? (
                <p className="text-xs text-brand-red">
                  {signupForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              {...(mode === "login"
                ? loginForm.register("email")
                : signupForm.register("email"))}
              placeholder="voce@email.com"
              inputMode="email"
              className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            {mode === "login" && loginForm.formState.errors.email ? (
              <p className="text-xs text-brand-red">
                {loginForm.formState.errors.email.message}
              </p>
            ) : null}
            {mode === "signup" && signupForm.formState.errors.email ? (
              <p className="text-xs text-brand-red">
                {signupForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Senha
            </label>
            <input
              {...(mode === "login"
                ? loginForm.register("password")
                : signupForm.register("password"))}
              placeholder="••••••••"
              type="password"
              className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            {mode === "login" && loginForm.formState.errors.password ? (
              <p className="text-xs text-brand-red">
                {loginForm.formState.errors.password.message}
              </p>
            ) : null}
            {mode === "signup" && signupForm.formState.errors.password ? (
              <p className="text-xs text-brand-red">
                {signupForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {errorMsg ? (
            <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 p-3 text-xs text-brand-red">
              {errorMsg}
            </div>
          ) : null}

          {successMsg ? (
            <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-3 text-xs text-brand-gold">
              {successMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Ao continuar você concorda em manter respeito e segurança na
            comunidade.
          </p>
        </form>
      </div>
    </div>
  );
}
