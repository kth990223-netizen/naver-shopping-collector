import { getBrandAds } from "./services/graphqlClient";

async function main() {
  console.log("===== TEST =====");

  const ads = await getBrandAds("닭가슴살");

  console.table(ads);
}

main().catch(console.error);
