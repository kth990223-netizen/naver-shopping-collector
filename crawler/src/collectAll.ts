import { collectKeyword, jitteredDelay } from "./services/collectorService";
import {
  closeBrowser,
  ensureBrowserReady,
  HardBlockError,
} from "./services/searchPageClient";
import { getEnabledKeywords } from "./services/keywordService";
import { saveResults } from "./services/resultService";
import { upsertBrandsSeen } from "./services/brandService";
import { Ad } from "./types/ad";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CollectionSummary {
  keywordCount: number;
  totalAds: number;
}

/**
 * 활성화된 키워드를 전부 순회하며 수집하고 Supabase에 저장한다.
 * CLI(index.ts)와 로컬 서버(server.ts) 양쪽에서 재사용한다.
 */
export async function runCollection(): Promise<CollectionSummary> {
  console.log("===== 네이버 쇼핑 광고 수집 =====");

  const keywords = await getEnabledKeywords();

  if (keywords.length === 0) {
    console.log("활성화된 키워드가 없습니다.");
    return { keywordCount: 0, totalAds: 0 };
  }

  console.log(
    `대상 키워드 ${keywords.length}개: ${keywords.map((k) => k.keyword).join(", ")}`
  );

  const allAds: Ad[] = [];

  try {
    // Chrome(npm run chrome)이 안 떠있으면 페이지마다 헛되이 재시도하지 않고 바로 실패시킨다.
    await ensureBrowserReady();

    for (let i = 0; i < keywords.length; i++) {
      let ads: Ad[];

      try {
        ads = await collectKeyword(keywords[i].keyword, i + 1, keywords.length);
      } catch (err) {
        // 418 하드 블록이면 남은 키워드까지 돌리는 게 무의미하므로 전체 중단.
        if (err instanceof HardBlockError) {
          console.error(`\n${(err as Error).message}`);
          break;
        }
        throw err;
      }

      allAds.push(...ads);

      try {
        await saveResults(ads);
        await upsertBrandsSeen(ads.map((ad) => ad.mallName));
      } catch (err) {
        console.error(`  Supabase 저장 실패:`, (err as Error).message);
      }

      if (i < keywords.length - 1) {
        await sleep(jitteredDelay());
      }
    }
  } finally {
    // 브라우저(CDP 연결)는 모든 키워드 수집이 끝난 뒤 한 번만 정리한다.
    await closeBrowser();
  }

  console.log(`총 ${allAds.length}건 수집 (키워드 ${keywords.length}개)`);

  return { keywordCount: keywords.length, totalAds: allAds.length };
}
