import { useMemo, useState } from "react";

import KeywordForm from "../components/keyword/KeywordForm";
import KeywordTable from "../components/keyword/KeywordTable";

import { useKeywords } from "../hooks/useKeywords";
import type { Keyword } from "../types/keyword";

type FilterOption = "all" | "enabled" | "disabled";
type SortOption = "created_desc" | "created_asc" | "name_asc" | "enabled_first";

const FILTER_LABELS: Record<FilterOption, string> = {
  all: "전체",
  enabled: "사용중",
  disabled: "미사용",
};

const SORT_LABELS: Record<SortOption, string> = {
  created_desc: "등록일 최신순",
  created_asc: "등록일 오래된순",
  name_asc: "이름순",
  enabled_first: "사용중 먼저",
};

export default function KeywordPage() {
  const { data = [], isLoading, create, createMany, remove, toggle } = useKeywords();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("created_desc");

  const filteredKeywords = useMemo(() => {
    const bySearchAndFilter = data.filter((item) => {
      const matchesSearch = item.keyword
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "enabled"
            ? item.enabled
            : !item.enabled;

      return matchesSearch && matchesFilter;
    });

    return [...bySearchAndFilter].sort((a, b) => {
      switch (sort) {
        case "created_asc":
          return a.created_at.localeCompare(b.created_at);
        case "name_asc":
          return a.keyword.localeCompare(b.keyword, "ko");
        case "enabled_first":
          return Number(b.enabled) - Number(a.enabled);
        case "created_desc":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
  }, [data, search, filter, sort]);

  const counts = useMemo(
    () => ({
      all: data.length,
      enabled: data.filter((k) => k.enabled).length,
      disabled: data.filter((k) => !k.enabled).length,
    }),
    [data],
  );

  async function handleAdd(keywords: string[]) {
    const existingLower = new Set(
      data.map((item) => item.keyword.toLowerCase()),
    );
    const seen = new Set<string>();
    const toCreate: string[] = [];
    let skipped = 0;

    for (const raw of keywords) {
      const lower = raw.toLowerCase();

      if (existingLower.has(lower) || seen.has(lower)) {
        skipped++;
        continue;
      }

      seen.add(lower);
      toCreate.push(raw);
    }

    if (toCreate.length > 0) {
      await createMany.mutateAsync(toCreate);
    }

    if (skipped > 0) {
      alert(
        `${toCreate.length}개 등록되었습니다. ${skipped}개는 이미 등록되어 있어 제외했습니다.`,
      );
    }
  }

  async function handleDelete(id: string) {
    await remove.mutateAsync(id);
  }

  async function handleToggle(item: Keyword) {
    await toggle.mutateAsync({
      id: item.id,
      enabled: !item.enabled,
    });
  }

  if (isLoading) {
    return <h2 className="text-lg text-slate-500">Loading...</h2>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">키워드 관리</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        총 {filteredKeywords.length}개의 키워드
      </p>

      <KeywordForm
        onAdd={handleAdd}
        loading={create.isPending || createMany.isPending}
      />

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              filter === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {FILTER_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="mb-5 flex gap-2">
        <input
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <KeywordTable
        keywords={filteredKeywords}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </div>
  );
}
