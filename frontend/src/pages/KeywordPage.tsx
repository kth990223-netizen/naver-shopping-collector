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
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>키워드 관리</h1>

      <p>총 {filteredKeywords.length}개의 키워드</p>

      <KeywordForm onAdd={handleAdd} loading={create.isPending} />

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
