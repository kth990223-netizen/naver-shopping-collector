import {
  MAX_PAGE,
  REQUEST_DELAY_JITTER_MS,
  REQUEST_DELAY_MS,
} from "../config/constants";
import { parseShoppingHtml } from "../parser/shoppingParser";
import { fetchSearchPageHtml } from "./searchPageClient";
import { Ad } from "../types/ad";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function jitteredDelay(): number {
  return REQUEST_DELAY_MS + Math.floor(Math.random() * REQUEST_DELAY_JITTER_MS);
}

/**
 * 키워드 하나에 대해 1~MAX_PAGE 페이지를 순회하며,
 * "광고 중인 상품" 중 "브랜드스토어 상품은 제외"한 결과만 모아서 반환한다.
 *
 * 브라우저(CDP 연결) 생명주기는 호출부(여러 키워드를 순회하는 쪽)에서 관리한다.
 */
export async function collectKeyword(keyword: string): Promise<Ad[]> {
  console.log("==========================");
  console.log(`Keyword : ${keyword}`);

  const results: Ad[] = [];

  for (let page = 1; page <= MAX_PAGE; page++) {
    try {
      const html = await fetchSearchPageHtml(keyword, page);
      const items = parseShoppingHtml(html, keyword, page);

      const ads = items.filter((item) => item.adId && !item.isBrandStore);

      console.log(
        `  page ${page}: 전체 ${items.length}개 중 광고(비-브랜드스토어) ${ads.length}개`
      );

      results.push(...ads);
    } catch (err) {
      console.error(`  page ${page} 수집 실패:`, (err as Error).message);
    }

    if (page < MAX_PAGE) {
      await sleep(jitteredDelay());
    }
  }

  return results;
}
