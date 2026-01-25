import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";

export type FeedPost = {
  id: string;
  description: string | null;
  photo: string | null;
  update_at: string | null;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
};

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold p-[1px]">
            <div className="h-full w-full rounded-full bg-background" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">
              {post.user.name ?? "Usuário"}
            </div>
            <div className="text-[11px] text-muted-foreground">@{post.user.id.slice(0, 8)}</div>
          </div>
        </div>

        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-background/60"
          aria-label="Mais opções"
          type="button"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="aspect-square w-full bg-background/40">
        {post.photo ? (
          <img
            src={post.photo}
            alt="Post"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-xs text-muted-foreground">
              Post sem mídia (storage não configurado ainda)
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-background/60"
            aria-label="Curtir"
          >
            <Heart className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-background/60"
            aria-label="Comentar"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <div className="ml-auto text-xs text-muted-foreground">
            {post.likesCount} curtidas • {post.commentsCount} comentários
          </div>
        </div>

        {post.description ? (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{post.user.name ?? "Usuário"}</span>{" "}
            <span className="text-muted-foreground">{post.description}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
