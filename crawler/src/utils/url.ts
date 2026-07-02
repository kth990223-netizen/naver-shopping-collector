import { NAVER_SHOPPING_BASE_URL } from "../config/constants";

export function buildSearchUrl(keyword: string, page: number = 1): string {
  const query = encodeURIComponent(keyword);

  return `${NAVER_SHOPPING_BASE_URL}?query=${query}&page=${page}`;
}