import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

// Updated: Added nickname field and confirm password field

const loginSchema = z.object({
  emailOrNickname: z.string().min(1, "Informe email ou nickname"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  nickname: z.string().min(3, "Nickname deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  confirmPassword: z.string().min(6, "Mínimo de 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
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
    defaultValues: { emailOrNickname: "", password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", nickname: "", email: "", password: "", confirmPassword: "" },
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

    // Verificar se é email ou nickname
    let email = values.emailOrNickname;
    const isEmail = values.emailOrNickname.includes("@");
    
    if (!isEmail) {
      // Buscar email pelo nickname
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("nickname", values.emailOrNickname)
        .maybeSingle();
      
      if (profileError || !profileData?.email) {
        setErrorMsg("Nickname ou email não encontrado.");
        return;
      }
      
      email = profileData.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
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

    // Verificar se nickname já existe
    const { data: existingNickname, error: nicknameCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("nickname", values.nickname)
      .maybeSingle();

    if (nicknameCheckError && nicknameCheckError.code !== "PGRST116") {
      // PGRST116 é o código quando não encontra nenhum resultado, que é esperado
      console.error("Erro ao verificar nickname:", nicknameCheckError);
    }

    if (existingNickname) {
      setErrorMsg("Este nickname já está em uso.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          nickname: values.nickname,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Criar perfil com nickname
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          nickname: values.nickname,
          name: values.name,
        });

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
      }
    }

    if (data.session) {
      navigate("/onboarding/goals", { replace: true });
      return;
    }

    // Mesmo sem sessão, redirecionar para metas após primeiro cadastro
    navigate("/onboarding/goals", { replace: true });
  };

  const form = mode === "login" ? loginForm : signupForm;

  return (
    <div className="min-h-dvh bg-background px-4 pb-10 pt-10 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold">
            <span className="text-base font-extrabold text-black">R</span>
          </div>
        </div>

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
              <input
                {...signupForm.register("name")}
                placeholder="Nome"
                className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              {signupForm.formState.errors.name ? (
                <p className="text-xs text-brand-red">
                  {signupForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {mode === "signup" ? (
            <div className="space-y-2">
              <input
                {...signupForm.register("nickname")}
                placeholder="Nickname"
                className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              {signupForm.formState.errors.nickname ? (
                <p className="text-xs text-brand-red">
                  {signupForm.formState.errors.nickname.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            {mode === "login" ? (
              <label className="text-xs font-medium text-muted-foreground">
                Email ou Nickname
              </label>
            ) : null}
            <input
              {...(mode === "login"
                ? loginForm.register("emailOrNickname")
                : signupForm.register("email"))}
              placeholder={mode === "signup" ? "Email" : "Email ou nickname"}
              inputMode={mode === "login" ? "text" : "email"}
              className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            {mode === "login" && loginForm.formState.errors.emailOrNickname ? (
              <p className="text-xs text-brand-red">
                {loginForm.formState.errors.emailOrNickname.message}
              </p>
            ) : null}
            {mode === "signup" && signupForm.formState.errors.email ? (
              <p className="text-xs text-brand-red">
                {signupForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {mode === "login" ? (
              <label className="text-xs font-medium text-muted-foreground">
                Senha
              </label>
            ) : null}
            <input
              {...(mode === "login"
                ? loginForm.register("password")
                : signupForm.register("password"))}
              placeholder={mode === "signup" ? "Senha" : ""}
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

          {mode === "signup" ? (
            <div className="space-y-2">
              <input
                {...signupForm.register("confirmPassword")}
                placeholder="Confirme sua senha"
                type="password"
                className="h-11 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              {signupForm.formState.errors.confirmPassword ? (
                <p className="text-xs text-brand-red">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
