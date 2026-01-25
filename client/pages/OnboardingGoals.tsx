import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Leaf, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type WorkoutRow = { id: string; name: string; description: string | null };
type DietRow = { id: string; name: string; description: string | null };
type HabitRow = { id: string; name: string; description: string | null };

type Visibility = 0 | 1;

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

  const [tab, setTab] = useState<"workouts" | "diets" | "habits">("workouts");
  const [duration, setDuration] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const [visibility, setVisibility] = useState<Visibility>(1);

  const selectedWorkouts = useState<Set<string>>(() => new Set());
  const selectedDiets = useState<Set<string>>(() => new Set());
  const selectedHabits = useState<Set<string>>(() => new Set());

  const [workouts, setWorkouts] = selectedWorkouts;
  const [diets, setDiets] = selectedDiets;
  const [habits, setHabits] = selectedHabits;

  const workoutsQuery = useQuery({
    queryKey: ["workouts"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id,name,description")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WorkoutRow[];
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
      return (data ?? []) as unknown as DietRow[];
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
      return (data ?? []) as unknown as HabitRow[];
    },
  });

  const totalSelected = useMemo(
    () => workouts.size + diets.size + habits.size,
    [workouts.size, diets.size, habits.size],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!hasSupabaseEnv) throw new Error("Supabase não configurado");
      if (!user) throw new Error("Usuário não autenticado");

      const selections: Array<{ type_goal: 1 | 2 | 3; name: string; id: string }> = [];

      (workoutsQuery.data ?? [])
        .filter((w) => workouts.has(w.id))
        .forEach((w) => selections.push({ type_goal: 1, id: w.id, name: w.name }));

      (dietsQuery.data ?? [])
        .filter((d) => diets.has(d.id))
        .forEach((d) => selections.push({ type_goal: 2, id: d.id, name: d.name }));

      (habitsQuery.data ?? [])
        .filter((h) => habits.has(h.id))
        .forEach((h) => selections.push({ type_goal: 3, id: h.id, name: h.name }));

      if (selections.length === 0) {
        throw new Error("Selecione pelo menos uma opção");
      }

      // Mantém o schema: user_goals precisa de goals_id.
      // Criamos um registro em goals para cada seleção.
      for (const s of selections) {
        const { data: goal, error: goalError } = await supabase
          .from("goals")
          .insert({
            description: s.name,
            duration,
            quantity,
          })
          .select("id")
          .single();

        if (goalError) throw goalError;

        const { error: ugError } = await supabase.from("user_goals").insert({
          user_id: user.id,
          goals_id: (goal as { id: string }).id,
          type_goal: s.type_goal,
          duration,
          quantity,
          visibility,
        });

        if (ugError) throw ugError;
      }
    },
    onSuccess: () => {
      toast.success("Metas salvas");
      navigate("/", { replace: true });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar metas");
    },
  });

  return (
    <div className="min-h-dvh bg-background px-4 pb-10 pt-10 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="text-lg font-semibold">Escolha suas metas</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Selecione exercícios, dietas e hábitos que você quer acompanhar.
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Duração</div>
              <input
                type="number"
                value={duration}
                min={1}
                onChange={(e) => setDuration(Number(e.target.value || 1))}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Quantidade</div>
              <input
                type="number"
                value={quantity}
                min={1}
                onChange={(e) => setQuantity(Number(e.target.value || 1))}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm outline-none"
              />
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
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onToggle(it.id)}
          className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-left hover:bg-background/60"
        >
          <Checkbox checked={selected.has(it.id)} />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{it.name}</div>
            {it.description ? (
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {it.description}
              </div>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}
