import { NAVER_SHOPPING_BASE_URL, PAGE_SIZE } from "../config/constants";

// NOTE: pagingIndex 파라미터명은 브라우저에서 직접 2페이지로 이동했을 때
// 주소창의 실제 파라미터명과 일치하는지 한 번 확인이 필요하다.
// (개발자도구 없이, 그냥 페이지 하단에서 2페이지 클릭 후 주소창만 보면 됨)
export function buildSearchUrl(keyword: string, pagingIndex: number = 1): string {
  const query = encodeURIComponent(keyword);

  return `${NAVER_SHOPPING_BASE_URL}?query=${query}&vertical=search&pagingIndex=${pagingIndex}&pagingSize=${PAGE_SIZE}`;
}
