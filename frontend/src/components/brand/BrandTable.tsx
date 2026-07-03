import BrandRow from "./BrandRow";
import type { Brand } from "../../types/brand";

interface Props {
  brands: Brand[];
}

export default function BrandTable({ brands }: Props) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 text-left">브랜드명</th>
            <th className="w-44 px-4 py-3 text-center">최초 발견</th>
            <th className="w-44 px-4 py-3 text-center">마지막 발견</th>
          </tr>
        </thead>

        <tbody>
          {brands.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                등록된 브랜드가 없습니다.
              </td>
            </tr>
          ) : (
            brands.map((brand) => (
              <BrandRow key={brand.id} brand={brand} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
