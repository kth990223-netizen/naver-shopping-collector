import { supabase } from "../lib/supabase";
import type { Brand } from "../types/brand";

export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("brand_name");

  if (error) throw error;

  return data;
}