import { buildSearchUrl } from "../utils/url";

export async function collectKeyword(keyword: string) {
  console.log("==========================");
  console.log(`Keyword : ${keyword}`);

  for (let page = 1; page <= 18; page++) {
    const url = buildSearchUrl(keyword, page);

    console.log(url);
  }
}