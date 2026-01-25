import { createClient } from "@supabase/supabase-js";

function readEnv(key: string) {
  const raw = (import.meta.env[key] as string | undefined) ?? undefined;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

const supabaseUrl = readEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

function isValidHttpUrl(url: string | undefined) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const hasSupabaseEnv = Boolean(
  isValidHttpUrl(supabaseUrl) && supabaseAnonKey,
);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as ReturnType<typeof createClient>);
