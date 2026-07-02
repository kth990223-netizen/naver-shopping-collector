import { useEffect, useMemo, useState } from "react";
import { getCollectResults } from "../services/collectResultService";
import type { CollectResult } from "../types/collectResult";

export default function ResultPage() {
  const [results, setResults] = useState<CollectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    try {
      const data = await getCollectResults();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return results.filter(
      (item) =>
        item.keyword.toLowerCase().includes(search.toLowerCase()) ||
        item.brand_name.toLowerCase().includes(search.toLowerCase()) ||
        item.product_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [results, search]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>수집 결과</h1>

      <p>총 {filtered.length}건</p>

      <input
        placeholder="키워드 / 브랜드 / 상품명 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: 400,
          marginBottom: 20,
          padding: 8,
        }}
      />

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>키워드</th>
            <th>브랜드</th>
            <th>상품명</th>
            <th width="80">순위</th>
            <th width="180">수집일</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} align="center">
                수집된 데이터가 없습니다.
              </td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr key={item.id}>
                <td>{item.keyword}</td>
                <td>{item.brand_name}</td>
                <td>{item.product_name}</td>
                <td align="center">{item.ad_rank}</td>
                <td align="center">
                  {new Date(item.collected_at).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}