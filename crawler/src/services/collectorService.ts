import {
  EARLY_STOP_NO_AD_PAGES,
  MAX_PAGE,
  REQUEST_DELAY_JITTER_MS,
  REQUEST_DELAY_MS,
} from "../config/constants";
import { parseShoppingHtml } from "../parser/shoppingParser";
import { fetchSearchPageHtml, HardBlockError } from "./searchPageClient";
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
 * - 진행 상황을 [순번/전체] 형태로 로그에 찍는다.
 * - 조기 종료: "정상 파싱된 광고 0개" 페이지가 EARLY_STOP_NO_AD_PAGES회 연속이면 중단.
 *   광고가 있는 페이지를 만나면 카운터를 리셋하고, 수집 실패한 페이지는 판정에서 제외한다.
 * - 418 하드 블록(HardBlockError)은 위로 전파해서 전체 수집을 중단시킨다.
 *
 * 브라우저(CDP 연결) 생명주기는 호출부(여러 키워드를 순회하는 쪽)에서 관리한다.
 */
export async function collectKeyword(
  keyword: string,
  index: number,
  total: number
): Promise<Ad[]> {
  const label = `[${index}/${total}]`;

  console.log("==========================");
  console.log(`${label} Keyword : ${keyword}`);

  const results: Ad[] = [];
  let consecutiveNoAd = 0;

  for (let page = 1; page <= MAX_PAGE; page++) {
    let parsed = false;
    let adCount = 0;

    try {
      const html = await fetchSearchPageHtml(keyword, page);
      const items = parseShoppingHtml(html, keyword, page);

      const ads = items.filter((item) => item.adId && !item.isBrandStore);
      adCount = ads.length;
      parsed = true;

      console.log(
        `  page ${page}: 전체 ${items.length}개 중 광고(비-브랜드스토어) ${ads.length}개`
      );

      results.push(...ads);
    } catch (err) {
      // 418 하드 블록은 전체 수집을 멈춰야 하므로 그대로 위로 던진다.
      if (err instanceof HardBlockError) throw err;
      // 그 외 실패(캡차 미해결/네트워크/구조변경)는 "광고 없음"이 아니라 판정 중립.
      console.error(`  page ${page} 수집 실패:`, (err as Error).message);
    }

    // 조기 종료 판정: 정상 파싱된 페이지만 카운트한다.
    if (parsed) {
      if (adCount === 0) {
        consecutiveNoAd++;
        if (consecutiveNoAd >= EARLY_STOP_NO_AD_PAGES) {
          console.log(
            `  광고 없는 페이지 ${EARLY_STOP_NO_AD_PAGES}회 연속 → page ${page}에서 조기 종료`
          );
          break;
        }
      } else {
        consecutiveNoAd = 0;
      }
    }

    if (page < MAX_PAGE) {
      await sleep(jitteredDelay());
    }
  }

  console.log(`${label} ${keyword} 완료 (광고 ${results.length}건)`);

  return results;
}
