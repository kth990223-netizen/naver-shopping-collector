import { useMemo, useState } from "react";

import KeywordForm from "../components/keyword/KeywordForm";
import KeywordTable from "../components/keyword/KeywordTable";

import { useKeywords } from "../hooks/useKeywords";
import type { Keyword } from "../types/keyword";

export default function KeywordPage() {
  const { data = [], isLoading, create, remove, toggle } = useKeywords();

  const [search, setSearch] = useState("");

  const filteredKeywords = useMemo(() => {
    return data.filter((item) =>
      item.keyword.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  async function handleAdd(keyword: string) {
    if (
      data.some((item) => item.keyword.toLowerCase() === keyword.toLowerCase())
    ) {
      alert("이미 등록된 키워드입니다.");
      return;
    }

    await create.mutateAsync(keyword);
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

      <KeywordForm onAdd={handleAdd} loading={create.isPending} />

      <div className="mb-5">
        <input
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <KeywordTable
        keywords={filteredKeywords}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </div>
  );
}
