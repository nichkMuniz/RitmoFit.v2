import { Crown, Flame, Medal } from "lucide-react";

const levels = [
  { points: "0–100", label: "Iniciante" },
  { points: "101–300", label: "Focado" },
  { points: "301–700", label: "Disciplinado" },
  { points: "701+", label: "Atleta" },
];

export default function RankingPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-brand-gold" />
          Níveis
        </div>
        <div className="mt-3 grid gap-2">
          {levels.map((l) => (
            <div
              key={l.label}
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/40 px-4 py-3"
            >
              <div className="text-sm font-semibold">{l.label}</div>
              <div className="text-xs text-muted-foreground">{l.points}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Medal className="h-4 w-4 text-brand-pink" />
          Top (em breve)
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Assim que a tabela <code>ranking</code> estiver populada, exibimos o
          ranking real aqui.
        </p>
      </div>
    </div>
  );
}
