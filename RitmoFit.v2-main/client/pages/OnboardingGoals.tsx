import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Target, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { errorToMessage } from "@/lib/utils";

type Visibility = 0 | 1;
type GoalType = 1 | 2 | 3;

type GoalRow = {
  id: string;
  description: string;
  type_goal?: number | null;
};

type RoutineRow = {
  id: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
};

function toggleInSet(
  setter: (fn: (prev: Set<string>) => Set<string>) => void,
  id: string,
) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function normalizeGoalType(value: unknown): GoalType | null {
  if (value === 1 || value === 2 || value === 3) return value;
  return null;
}

function goalTypeMeta(type: GoalType | null) {
  switch (type) {
    case 1:
      return { label: "Treino", className: "bg-brand-blue/15 text-brand-blue" };
    case 2:
      return {
        label: "Dieta",
        className: "bg-brand-green/15 text-brand-green",
      };
    case 3:
      return {
        label: "Hábito",
        className: "bg-brand-yellow/15 text-brand-yellow",
      };
    default:
      return { label: "Meta", className: "bg-muted text-muted-foreground" };
  }
}

export default function OnboardingGoalsPage() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // step 1
  const [goalFilter, setGoalFilter] = useState<"all" | GoalType>("all");
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(
    () => new Set(),
  );

  // step 2
  const [duration, setDuration] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(3);
  const [visibility, setVisibility] = useState<Visibility>(1);

  // step 3
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  );

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*");
      if (error) throw new Error(errorToMessage(error));
      return (data ?? []) as unknown as GoalRow[];
    },
  });

  const routinesQuery = useQuery({
    queryKey: ["routines"],
    enabled: hasSupabaseEnv && step === 3,
    queryFn: async () => {
      const { data, error } = await supabase.from("routines").select("*");
      if (error) throw new Error(errorToMessage(error));
      return (data ?? []) as unknown as RoutineRow[];
    },
  });

  const goals = goalsQuery.data ?? [];

  const availableGoalTypes = useMemo(() => {
    const types = new Set<GoalType>();
    for (const g of goals) {
      const t = normalizeGoalType(g.type_goal);
      if (t) types.add(t);
    }
    return Array.from(types).sort();
  }, [goals]);

  const goalsById = useMemo(() => {
    const map = new Map<string, GoalRow>();
    for (const g of goals) map.set(g.id, g);
    return map;
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (goalFilter === "all") return goals;
    return goals.filter((g) => normalizeGoalType(g.type_goal) === goalFilter);
  }, [goals, goalFilter]);

  const selectedGoalsPreview = useMemo(() => {
    const selected = Array.from(selectedGoalIds)
      .map((id) => goalsById.get(id))
      .filter(Boolean) as GoalRow[];
    return selected.slice(0, 4);
  }, [goalsById, selectedGoalIds]);

  const totalSelected = selectedGoalIds.size;

  const save = useMutation({
    mutationFn: async ({ routineId }: { routineId: string | null }) => {
      if (!hasSupabaseEnv) throw new Error("Supabase não configurado");
      if (!user) throw new Error("Usuário não autenticado");
      if (selectedGoalIds.size === 0)
        throw new Error("Selecione pelo menos uma meta");

      const rows = Array.from(selectedGoalIds).map((goalId) => {
        const goal = goalsById.get(goalId);
        const type_goal = normalizeGoalType(goal?.type_goal) ?? 1;

        return {
          user_id: user.id,
          goal_id: goalId,
          type_goal,
          duration,
          quantity,
          visibility,
        };
      });

      const { error } = await supabase.from("user_goals").insert(rows);
      if (error) throw new Error(errorToMessage(error));

      try {
        if (routineId)
          localStorage.setItem("ritmofit.selectedRoutineId", routineId);
        else localStorage.removeItem("ritmofit.selectedRoutineId");
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      toast.success("Configuração concluída!");
      navigate("/", { replace: true });
    },
    onError: (e) => {
      console.error(e);
      toast.error(errorToMessage(e, "Falha ao salvar"));
    },
  });

  const footer = (
    <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
        {step === 3 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save.mutate({ routineId: null })}
              disabled={save.isPending}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-background text-sm font-semibold text-foreground disabled:opacity-60"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={() => save.mutate({ routineId: selectedRoutineId })}
              disabled={save.isPending || !selectedRoutineId}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
            disabled={save.isPending || (step === 1 && totalSelected === 0)}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {step === 1 ? `Continuar (${totalSelected})` : "Continuar"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-8 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              {step === 1 ? "Metas" : step === 2 ? "Tempo" : "Rotinas"}
            </div>
            <div className="text-xs text-muted-foreground">
              Etapa {step} de 3
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div className="text-lg font-semibold">Escolha suas metas</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Você pode selecionar mais de uma.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGoalFilter("all")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  goalFilter === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-background/40 text-muted-foreground"
                }`}
              >
                Todas
              </button>
              {availableGoalTypes.map((t) => {
                const meta = goalTypeMeta(t);
                const active = goalFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGoalFilter(t)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-background/40 text-muted-foreground"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {goalsQuery.isLoading ? (
              <div className="mt-4 text-sm text-muted-foreground">
                Carregando metas...
              </div>
            ) : goalsQuery.isError ? (
              <div className="mt-4 text-sm text-brand-red">
                Não foi possível carregar metas.
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                Sem metas para este filtro.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {filteredGoals.map((goal) => {
                  const selected = selectedGoalIds.has(goal.id);
                  const t = normalizeGoalType(goal.type_goal);
                  const meta = goalTypeMeta(t);

                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleInSet(setSelectedGoalIds, goal.id)}
                      className={`relative rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border/70 bg-background/40 hover:bg-background/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <div
                          className={`h-5 w-5 rounded-full border ${
                            selected
                              ? "border-primary bg-primary"
                              : "border-border/70"
                          }`}
                          aria-hidden
                        />
                      </div>

                      <div className="mt-2 text-sm font-semibold leading-snug">
                        {goal.description}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {selected ? "Selecionada" : "Toque para selecionar"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="text-lg font-semibold">
              Defina tempo e frequência
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Isso será aplicado para as metas selecionadas.
            </div>

            {totalSelected > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedGoalsPreview.map((g) => (
                  <span
                    key={g.id}
                    className="max-w-full truncate rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {g.description}
                  </span>
                ))}
                {totalSelected > selectedGoalsPreview.length ? (
                  <span className="rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                    +{totalSelected - selectedGoalsPreview.length}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">
                  Tempo para cumprir
                </div>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                >
                  <option value={7}>7 dias</option>
                  <option value={14}>14 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">Frequência</div>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                >
                  <option value={3}>3x por semana</option>
                  <option value={4}>4x por semana</option>
                  <option value={5}>5x por semana</option>
                  <option value={7}>Todo dia</option>
                </select>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">
                  Visibilidade
                </div>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(Number(e.target.value) as Visibility)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                >
                  <option value={0}>Seguidores</option>
                  <option value={1}>Público</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <div className="text-lg font-semibold">
                Personalize suas rotinas
              </div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Você pode escolher uma rotina agora, ou pular e decidir depois.
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled
                className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left opacity-70"
              >
                <div className="text-sm font-semibold">Criar minha rotina</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Em manutenção
                </div>
              </button>

              {routinesQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Carregando rotinas...
                </div>
              ) : routinesQuery.isError ? (
                <div className="text-sm text-brand-red">
                  Não foi possível carregar rotinas (verifique tabela e RLS).
                </div>
              ) : (routinesQuery.data ?? []).length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                  Sem rotinas disponíveis.
                </div>
              ) : (
                <div className="grid gap-2">
                  {(routinesQuery.data ?? []).map((r) => {
                    const title = r.name ?? r.title ?? "Rotina";
                    const selected = selectedRoutineId === r.id;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRoutineId(r.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 bg-background/40 hover:bg-background/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{title}</div>
                          <div
                            className={`h-5 w-5 rounded-full border ${
                              selected
                                ? "border-primary bg-primary"
                                : "border-border/70"
                            }`}
                            aria-hidden
                          />
                        </div>
                        {r.description ? (
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {r.description}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {footer}
    </div>
  );
}
