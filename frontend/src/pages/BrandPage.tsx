import { useMemo, useState } from "react";

import BrandTable from "../components/brand/BrandTable";
import { useBrands } from "../hooks/useBrands";

export default function BrandPage() {
  const { data = [], isLoading } = useBrands();

  const [search, setSearch] = useState("");

  const filteredBrands = useMemo(() => {
    return data.filter((item) =>
      item.brand_name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  if (isLoading) {
    return <h2 className="text-lg text-slate-500">Loading...</h2>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">브랜드 관리</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        총 {filteredBrands.length}개의 브랜드
      </p>

      <div className="mb-5">
        <input
          placeholder="브랜드 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <BrandTable brands={filteredBrands} />
    </div>
  );
}
