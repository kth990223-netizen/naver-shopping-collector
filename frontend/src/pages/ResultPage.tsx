import { useEffect, useMemo, useState } from "react";
import { getCollectResults } from "../services/collectResultService";
import type { CollectResult } from "../types/collectResult";

export default function ResultPage() {
  const [results, setResults] = useState<CollectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const data = await getCollectResults();
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return results.filter(
      (item) =>
        item.keyword.toLowerCase().includes(search.toLowerCase()) ||
        item.brand_name.toLowerCase().includes(search.toLowerCase()) ||
        item.product_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [results, search]);

  if (loading) {
    return <h2 className="text-lg text-slate-500">Loading...</h2>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">수집 결과</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">총 {filtered.length}건</p>

      <input
        placeholder="키워드 / 브랜드 / 상품명 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-96 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 text-left">키워드</th>
              <th className="px-4 py-3 text-left">브랜드</th>
              <th className="px-4 py-3 text-left">상품명</th>
              <th className="w-20 px-4 py-3 text-center">순위</th>
              <th className="w-44 px-4 py-3 text-center">수집일</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  수집된 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-sm text-slate-800">{item.keyword}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{item.brand_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{item.product_name}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-500">
                    {item.ad_rank}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-500">
                    {new Date(item.collected_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
