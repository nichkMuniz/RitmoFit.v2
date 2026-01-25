import { Copy, Dumbbell, Play, Plus } from "lucide-react";

export default function RoutinesPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold">Rotinas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Construa rotinas (treino/dieta/hábito), copie de outros usuários e
          execute com gamificação.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Criar
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/40 text-sm font-semibold text-foreground hover:bg-background/60"
          >
            <Copy className="h-4 w-4" />
            Copiar
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Sua rotina do dia</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Execute e ganhe pontos por consistência.
            </div>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40">
            <Dumbbell className="h-4 w-4 text-brand-gold" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-4">
          <div className="text-sm font-semibold">Sem rotina definida</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Assim que você criar ou copiar uma rotina, ela aparece aqui com o
            botão de executar.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background/40 text-sm font-semibold text-foreground hover:bg-background/60"
          >
            <Play className="h-4 w-4" />
            Executar (em breve)
          </button>
        </div>
      </div>
    </div>
  );
}
