import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Flag,
  HandHeart,
  Medal,
  MessageCircle,
  MoreHorizontal,
  TrendingUp,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/useSession";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { GoalProgress } from "@/components/feed/ProgressBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FeedPost = {
  id: string;
  description: string | null;
  photo: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_goal_id?: string | null;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  likesCount: number;
  commentsCount: number;
};

type IncentiveType = 1 | 2 | 3;

const incentives: Array<{
  type: IncentiveType;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { type: 1, label: "Te apoio", Icon: HandHeart },
  { type: 2, label: "Continua", Icon: TrendingUp },
  { type: 3, label: "Orgulho", Icon: Medal },
];

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

        <PostMenu postId={post.id} postUserId={post.user.id} />
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
        <GoalProgress userGoalsId={post.user_goal_id} />
        <IncentivesRow postId={post.id} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-background/60"
            aria-label="Comentar"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <div className="ml-auto text-xs text-muted-foreground">
            {post.likesCount} incentivos • {post.commentsCount} comentários
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

function IncentivesRow({ postId }: { postId: string }) {
  const navigate = useNavigate();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: async (type: IncentiveType) => {
      if (!hasSupabaseEnv) throw new Error("Supabase não configurado");
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("likes")
        // Requires a new column: likes.type (int)
        .upsert(
          { user_id: user.id, post_id: postId, type },
          { onConflict: "user_id,post_id" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incentivo enviado");
    },
    onError: (e) => {
      toast.error(
        e instanceof Error
          ? e.message
          : "Falha ao enviar incentivo (verifique a coluna likes.type)",
      );
    },
  });

  return (
    <div className="flex items-center gap-2">
      {incentives.map(({ type, label, Icon }) => (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => mutation.mutate(type)}
              disabled={mutation.isPending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40 text-foreground transition hover:bg-background/60 disabled:opacity-60"
              aria-label={label}
            >
              <Icon className="h-4 w-4 text-brand-pink" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
