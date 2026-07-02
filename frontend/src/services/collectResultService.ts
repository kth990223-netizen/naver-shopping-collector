import { supabase } from "../lib/supabase";
import type { CollectResult } from "../types/collectResult";

export async function getCollectResults(): Promise<CollectResult[]> {
  const { data, error } = await supabase
    .from("collect_results")
    .select("*")
    .order("collected_at", { ascending: false });

  if (error) throw error;

  return data;
}
