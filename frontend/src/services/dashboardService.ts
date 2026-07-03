import { supabase } from "../lib/supabase";

export interface DashboardStats {
  totalKeywords: number;
  totalBrands: number;
  todayCollectedCount: number;
  lastCollectedAt: string | null;
  lastCollectedKeyword: string | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [keywordsRes, brandsRes, todayRes, lastRes] = await Promise.all([
    supabase.from("keywords").select("*", { count: "exact", head: true }),
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase
      .from("collect_results")
      .select("*", { count: "exact", head: true })
      .gte("collected_at", todayStart.toISOString()),
    supabase
      .from("collect_results")
      .select("keyword, collected_at")
      .order("collected_at", { ascending: false })
      .limit(1),
  ]);

  if (keywordsRes.error) throw keywordsRes.error;
  if (brandsRes.error) throw brandsRes.error;
  if (todayRes.error) throw todayRes.error;
  if (lastRes.error) throw lastRes.error;

  const last = lastRes.data?.[0];

  return {
    totalKeywords: keywordsRes.count ?? 0,
    totalBrands: brandsRes.count ?? 0,
    todayCollectedCount: todayRes.count ?? 0,
    lastCollectedAt: last?.collected_at ?? null,
    lastCollectedKeyword: last?.keyword ?? null,
  };
}
