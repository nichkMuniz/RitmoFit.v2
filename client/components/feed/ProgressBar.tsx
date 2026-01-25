import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Lock, Globe } from "lucide-react";

import { errorToMessage } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type UserGoalRow = {
  id: string;
  user_id: string;
  goal_id: string;
  type_goal: number;
  duration: number;
  quantity: number;
  visibility: number;
  goals?: { description: string; duration: number; quantity: number } | null;
};

function typeGoalLabel(typeGoal: number) {
  if (typeGoal === 1) return "Treino";
  if (typeGoal === 2) return "Dieta";
  if (typeGoal === 3) return "Hábito";
  return `Tipo ${typeGoal}`;
}

export function GoalProgress({
  userGoalsId,
}: {
  userGoalsId?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["user_goal", userGoalsId],
    enabled: Boolean(hasSupabaseEnv && userGoalsId && open),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select(
          "id,user_id,goal_id,type_goal,duration,quantity,visibility,goals(description,duration,quantity)",
        )
        .eq("id", userGoalsId!)
        .maybeSingle();

      if (error) throw new Error(errorToMessage(error));
      return data as unknown as UserGoalRow | null;
    },
  });

  const progress = useMemo(() => {
    // Ainda não temos tabela de progressos diários no schema.
    // Por enquanto, exibimos 0% como base visual.
    return 0;
  }, []);

  if (!userGoalsId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-2xl border border-border/70 bg-background/40 px-3 py-3 text-left transition hover:bg-background/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-gold" />
              <div>
                <div className="text-xs font-semibold">Progresso da meta</div>
                <div className="text-[11px] text-muted-foreground">
                  Toque para ver detalhes
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-foreground">
              {progress}%
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-pink via-brand-red to-brand-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="w-[92vw] max-w-md rounded-3xl border-border bg-card p-5">
        <DialogHeader className="text-left">
          <DialogTitle>Meta vinculada</DialogTitle>
          <DialogDescription>
            Dados carregados da tabela <code>user_goals</code>.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            Carregando meta...
          </div>
        ) : null}

        {query.isError ? (
          <div className="rounded-2xl border border-brand-red/40 bg-brand-red/10 p-4 text-sm text-brand-red">
            Não foi possível carregar a meta. Verifique o schema/RLS.
          </div>
        ) : null}

        {query.data ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="text-xs text-muted-foreground">Descrição</div>
              <div className="mt-1 text-sm font-semibold">
                {query.data.goals?.description ?? "(sem descrição)"}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-card px-2 py-1">
                  {typeGoalLabel(query.data.type_goal)}
                </span>
                <span className="rounded-full border border-border/70 bg-card px-2 py-1">
                  Duração: {query.data.duration}
                </span>
                <span className="rounded-full border border-border/70 bg-card px-2 py-1">
                  Quantidade: {query.data.quantity}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {query.data.visibility === 1 ? (
                  <Globe className="h-4 w-4 text-brand-gold" />
                ) : (
                  <Lock className="h-4 w-4 text-brand-gold" />
                )}
                Visibilidade
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {query.data.visibility === 1
                  ? "Pública"
                  : "Apenas seguidores"}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Fechar
        </button>
      </DialogContent>
    </Dialog>
  );
}
