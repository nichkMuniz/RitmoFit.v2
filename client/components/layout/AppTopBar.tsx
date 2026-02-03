import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Trophy } from "lucide-react";

function isHome(pathname: string) {
  return pathname === "/";
}

export function AppTopBar() {
  const { pathname } = useLocation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-pink via-brand-red to-brand-gold shadow-[0_0_0_1px_hsl(var(--border))]">
            <span className="text-sm font-extrabold tracking-tight text-black">
              R
            </span>
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">RitmoFit</div>
            <div className="text-[11px] text-muted-foreground">
              {isHome(pathname) ? "Seu ritmo, sua transformação" : ""}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/ranking"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/40 text-foreground transition hover:bg-card"
            aria-label="Ranking"
          >
            <Trophy className="h-4 w-4" />
          </Link>
          <Link
            to="/messages"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/40 text-foreground transition hover:bg-card"
            aria-label="Mensagens"
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
