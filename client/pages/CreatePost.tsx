import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Target } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/SupabaseMissing";

type UserGoalOption = {
  id: string;
  type_goal: number;
  duration: number;
  quantity: number;
  goals?: { description: string } | null;
};

function typeGoalLabel(typeGoal: number) {
  if (typeGoal === 1) return "Treino";
  if (typeGoal === 2) return "Dieta";
  if (typeGoal === 3) return "Hábito";
  return `Tipo ${typeGoal}`;
}

export default function CreatePostPage() {
  const { user } = useSession();
  const [description, setDescription] = useState("");
  const [userGoalsId, setUserGoalsId] = useState<string>("");

  const goalsQuery = useQuery({
    queryKey: ["user_goals", user?.id ?? "anonymous"],
    enabled: Boolean(hasSupabaseEnv && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("id,type_goal,duration,quantity,goals(description)")
        .eq("user_id", user!.id)
        .order("id", { ascending: false })
        .limit(25);

      if (error) throw error;
      return (data ?? []) as unknown as UserGoalOption[];
    },
  });

  const canSubmit = Boolean(user && hasSupabaseEnv && userGoalsId);

  const submit = async () => {
    if (!canSubmit) {
      toast.error("Selecione uma meta e faça login");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user!.id,
      user_goals_id: userGoalsId,
      description: description.trim() ? description.trim() : null,
      photo: null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setDescription("");
    setUserGoalsId("");
    toast.success("Post criado");
  };

  return (
    <div className="space-y-4">
      {!hasSupabaseEnv ? <SupabaseMissing /> : null}

      <div className="rounded-3xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold">Criar post</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo post é vinculado a uma meta (<code>user_goals</code>). Esse é o
          motor de consistência do RitmoFit.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Mídia</div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40">
            <ImagePlus className="h-4 w-4 text-brand-gold" />
          </div>
        </div>
        <div className="mt-4 flex aspect-square w-full items-center justify-center rounded-3xl border border-dashed border-border bg-background/40">
          <div className="text-center">
            <div className="text-sm font-semibold">Upload (em breve)</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Vamos integrar com Supabase Storage.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Meta vinculada</div>
        <div className="mt-3">
          <label className="text-xs font-medium text-muted-foreground">
            Selecione uma meta
          </label>
          <div className="mt-2 rounded-2xl border border-border bg-background/40 p-2">
            <select
              value={userGoalsId}
              onChange={(e) => setUserGoalsId(e.target.value)}
              className="h-10 w-full rounded-xl bg-transparent px-3 text-sm outline-none"
              disabled={!user}
            >
              <option value="">{user ? "Escolha..." : "Faça login"}</option>
              {(goalsQuery.data ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {typeGoalLabel(g.type_goal)} — {g.goals?.description ?? "Meta"}
                </option>
              ))}
            </select>
          </div>

          {goalsQuery.isError ? (
            <div className="mt-2 text-xs text-brand-red">
              Não consegui carregar suas metas (verifique tabela/RLS).
            </div>
          ) : null}

          {!user ? (
            <div className="mt-2 rounded-2xl border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
              Apenas usuários logados podem criar posts.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Legenda</div>
          <Target className="h-4 w-4 text-brand-pink" />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva seu progresso, desafio ou vitória..."
          className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}
