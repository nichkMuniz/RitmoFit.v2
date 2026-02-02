import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "@/hooks/useSession";

export function RequireAuth() {
  const { user, isReady } = useSession();
  const location = useLocation();

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
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
