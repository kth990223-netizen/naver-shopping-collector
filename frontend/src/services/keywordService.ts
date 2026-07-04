import { supabase } from "../lib/supabase";
import type { Keyword } from "../types/keyword";

export async function getKeywords(): Promise<Keyword[]> {
  const { data, error } = await supabase
    .from("keywords")
    .select("*")
    .order("keyword");

  if (error) throw error;

  return data as Keyword[];
}

export async function createKeyword(keyword: string) {
  const value = keyword.trim();

  const { error } = await supabase.from("keywords").insert({
    keyword: value,
  });

  if (error) throw error;
}

export async function createKeywords(keywords: string[]) {
  if (keywords.length === 0) return;

  const { error } = await supabase
    .from("keywords")
    .insert(keywords.map((keyword) => ({ keyword })));

  if (error) throw error;
}

export async function removeKeyword(id: string) {
  const { error } = await supabase.from("keywords").delete().eq("id", id);

  if (error) throw error;
}

export async function updateKeywordEnabled(id: string, enabled: boolean) {
  const { error } = await supabase
    .from("keywords")
    .update({
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
