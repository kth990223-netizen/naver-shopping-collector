import { useMemo, useState } from "react";

import KeywordForm from "../components/keyword/KeywordForm";
import KeywordTable from "../components/keyword/KeywordTable";
import TableSkeleton from "../components/common/TableSkeleton";

import { useKeywords } from "../hooks/useKeywords";
import { useAuth } from "../contexts/AuthContext";
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
  const { user, loading: authLoading } = useAuth();
  const { data = [], isLoading, create, createMany, remove, toggle } = useKeywords();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("created_desc");
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

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

    try {
      if (toCreate.length > 0) {
        await createMany.mutateAsync(toCreate);
      }

      if (skipped > 0) {
        alert(
          `${toCreate.length}개 등록되었습니다. ${skipped}개는 이미 등록되어 있어 제외했습니다.`,
        );
      }
    } catch (err) {
      setError(`키워드 추가 실패: ${(err as Error).message}`);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await remove.mutateAsync(id);
    } catch (err) {
      setError(`키워드 삭제 실패: ${(err as Error).message}`);
    }
  }

  async function handleToggle(item: Keyword) {
    setError(null);
    try {
      await toggle.mutateAsync({
        id: item.id,
        enabled: !item.enabled,
      });
    } catch (err) {
      setError(`상태 변경 실패: ${(err as Error).message}`);
    }
  }

  if (isLoading || authLoading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">키워드 관리</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        {search || filter !== "all"
          ? `검색 결과 ${filteredKeywords.length}개 (전체 ${counts.all}개)`
          : `총 ${counts.all}개의 키워드`}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {user ? (
        <KeywordForm
          onAdd={handleAdd}
          loading={create.isPending || createMany.isPending}
        />
      ) : (
        <p className="mb-5 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">
          로그인하면 키워드를 추가·삭제·사용여부 변경할 수 있습니다.
        </p>
      )}

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
        readOnly={!user}
      />
    </div>
  );
}
