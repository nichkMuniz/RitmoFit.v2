import { useEffect, useMemo, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "ritmofit.feedPopup.v1";

export function FeedFirstLoadDialog({
  enabled,
  userLabel,
}: {
  enabled: boolean;
  userLabel?: string | null;
}) {
  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (last === todayKey) return;

    setOpen(true);
    localStorage.setItem(STORAGE_KEY, todayKey);
  }, [enabled, todayKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[92vw] max-w-md rounded-3xl border-border bg-card p-5">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold">
              <Sparkles className="h-4 w-4 text-black" />
            </span>
            Seu ritmo de hoje
          </DialogTitle>
          <DialogDescription>
            {userLabel ? (
              <span>
                Bem-vindo, <span className="text-foreground">{userLabel}</span>.
              </span>
            ) : null}{" "}
            Vamos focar em consistência: publique, execute rotinas e incentive quem
            você segue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-brand-gold" />
              Dica de gamificação
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ganhe pontos por consistência e por incentivar outras pessoas — os
              incentivos contam como ação positiva na comunidade.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Começar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
