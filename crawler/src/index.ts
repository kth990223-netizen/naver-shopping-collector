import { collectKeyword, jitteredDelay } from "./services/collectorService";
import { closeBrowser } from "./services/searchPageClient";
import { getEnabledKeywords } from "./services/keywordService";
import { saveResults } from "./services/resultService";
import { upsertBrandsSeen } from "./services/brandService";
import { Ad } from "./types/ad";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("===== 네이버 쇼핑 광고 수집 =====");

  const keywords = await getEnabledKeywords();

  if (keywords.length === 0) {
    console.log("활성화된 키워드가 없습니다.");
    return;
  }

  console.log(
    `대상 키워드 ${keywords.length}개: ${keywords.map((k) => k.keyword).join(", ")}`
  );

  const allAds: Ad[] = [];

  try {
    for (let i = 0; i < keywords.length; i++) {
      const ads = await collectKeyword(keywords[i].keyword);
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
  console.table(
    allAds.map((ad) => ({
      keyword: ad.keyword,
      page: ad.page,
      rank: ad.rank,
      mallName: ad.mallName,
      productTitle: ad.productTitle,
      price: ad.price,
    }))
  );
}

main().catch(console.error);
