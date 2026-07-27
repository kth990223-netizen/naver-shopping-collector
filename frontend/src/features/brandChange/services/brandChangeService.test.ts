import { describe, expect, it } from "vitest";
import { getTransitions, type KeywordHistory } from "./brandChangeService";

describe("getTransitions", () => {
  it("marks the first run as having no previous comparison", () => {
    const history: KeywordHistory = {
      keyword: "키워드A",
      runs: [{ collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a", "b"], brandPages: {} }],
    };

    const [first] = getTransitions(history);

    expect(first.fromRunAt).toBeNull();
    expect(first.diffCount).toBeNull();
    expect(first.count).toBe(2);
    expect(first.added).toEqual([]);
    expect(first.removed).toEqual([]);
  });

  it("computes added/removed brands and diffCount between consecutive runs", () => {
    const history: KeywordHistory = {
      keyword: "키워드A",
      runs: [
        { collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a", "b"], brandPages: {} },
        { collectedAt: "2026-01-01T01:00:00.000Z", brands: ["b", "c", "d"], brandPages: {} },
      ],
    };

    const [, second] = getTransitions(history);

    expect(second.fromRunAt).toBe("2026-01-01T00:00:00.000Z");
    expect(second.toRunAt).toBe("2026-01-01T01:00:00.000Z");
    expect(second.count).toBe(3);
    expect(second.diffCount).toBe(1);
    expect(second.added.sort()).toEqual(["c", "d"]);
    expect(second.removed).toEqual(["a"]);
  });

  it("reports zero diff and no changes when the brand set is unchanged", () => {
    const history: KeywordHistory = {
      keyword: "키워드A",
      runs: [
        { collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a", "b"], brandPages: {} },
        { collectedAt: "2026-01-01T01:00:00.000Z", brands: ["a", "b"], brandPages: {} },
      ],
    };

    const [, second] = getTransitions(history);

    expect(second.diffCount).toBe(0);
    expect(second.added).toEqual([]);
    expect(second.removed).toEqual([]);
  });
});
