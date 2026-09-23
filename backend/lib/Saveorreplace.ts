import { supabase } from "../supabase/supa-client";

const normalize = (value: unknown) =>
  String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Saves an AI result so the same topic (or idea) never creates a duplicate row.
 *
 * - If this user already has a row whose `keyColumn` matches `keyValue`
 *   (ignoring case and extra spaces), that row is updated in place and its
 *   created_at is bumped so it moves to the top of the history list.
 * - Otherwise a new row is inserted.
 *
 * `row` holds every column EXCEPT user_id and keyColumn. The originally saved
 * key text is kept on update, so the topic-based cascade delete keeps matching.
 *
 * `extraMatch` adds more columns that must also be equal, for example
 * { file_name } so two different papers under one topic stay separate.
 */
export async function saveOrReplace(
  table: string,
  user_id: string,
  keyColumn: string,
  keyValue: string,
  row: Record<string, unknown>,
  extraMatch: Record<string, string> = {}
): Promise<{ error: any }> {
  const cleanKey = keyValue.trim();
  const wanted = normalize(cleanKey);
  const columns = ["id", keyColumn, ...Object.keys(extraMatch)].join(", ");

  // Matching is done in JS so case and repeated spaces are handled exactly,
  // without LIKE-pattern escaping problems. Only id + key columns are fetched.
  const { data, error: lookupError } = await supabase
    .from(table)
    .select(columns)
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (lookupError) return { error: lookupError };

  const existing = ((data ?? []) as unknown as any[]).find(
    (r) =>
      normalize(r[keyColumn]) === wanted &&
      Object.entries(extraMatch).every(([col, val]) => r[col] === val)
  );

  if (existing) {
    const { error } = await supabase
      .from(table)
      .update({ ...row, created_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("user_id", user_id);
    return { error };
  }

  const { error } = await supabase
    .from(table)
    .insert({ ...row, user_id, [keyColumn]: cleanKey });
  return { error };
}