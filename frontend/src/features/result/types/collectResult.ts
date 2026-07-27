export interface CollectResult {
  id: string;
  keyword: string;
  brand_name: string;
  product_name: string;
  product_url: string | null;
  ad_rank: number;
  page: number | null;
  collected_at: string;
  created_at: string;
}