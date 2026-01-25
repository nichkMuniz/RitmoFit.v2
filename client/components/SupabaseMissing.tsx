export function SupabaseMissing() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Conectar Supabase</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Para o RitmoFit funcionar de ponta a ponta (Auth, feed real, metas,
        mensagens, etc.), precisamos configurar as variáveis de ambiente do
        Supabase.
      </p>
      <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-4 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">Env vars necessárias</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </div>
  );
}
