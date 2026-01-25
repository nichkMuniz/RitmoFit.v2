import { Clapperboard, Play } from "lucide-react";

export default function ReelsPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold">Reels</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vídeos curtos para treinos, hábitos e transformação — com swipe vertical
          (estilo Instagram).
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Player</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Em breve: autoplay, som, comentários e denúncias.
            </div>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40">
            <Clapperboard className="h-4 w-4 text-brand-gold" />
          </div>
        </div>

        <div className="mt-4 flex aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-pink/20 via-brand-red/10 to-brand-gold/20">
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-background/70 px-5 text-sm font-semibold"
          >
            <Play className="h-4 w-4" />
            Reproduzir (mock visual)
          </button>
        </div>
      </div>
    </div>
  );
}
