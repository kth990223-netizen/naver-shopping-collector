import axios from "axios";
import type { Ad } from "../types/ad";

const URL = "https://search.shopping.naver.com/api/graphql";

export async function getBrandAds(keyword: string): Promise<Ad[]> {
  const body = {
    operationName: "BrandAd",
    query: `
      query BrandAd($params: BrandAdInput) {
        BrandAd(params: $params) {
          brandAds {
            brandName
            isBrandStore
            cards {
              type
              ... on ProductCard {
                products {
                  name
                  clickUrl
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      params: {
        query: keyword,
        viewType: "list",
        isCatalog: false,
      },
    },
  };

  const { data } = await axios.post(URL, body, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://search.shopping.naver.com",
      Referer: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}&vertical=search`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
    },
  });

  const brandAds = data.data.BrandAd.brandAds;

  const results: Ad[] = [];

  let rank = 1;

  for (const ad of brandAds) {
    // 브랜드스토어 제외
    if (ad.isBrandStore) continue;

    const productCard = ad.cards.find((card: any) => card.type === "product");

    if (!productCard) continue;

    for (const product of productCard.products) {
      results.push({
        keyword,
        brandName: ad.brandName,
        productName: product.name,
        productUrl: product.clickUrl,
        adRank: rank++,
        page: 1,
      });
    }
  }

  return results;
}
