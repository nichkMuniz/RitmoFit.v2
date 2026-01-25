import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { SupabaseMissing } from "@/components/SupabaseMissing";
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
  update_at: string | null;
  users?: DbUserRow | DbUserRow[] | null;
  likes?: Array<{ count: number }> | null;
  comments?: Array<{ count: number }> | null;
};

function normalizeUser(users: DbPostRow["users"], fallbackUserId?: string): FeedPost["user"] {
  const u = Array.isArray(users) ? users[0] : users;
  return {
    id: u?.id ?? fallbackUserId ?? "unknown",
    name: u?.name ?? null,
    avatar_url: u?.avatar_url ?? null,
  };
}

function countFromAggregate(agg: Array<{ count: number }> | null | undefined) {
  return agg?.[0]?.count ?? 0;
}

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

      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string | null }>;
    },
  });

  const feedQuery = useQuery({
    queryKey: ["feed", user?.id ?? "anonymous"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          [
            "id",
            "description",
            "photo",
            "update_at",
            "users(id,name,avatar_url)",
            "likes(count)",
            "comments(count)",
          ].join(","),
        )
        .order("update_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      const rows = (data ?? []) as unknown as DbPostRow[];

      return rows.map((row) => ({
        id: row.id,
        description: row.description,
        photo: row.photo,
        update_at: row.update_at,
        user: normalizeUser(row.users),
        likesCount: countFromAggregate(row.likes),
        commentsCount: countFromAggregate(row.comments),
      })) satisfies FeedPost[];
    },
  });

  return (
    <div className="space-y-5">
      {!hasSupabaseEnv ? (
        <SupabaseMissing />
      ) : null}

      <div className="rounded-3xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold">Feed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conteúdo real (posts vinculados a metas) — com visual inspirado no
          Instagram e foco em consistência.
        </p>

        {!user ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
            <div>
              <div className="text-sm font-semibold">Entrar para evoluir</div>
              <div className="text-xs text-muted-foreground">
                Login habilita seguir pessoas, curtir, comentar e ganhar pontos.
              </div>
            </div>
            <Link
              to="/auth"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="text-sm font-semibold">Bem-vindo de volta</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        )}
      </div>

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
              Confira se o banco está com as tabelas do modelo RitmoFit e se as
              políticas RLS permitem leitura.
            </div>
          </div>
        ) : null}

        {(feedQuery.data ?? []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {feedQuery.isSuccess && (feedQuery.data?.length ?? 0) === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Ainda sem posts</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Assim que houver posts no Supabase (tabela <code>posts</code>),
              eles vão aparecer aqui.
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
