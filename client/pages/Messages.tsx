import { MessageCircle, ShieldCheck } from "lucide-react";

import { useSession } from "@/hooks/useSession";

export default function MessagesPage() {
  const { user } = useSession();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Mensagens</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mensagens privadas apenas entre seguidores.
            </p>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40">
            <MessageCircle className="h-4 w-4 text-brand-gold" />
          </div>
        </div>

        {!user ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
            Faça login para ver suas conversas.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-4">
            <div className="text-sm font-semibold">Nenhuma conversa ainda</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Em breve: lista de chats, leitura, denúncias e bloqueios.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border/70 bg-gradient-to-tr from-brand-pink/15 via-brand-red/10 to-brand-gold/15 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-brand-gold" />
          Segurança
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Denúncias e bloqueios estarão disponíveis em cada conversa e perfil.
        </p>
      </div>
    </div>
  );
}
