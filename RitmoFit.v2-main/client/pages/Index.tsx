import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useSession } from "@/hooks/useSession";

import { errorToMessage } from "@/lib/utils";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { SupabaseMissing } from "@/components/SupabaseMissing";
import { FeedFirstLoadDialog } from "@/components/feed/FeedFirstLoadDialog";
import { StoriesRail } from "@/components/feed/StoriesRail";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";

type DbUserRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type DbPostRow = {
  id: string;
  description: string | null;
  photo: string | null;
  updated_at: string | null;
  user_id: string;
  user_goal_id: string;
};

export default function Index() {
  const { user } = useSession();

  const usersQuery = useQuery({
    queryKey: ["users", "stories"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,name")
        .order("name", { ascending: true })
        .limit(12);

      if (error) throw new Error(errorToMessage(error));
      return data ?? [];
    },
  });

  // Buscar pessoas que o usuário está seguindo
  const followingQuery = useQuery({
    queryKey: ["following", user?.id ?? "anonymous"],
    enabled: hasSupabaseEnv && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("following")
        .select("following_id")
        .eq("user_id", user!.id);

      if (error) throw new Error(errorToMessage(error));
      return new Set((data ?? []).map((f) => f.following_id as string));
    },
  });

  const feedQuery = useQuery({
    queryKey: ["feed", user?.id ?? "anonymous"],
    enabled: hasSupabaseEnv && (!user?.id || followingQuery.isSuccess),
    queryFn: async () => {
      let postsQuery = supabase
        .from("posts")
        .select("id,description,photo,updated_at,user_id,user_goal_id")
        .order("updated_at", { ascending: false })
        .limit(50);

      // Se o usuário está logado, filtrar apenas posts das pessoas que está seguindo
      if (user?.id) {
        if (followingQuery.data && followingQuery.data.size > 0) {
          const followingIds = Array.from(followingQuery.data);
          postsQuery = postsQuery.in("user_id", followingIds);
        } else {
          // Se não está seguindo ninguém, retornar array vazio
          return [];
        }
      }

      const { data, error } = await postsQuery;

      if (error) throw new Error(errorToMessage(error));

      let posts = (data ?? []) as unknown as DbPostRow[];

      if (user?.id) {
        const [{ data: postComplaints }, { data: userComplaints }] =
          await Promise.all([
            supabase
              .from("post_complaint")
              .select("post_id")
              .eq("user_id", user.id),
            supabase
              .from("user_complaint")
              .select("follower_id")
              .eq("user_id", user.id),
          ]);

        const blockedPostIds = new Set(
          (postComplaints ?? []).map((r) => r.post_id as string),
        );
        const blockedUserIds = new Set(
          (userComplaints ?? []).map((r) => r.follower_id as string),
        );

        posts = posts.filter(
          (p) => !blockedPostIds.has(p.id) && !blockedUserIds.has(p.user_id),
        );
      }

      // Buscar usuários separadamente (mais confiável)
      const userIds = [...new Set(posts.map((p) => p.user_id))];

      const { data: users } = await supabase
        .from("users")
        .select("id,name,avatar_url")
        .in("id", userIds);

      const usersMap = new Map(users?.map((u) => [u.id, u]));

      return posts.map((post) => ({
        id: post.id,
        description: post.description,
        photo: post.photo,
        updated_at: post.updated_at,
        user_goal_id: post.user_goal_id,
        user: {
          id: post.user_id,
          name: usersMap.get(post.user_id)?.name ?? null,
          avatar_url: usersMap.get(post.user_id)?.avatar_url ?? null,
        },
        likesCount: 0,
        commentsCount: 0,
      })) satisfies FeedPost[];
    },
  });

  return (
    <div className="space-y-5">
      {!hasSupabaseEnv ? <SupabaseMissing /> : null}
      <FeedFirstLoadDialog enabled={Boolean(user)} userLabel={user?.email} />

      {hasSupabaseEnv ? (
        <StoriesRail
          users={(usersQuery.data ?? [])
            .filter((u) => Boolean(u.name))
            .slice(0, 10)
            .map((u) => ({ id: u.id, name: u.name ?? "" }))}
        />
      ) : null}

      <section className="space-y-4">
        {feedQuery.isLoading ? (
          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Carregando feed...
          </div>
        ) : null}

        {feedQuery.isError ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Erro ao carregar</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Verifique se existem dados na tabela <code>posts</code> e se as
              políticas RLS permitem SELECT.
            </div>
          </div>
        ) : null}

        {(feedQuery.data ?? []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {feedQuery.isSuccess && (feedQuery.data?.length ?? 0) === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Search className="h-4 w-4 text-primary" />
              {user?.id && followingQuery.data && followingQuery.data.size === 0
                ? "Comece seguindo pessoas"
                : "Ainda sem posts"}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {user?.id && followingQuery.data && followingQuery.data.size === 0
                ? "Siga pessoas para ver seus posts no seu feed."
                : "Comece seguindo novas pessoas para ver seus posts no feed."}
            </div>
            <Link
              to="/search"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" />
              Buscar pessoas
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
