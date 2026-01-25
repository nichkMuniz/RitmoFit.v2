import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-background px-4 pb-20 pt-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Página não encontrada: <span className="text-foreground">{location.pathname}</span>
          </p>

          <Link
            to="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Voltar para o Feed
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
