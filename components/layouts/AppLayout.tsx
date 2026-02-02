"use client";

import { AppTabBar } from "@/components/layout/AppTabBar";
import { AppTopBar } from "@/components/layout/AppTopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppTopBar />
      <main className="mx-auto w-full max-w-md px-4 pb-20 pt-16">
        {children}
      </main>
      <AppTabBar />
    </div>
  );
}
