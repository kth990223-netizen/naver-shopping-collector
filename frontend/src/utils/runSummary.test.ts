import { describe, expect, it } from "vitest";
import { buildRunSummaries } from "./runSummary";
import type { KeywordHistory } from "../services/brandChangeService";

describe("buildRunSummaries", () => {
  it("returns an empty array when there is no history", () => {
    expect(buildRunSummaries([])).toEqual([]);
  });

  it("groups keywords collected close together into a single run", () => {
    const histories: KeywordHistory[] = [
      {
        keyword: "키워드A",
        runs: [{ collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a", "b"], brandPages: {} }],
      },
      {
        keyword: "키워드B",
        runs: [{ collectedAt: "2026-01-01T00:05:00.000Z", brands: ["c"], brandPages: {} }],
      },
    ];

    const runs = buildRunSummaries(histories);

    expect(runs).toHaveLength(1);
    expect(runs[0].total).toBe(3);
    expect(runs[0].keywords.map((k) => k.keyword)).toEqual(["키워드A", "키워드B"]);
    expect(runs[0].startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(runs[0].endedAt).toBe("2026-01-01T00:05:00.000Z");
  });

  it("splits into separate runs when the gap exceeds 90 minutes, newest first", () => {
    const histories: KeywordHistory[] = [
      {
        keyword: "키워드A",
        runs: [
          { collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a"], brandPages: {} },
          { collectedAt: "2026-01-01T03:00:00.000Z", brands: ["a", "b"], brandPages: {} },
        ],
      },
    ];

    const runs = buildRunSummaries(histories);

    expect(runs).toHaveLength(2);
    expect(runs[0].startedAt).toBe("2026-01-01T03:00:00.000Z");
    expect(runs[0].total).toBe(2);
    expect(runs[1].startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(runs[1].total).toBe(1);
  });

  it("keeps entries within a 90-minute gap in the same run", () => {
    const histories: KeywordHistory[] = [
      {
        keyword: "키워드A",
        runs: [
          { collectedAt: "2026-01-01T00:00:00.000Z", brands: ["a"], brandPages: {} },
          { collectedAt: "2026-01-01T01:00:00.000Z", brands: ["a", "b"], brandPages: {} },
        ],
      },
    ];

    const runs = buildRunSummaries(histories);

    expect(runs).toHaveLength(1);
    expect(runs[0].total).toBe(3);
  });
});
