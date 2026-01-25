import { NavLink } from "react-router-dom";
import {
  Clapperboard,
  Dumbbell,
  Home,
  PlusSquare,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { to: "/", label: "Feed", Icon: Home },
  { to: "/reels", label: "Reels", Icon: Clapperboard },
  { to: "/create", label: "Criar", Icon: PlusSquare },
  { to: "/routines", label: "Rotinas", Icon: Dumbbell },
  { to: "/profile", label: "Perfil", Icon: UserRound },
];

export function AppTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/70 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur supports-[backdrop-filter]:bg-background/50"
      aria-label="Navegação"
    >
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-3">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex w-[20%] flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] text-muted-foreground transition",
                isActive && "text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl transition",
                    isActive
                      ? "bg-card shadow-[0_0_0_1px_hsl(var(--border))]"
                      : "group-hover:bg-card/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      to === "/create" && "h-[22px] w-[22px] text-brand-pink",
                    )}
                  />
                </span>
                <span className="sr-only sm:not-sr-only">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
