import * as cheerio from "cheerio";
import { Ad } from "../types/ad";

/**
 * 네이버 쇼핑 검색 결과 SSR 페이지의 __NEXT_DATA__ 안에 들어있는
 * 상품 아이템 하나의 형태. 실제 응답 필드가 훨씬 많지만
 * 여기서 쓰는 것만 최소한으로 타이핑한다 (나머지는 unknown 취급).
 */
interface RawSearchItem {
  id: string | number;
  adId: string | null;
  rank: number;
  productTitle: string;
  mallName: string;
  mallId: string;
  price: number | string;
  formattedListPrice?: string;
  mallProductUrl?: string;
  crUrl?: string | null;
  isBrandStore: number;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 검색 결과 페이지 HTML에서 __NEXT_DATA__ JSON을 꺼내
 * props.pageProps.compositeList.list 를 반환한다.
 *
 * 네이버가 페이지 구조/쿼리 파라미터를 바꾸면 이 경로가 깨질 수 있으니,
 * 실패 시 원인을 바로 알 수 있도록 각 단계에서 명확한 에러를 던진다.
 */
function extractCompositeListItems(html: string): RawSearchItem[] {
  const $ = cheerio.load(html);

  const raw = $("#__NEXT_DATA__").text();

  if (!raw) {
    throw new Error(
      "__NEXT_DATA__ 스크립트를 찾지 못했습니다. 페이지 구조가 변경되었거나, 차단 페이지(캡차 등)가 내려왔을 수 있습니다."
    );
  }

  let json: any;

  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("__NEXT_DATA__ JSON 파싱에 실패했습니다.");
  }

  const list = json?.props?.pageProps?.compositeList?.list;

  if (!Array.isArray(list)) {
    throw new Error(
      "compositeList.list 경로를 찾지 못했습니다. 네이버 응답 구조가 변경된 것으로 보입니다."
    );
  }

  return list.map((entry: any) => entry.item) as RawSearchItem[];
}

/**
 * 검색 결과 페이지 하나(page)를 파싱해 전체 상품(광고+오가닉)을
 * 정규화된 Ad[]로 반환한다. 광고/브랜드스토어 필터링은 호출부(collectorService)에서 한다.
 */
export function parseShoppingHtml(html: string, keyword: string, page: number): Ad[] {
  const items = extractCompositeListItems(html);

  return items.map((item) => ({
    keyword,
    page,
    rank: item.rank,
    productId: String(item.id),
    adId: item.adId ?? "",
    productTitle: item.productTitle,
    mallName: item.mallName,
    mallId: item.mallId,
    price: toNumber(item.price),
    listPrice: toNumber(item.formattedListPrice),
    productUrl: item.mallProductUrl || item.crUrl || "",
    isBrandStore: Boolean(item.isBrandStore),
  }));
}
