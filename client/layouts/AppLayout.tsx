import { Outlet } from "react-router-dom";
import { AppTabBar } from "@/components/layout/AppTabBar";
import { AppTopBar } from "@/components/layout/AppTopBar";

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppTopBar />
      <main className="mx-auto w-full max-w-md px-4 pb-20 pt-16">
        <Outlet />
      </main>
      <AppTabBar />
    </div>
  );
}
