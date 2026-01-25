import { hasSupabaseEnv, supabase } from "@/lib/supabase";

export async function fetchFeed() {
  if (!hasSupabaseEnv) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,description,photo,updated_at,user_id,user_goal_id,users(id,name,avatar_url)",
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
