"use client";

import { useSession } from "@/hooks/useSession";

interface RequireAuthProps {
  children: React.ReactNode;
  onUnauthenticated?: () => void;
}

export function RequireAuth({ children, onUnauthenticated }: RequireAuthProps) {
  const { user, isReady } = useSession();

  if (!isReady) {
    return (
      <div className="min-h-dvh bg-background px-4 pb-10 pt-16 text-foreground">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (onUnauthenticated) {
      onUnauthenticated();
    }
    return null;
  }

  return <>{children}</>;
}
