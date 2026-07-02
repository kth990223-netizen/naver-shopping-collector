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
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>브랜드 관리</h1>

      <p>총 {filteredBrands.length}개의 브랜드</p>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="브랜드 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <BrandTable brands={filteredBrands} />
    </div>
  );
}
