import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search as SearchIcon, User, Dumbbell, UtensilsCrossed, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { errorToMessage } from "@/lib/utils";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

type SearchTab = "pessoas" | "treinos" | "dietas";

type UserResult = {
  id: string;
  name: string | null;
  nickname: string | null;
  avatar_url: string | null;
};

type WorkoutResult = {
  id: string;
  name: string | null;
  description: string | null;
};

type DietResult = {
  id: string;
  name: string | null;
  description: string | null;
};

export default function SearchPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SearchTab>("pessoas");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar pessoas que o usuário está seguindo
  const followingQuery = useQuery({
    queryKey: ["following", user?.id ?? "anonymous"],
    enabled: hasSupabaseEnv && Boolean(user?.id) && activeTab === "pessoas",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("following")
        .select("following_id")
        .eq("user_id", user!.id);

      if (error) throw new Error(errorToMessage(error));
      return new Set((data ?? []).map((f) => f.following_id as string));
    },
  });

  const usersQuery = useQuery({
    queryKey: ["search", "users", searchQuery],
    enabled: hasSupabaseEnv && activeTab === "pessoas",
    queryFn: async () => {
      // Tentar buscar em profiles primeiro (tem nickname)
      let query = supabase
        .from("profiles")
        .select("id, name, nickname")
        .limit(50);

      // Se há busca, filtrar
      if (searchQuery.length > 0) {
        query = query.or(`name.ilike.%${searchQuery}%,nickname.ilike.%${searchQuery}%`);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError && profilesError.code !== "PGRST116") {
        // Se profiles não existe, buscar em users
        let usersQuery = supabase
          .from("users")
          .select("id, name, avatar_url")
          .limit(50);

        if (searchQuery.length > 0) {
          usersQuery = usersQuery.ilike("name", `%${searchQuery}%`);
        }

        const { data: usersData, error: usersError } = await usersQuery;

        if (usersError) throw new Error(errorToMessage(usersError));
        
        return (usersData ?? []).map((user) => ({
          id: user.id,
          name: user.name,
          nickname: null,
          avatar_url: user.avatar_url,
        })) as UserResult[];
      }

      if (profilesError) throw new Error(errorToMessage(profilesError));

      // Buscar avatar_url de users para os perfis encontrados
      const profileIds = (profilesData ?? []).map((p) => p.id);
      const { data: usersData } = await supabase
        .from("users")
        .select("id, avatar_url")
        .in("id", profileIds);

      const usersMap = new Map(
        (usersData ?? []).map((u) => [u.id, u.avatar_url])
      );

      return (profilesData ?? []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        nickname: profile.nickname,
        avatar_url: usersMap.get(profile.id) ?? null,
      })) as UserResult[];
    },
  });

  const workoutsQuery = useQuery({
    queryKey: ["search", "workouts", searchQuery],
    enabled: hasSupabaseEnv && activeTab === "treinos",
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("id, name, description")
        .limit(50);

      if (searchQuery.length > 0) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw new Error(errorToMessage(error));
      return (data ?? []) as unknown as WorkoutResult[];
    },
  });

  const dietsQuery = useQuery({
    queryKey: ["search", "diets", searchQuery],
    enabled: hasSupabaseEnv && activeTab === "dietas",
    queryFn: async () => {
      let query = supabase
        .from("diets")
        .select("id, name, description")
        .limit(50);

      if (searchQuery.length > 0) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw new Error(errorToMessage(error));
      return (data ?? []) as unknown as DietResult[];
    },
  });

  // Mutation para seguir/deixar de seguir
  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (!hasSupabaseEnv || !user) throw new Error("Usuário não autenticado");

      if (isFollowing) {
        // Deixar de seguir
        const { error } = await supabase
          .from("following")
          .delete()
          .eq("user_id", user.id)
          .eq("following_id", userId);

        if (error) throw new Error(errorToMessage(error));
      } else {
        // Seguir
        const { error } = await supabase
          .from("following")
          .insert({
            user_id: user.id,
            following_id: userId,
          });

        if (error) throw new Error(errorToMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["feed", user?.id] });
      toast.success("Atualizado!");
    },
    onError: (error) => {
      toast.error(errorToMessage(error, "Erro ao atualizar"));
    },
  });

  const tabs = [
    { id: "pessoas" as SearchTab, label: "Pessoas", icon: User },
    { id: "treinos" as SearchTab, label: "Treinos", icon: Dumbbell },
    { id: "dietas" as SearchTab, label: "Dietas", icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-background/60 pl-12 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition ${
                isActive
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {activeTab === "pessoas" ? (
          <>
            {usersQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Buscando pessoas...
              </div>
            ) : usersQuery.isError ? (
              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="text-sm font-semibold">Erro ao buscar</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {errorToMessage(usersQuery.error, "Não foi possível buscar pessoas")}
                </div>
              </div>
            ) : (usersQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-center">
                <div className="text-sm font-semibold">Nenhuma pessoa encontrada</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tente buscar com outros termos
                </div>
              </div>
            ) : (
              (usersQuery.data ?? [])
                .filter((u) => u.id !== user?.id) // Não mostrar o próprio usuário
                .map((userResult) => {
                  const isFollowing = followingQuery.data?.has(userResult.id) ?? false;
                  return (
                    <div
                      key={userResult.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                    >
                      {userResult.avatar_url ? (
                        <img
                          src={userResult.avatar_url}
                          alt={userResult.name ?? "Usuário"}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          {userResult.name ?? "Sem nome"}
                        </div>
                        {userResult.nickname && (
                          <div className="text-xs text-muted-foreground">
                            @{userResult.nickname}
                          </div>
                        )}
                      </div>
                      {user && (
                        <button
                          type="button"
                          onClick={() =>
                            followMutation.mutate({
                              userId: userResult.id,
                              isFollowing,
                            })
                          }
                          disabled={followMutation.isPending}
                          className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
                            isFollowing
                              ? "border border-border bg-background/40 text-foreground hover:bg-background/60"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          } disabled:opacity-60`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Seguindo
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              Seguir
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
            )}
          </>
        ) : activeTab === "treinos" ? (
          <>
            {workoutsQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Buscando treinos...
              </div>
            ) : workoutsQuery.isError ? (
              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="text-sm font-semibold">Erro ao buscar</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {errorToMessage(workoutsQuery.error, "Não foi possível buscar treinos")}
                </div>
              </div>
            ) : (workoutsQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-center">
                <div className="text-sm font-semibold">Nenhum treino encontrado</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tente buscar com outros termos
                </div>
              </div>
            ) : (
              (workoutsQuery.data ?? []).map((workout) => (
                <div
                  key={workout.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/15">
                      <Dumbbell className="h-5 w-5 text-brand-blue" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">
                        {workout.name ?? "Treino sem nome"}
                      </div>
                      {workout.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {workout.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {dietsQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Buscando dietas...
              </div>
            ) : dietsQuery.isError ? (
              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="text-sm font-semibold">Erro ao buscar</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {errorToMessage(dietsQuery.error, "Não foi possível buscar dietas")}
                </div>
              </div>
            ) : (dietsQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-5 text-center">
                <div className="text-sm font-semibold">Nenhuma dieta encontrada</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tente buscar com outros termos
                </div>
              </div>
            ) : (
              (dietsQuery.data ?? []).map((diet) => (
                <div
                  key={diet.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green/15">
                      <UtensilsCrossed className="h-5 w-5 text-brand-green" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">
                        {diet.name ?? "Dieta sem nome"}
                      </div>
                      {diet.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {diet.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
