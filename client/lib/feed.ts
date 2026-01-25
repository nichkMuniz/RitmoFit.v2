import { supabase } from "@/lib/supabase";

export async function fetchFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      description,
      photo,
      text,
      created_at,
      user_goal_id,
      users (
        id,
        name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
