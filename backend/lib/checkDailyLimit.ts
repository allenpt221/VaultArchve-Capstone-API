import { supabase } from "../supabase/supa-client";

export async function checkDailyLimit(
  user_id: string,
  table: string,
  limit: number
): Promise<{ allowed: boolean; count: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id)
    .gte("created_at", startOfDay.toISOString());

  if (error) throw error;

  return { allowed: (count ?? 0) < limit, count: count ?? 0 };
}