import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Settings, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { errorToMessage } from "@/lib/utils";

import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/SupabaseMissing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

export default function ProfilePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id ?? "anonymous"],
    enabled: Boolean(hasSupabaseEnv && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,name,avatar_url,bio")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw new Error(errorToMessage(error));
      const profile = data as unknown as ProfileRow | null;

      if (profile) {
        setName((prev) => (prev || !isEditOpen ? profile.name ?? "" : prev));
        setBio((prev) => (prev || !isEditOpen ? profile.bio ?? "" : prev));
        setAvatarUrl((prev) =>
          prev || !isEditOpen ? profile.avatar_url ?? "" : prev,
        );
      }

      return profile;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!hasSupabaseEnv || !user) {
        throw new Error("Usuário não autenticado");
      }

      const updates: Partial<ProfileRow> = {
        name: name.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw new Error(errorToMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setIsEditOpen(false);
    },
  });

  const statsQuery = useQuery({
    queryKey: ["profile-stats", user?.id ?? "anonymous"],
    enabled: Boolean(hasSupabaseEnv && user?.id),
    queryFn: async () => {
      const userId = user!.id;

      const [postsRes, followersRes, followingRes] = await Promise.all([
        // Posts publicados pelo usuário
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        // Seguidores: pessoas que seguem este usuário (followers.user_id = este usuário)
        supabase
          .from("followers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        // Seguindo: pessoas que este usuário segue (following.user_id = este usuário)
        supabase
          .from("following")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      if (postsRes.error) throw new Error(errorToMessage(postsRes.error));
      if (followersRes.error) throw new Error(errorToMessage(followersRes.error));
      if (followingRes.error) throw new Error(errorToMessage(followingRes.error));

      return {
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      } satisfies ProfileStats;
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
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-2xl border-border/70 bg-background/40 text-foreground hover:bg-background/60"
                      aria-label="Editar perfil"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar perfil</DialogTitle>
                      <DialogDescription>
                        Atualize sua foto, nome e bio para ficar com a sua cara.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          URL da foto de perfil
                        </label>
                        <Input
                          placeholder="https://..."
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Nome
                        </label>
                        <Input
                          placeholder="Seu nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Bio
                        </label>
                        <Textarea
                          placeholder="Fale um pouco sobre seu objetivo e seu ritmo."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={updateProfileMutation.isPending}
                      >
                        Salvar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-2xl border-border/70 bg-background/40 text-foreground hover:bg-background/60"
                      aria-label="Configurações"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user ? (
                      <DropdownMenuItem
                        className="gap-2 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                        onClick={() => supabase.auth.signOut()}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
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
            {
              key: "posts",
              label: "Posts",
              value: statsQuery.data?.posts ?? 0,
            },
            {
              key: "followers",
              label: "Seguidores",
              value: statsQuery.data?.followers ?? 0,
            },
            {
              key: "following",
              label: "Seguindo",
              value: statsQuery.data?.following ?? 0,
            },
          ].map((s) => (
            <div
              key={s.key}
              className="rounded-2xl border border-border/70 bg-background/40 p-3 text-center"
            >
              <div className="text-sm font-semibold">
                {statsQuery.isLoading && !statsQuery.data ? "…" : s.value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              Comece a compartilhar seu ritmo
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Você ainda não tem nenhuma postagem. Crie seu primeiro post para
              inspirar quem te acompanha.
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            className="rounded-2xl"
            onClick={() => navigate("/create")}
            aria-label="Criar primeira postagem"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
