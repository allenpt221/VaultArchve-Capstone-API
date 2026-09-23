import { supabase } from "../supabase/supa-client";

// The "day" resets at midnight Philippine time (UTC+8, no DST) instead of the
// server's local midnight, so it doesn't reset at 8:00 AM when the server runs in UTC.
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

function startOfTodayPH(): Date {
  const phNow = new Date(Date.now() + PH_OFFSET_MS);
  const phMidnightUtcMs = Date.UTC(
    phNow.getUTCFullYear(),
    phNow.getUTCMonth(),
    phNow.getUTCDate()
  );
  return new Date(phMidnightUtcMs - PH_OFFSET_MS);
}

/**
 * Counts today's AI calls for one user + feature from the ai_usage_log table.
 * Deleting saved results does NOT affect this count.
 */
export async function checkUsageLimit(
  user_id: string,
  feature: string,
  limit: number
): Promise<{ allowed: boolean; count: number }> {
  const { count, error } = await supabase
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("feature", feature)
    .gte("created_at", startOfTodayPH().toISOString());

  if (error) throw error;

  if (count === null) {
    throw new Error(`Usage check for "${feature}" returned no count. Does ai_usage_log exist?`);
  }

  return { allowed: count < limit, count };
}

/**
 * Records one AI call. Call it right after the model responds, since that is
 * the moment the call has cost money, whether or not saving the result works.
 */
export async function logUsage(user_id: string, feature: string): Promise<void> {
  const { error } = await supabase.from("ai_usage_log").insert({ user_id, feature });
  if (error) console.log("Failed to log AI usage:", error);
}