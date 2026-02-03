export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ??
            "Esta tela ainda não foi construída. Diga quais fluxos você quer priorizar (ex: metas, rotinas, reels, mensagens) e eu implemento a próxima."}
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-gradient-to-tr from-brand-pink/20 via-brand-red/10 to-brand-gold/20 p-5">
        <p className="text-sm text-muted-foreground">
          Próximo passo recomendado: conectar o Supabase (Auth + banco) e ativar
          o feed real.
        </p>
      </div>
    </div>
  );
}
