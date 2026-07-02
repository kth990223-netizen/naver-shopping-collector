import * as cheerio from "cheerio";
import { Ad } from "../types/ad";

export function parseShoppingHtml(
  html: string,
  keyword: string,
  page: number
): Ad[] {

  const $ = cheerio.load(html);

  const ads: Ad[] = [];

  // TODO

  return ads;
}