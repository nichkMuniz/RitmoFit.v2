import "./global.css";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AppLayout } from "@/layouts/AppLayout";
import { RequireAuth } from "@/routes/RequireAuth";

import Auth from "./pages/Auth";
import OnboardingGoals from "./pages/OnboardingGoals";
import Index from "./pages/Index";
import Reels from "./pages/Reels";
import CreatePost from "./pages/CreatePost";
import Search from "./pages/Search";
import Routines from "./pages/Routines";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route element={<RequireAuth />}>
                <Route path="/onboarding/goals" element={<OnboardingGoals />} />

                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/reels" element={<Reels />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/routines" element={<Routines />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/ranking" element={<Ranking />} />
                </Route>
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
