import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Leaf, ListChecks, Target } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type GoalRow = { id: string; description: string };
type WorkoutRow = { id: string; name: string; description: string | null };
type DietRow = { id: string; name: string; description: string | null };
type HabitRow = { id: string; name: string; description: string | null };

type Visibility = 0 | 1;
type GoalType = 1 | 2 | 3;

function toggleId(setter: (fn: (prev: Set<string>) => Set<string>) => void, id: string) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export default function OnboardingGoalsPage() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const [tab, setTab] = useState<"workouts" | "diets" | "habits">("workouts");
  const [duration, setDuration] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(3);
  const [visibility, setVisibility] = useState<Visibility>(1);

  const selectedWorkouts = useState<Set<string>>(() => new Set());
  const selectedDiets = useState<Set<string>>(() => new Set());
  const selectedHabits = useState<Set<string>>(() => new Set());

  const [workouts, setWorkouts] = selectedWorkouts;
  const [diets, setDiets] = selectedDiets;
  const [habits, setHabits] = selectedHabits;

  // ---------- QUERIES ----------

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("id,description")
        .order("description", { ascending: true });
      if (error) throw error;
      return data as GoalRow[];
    },
  });

  const workoutsQuery = useQuery({
    queryKey: ["workouts"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id,name,description")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as WorkoutRow[];
    },
  });

  const dietsQuery = useQuery({
    queryKey: ["diets"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diets")
        .select("id,name,description")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as DietRow[];
    },
  });

  const habitsQuery = useQuery({
    queryKey: ["habits"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id,name,description")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as HabitRow[];
    },
  });

  const totalSelected = useMemo(
    () => workouts.size + diets.size + habits.size,
    [workouts.size, diets.size, habits.size],
  );

  // ---------- SAVE ----------

  const save = useMutation({
    mutationFn: async () => {
      if (!hasSupabaseEnv) throw new Error("Supabase não configurado");
      if (!user) throw new Error("Usuário não autenticado");
      if (!selectedGoalId) throw new Error("Selecione uma meta principal");

      const rows: Array<{
        user_id: string;
        goals_id: string;
        type_goal: GoalType;
        duration: number;
        quantity: number;
        visibility: Visibility;
      }> = [];

      workouts.forEach((id) =>
        rows.push({
          user_id: user.id,
          goals_id: selectedGoalId,
          type_goal: 1,
          duration,
          quantity,
          visibility,
        }),
      );

      diets.forEach((id) =>
        rows.push({
          user_id: user.id,
          goals_id: selectedGoalId,
          type_goal: 2,
          duration,
          quantity,
          visibility,
        }),
      );

      habits.forEach((id) =>
        rows.push({
          user_id: user.id,
          goals_id: selectedGoalId,
          type_goal: 3,
          duration,
          quantity,
          visibility,
        }),
      );

      if (!rows.length) throw new Error("Selecione pelo menos uma atividade");

      const { error } = await supabase.from("user_goals").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta configurada com sucesso!");
      navigate("/", { replace: true });
    },
    onError: (e) => {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Falha ao salvar metas");
    },
  });

  // ---------- UI ----------

  return (
    <div className="min-h-dvh bg-background px-4 pb-10 pt-10 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-4">

        {/* STEP 1 — SELECT GOAL */}
        {step === 1 && (
          <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div className="text-lg font-semibold">Escolha sua meta principal</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Essa será sua intenção central no app.
            </div>

            {goalsQuery.isLoading && (
              <div className="text-sm text-muted-foreground">Carregando metas...</div>
            )}

            {goalsQuery.isError && (
              <div className="text-sm text-brand-red">
                Não foi possível carregar metas.
              </div>
            )}

            <div className="grid gap-2">
              {(goalsQuery.data ?? []).map((goal) => {
                const active = selectedGoalId === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-background/40 hover:bg-background/60"
                    }`}
                  >
                    {goal.description}
                  </button>
                );
              })}
            </div>

            <button
              disabled={!selectedGoalId}
              onClick={() => setStep(2)}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        )}

        {/* STEP 2 — SELECT ACTIVITIES */}
        {step === 2 && (
          <>
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="text-lg font-semibold">Agora personalize sua meta</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Escolha exercícios, dietas e hábitos relacionados.
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-border/70 bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Duração</div>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                  >
                    <option value={7}>7 dias</option>
                    <option value={14}>14 dias</option>
                    <option value={30}>30 dias</option>
                    <option value={60}>60 dias</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Quantidade</div>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                  >
                    <option value={3}>3x / semana</option>
                    <option value={5}>5x / semana</option>
                    <option value={7}>7x / semana</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Visibilidade</div>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(Number(e.target.value) as Visibility)}
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
                  >
                    <option value={0}>Seguidores</option>
                    <option value={1}>Público</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="w-full bg-background/40">
                  <TabsTrigger value="workouts" className="w-full">
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Treinos
                  </TabsTrigger>
                  <TabsTrigger value="diets" className="w-full">
                    <Leaf className="mr-2 h-4 w-4" />
                    Dietas
                  </TabsTrigger>
                  <TabsTrigger value="habits" className="w-full">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Hábitos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workouts">
                  <OptionList
                    loading={workoutsQuery.isLoading}
                    error={workoutsQuery.isError}
                    items={workoutsQuery.data ?? []}
                    selected={workouts}
                    onToggle={(id) => toggleId(setWorkouts, id)}
                  />
                </TabsContent>

                <TabsContent value="diets">
                  <OptionList
                    loading={dietsQuery.isLoading}
                    error={dietsQuery.isError}
                    items={dietsQuery.data ?? []}
                    selected={diets}
                    onToggle={(id) => toggleId(setDiets, id)}
                  />
                </TabsContent>

                <TabsContent value="habits">
                  <OptionList
                    loading={habitsQuery.isLoading}
                    error={habitsQuery.isError}
                    items={habitsQuery.data ?? []}
                    selected={habits}
                    onToggle={(id) => toggleId(setHabits, id)}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || totalSelected === 0}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Salvar ({totalSelected})
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function OptionList<T extends { id: string; name: string; description: string | null }>({
  items,
  selected,
  onToggle,
  loading,
  error,
}: {
  items: T[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-2xl border border-brand-red/40 bg-brand-red/10 p-4 text-sm text-brand-red">
        Não foi possível carregar (verifique as tabelas e RLS).
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
        Sem opções ainda.
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {items.map((it) => {
        const checked = selected.has(it.id);

        return (
          <div
            key={it.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(it.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(it.id);
              }
            }}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-left hover:bg-background/60"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(it.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={checked ? "Desmarcar" : "Marcar"}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{it.name}</div>
              {it.description ? (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {it.description}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
