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
  text: string | null;
  created_at: string;
  updated_at: string | null;
  users?: DbUserRow | null;
};

function normalizeUser(user: DbUserRow | null | undefined): FeedPost["user"] {
  return {
    id: user?.id ?? "unknown",
    name: user?.name ?? null,
    avatar_url: user?.avatar_url ?? null,
  };
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
    queryKey: ["feed"],
    enabled: hasSupabaseEnv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          description,
          photo,
          text,
          created_at,
          updated_at,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      const rows = (data ?? []) as DbPostRow[];

      return rows.map((row) => ({
        id: row.id,
        description: row.description,
        photo: row.photo,
        text: row.text,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: normalizeUser(row.users),
        likesCount: 0,
        commentsCount: 0,
      })) satisfies FeedPost[];
    },
  });

  return (
    <div className="space-y-5">
      {!hasSupabaseEnv ? <SupabaseMissing /> : null}

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
            <div className="text-sm font-semibold">Ainda sem posts</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Assim que houver posts no Supabase, eles vão aparecer aqui.
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
