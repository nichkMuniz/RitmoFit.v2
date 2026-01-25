import { useQuery } from "@tanstack/react-query";
import { Pencil, Settings, LogOut } from "lucide-react";

import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/SupabaseMissing";

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default function ProfilePage() {
  const { user } = useSession();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id ?? "anonymous"],
    enabled: Boolean(hasSupabaseEnv && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,name,avatar_url,bio")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ProfileRow | null;
    },
  });

  return (
    <div className="space-y-4">
      {!hasSupabaseEnv ? <SupabaseMissing /> : null}

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold p-[2px]">
            <div className="h-full w-full rounded-full bg-background" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">
                  {profileQuery.data?.name ?? (user ? "Seu perfil" : "Perfil")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {user ? user.email : "Entre para criar seu perfil"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/40 text-foreground hover:bg-background/60"
                  aria-label="Editar perfil"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/40 text-foreground hover:bg-background/60"
                  aria-label="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {profileQuery.data?.bio ??
                "Adicione uma bio que deixe claro seu objetivo e seu ritmo."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Posts", value: "—" },
            { label: "Seguidores", value: "—" },
            { label: "Seguindo", value: "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/70 bg-background/40 p-3 text-center"
            >
              <div className="text-sm font-semibold">{s.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background/40 text-sm font-semibold text-foreground hover:bg-background/60"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        ) : null}
      </div>

      <div className="rounded-3xl border border-border/70 bg-gradient-to-tr from-brand-pink/15 via-brand-red/10 to-brand-gold/15 p-5">
        <div className="text-sm font-semibold">Seu destaque</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Em breve: streaks, níveis e conquistas aparecem aqui, junto com o
          ranking entre seguidores.
        </p>
      </div>
    </div>
  );
}
