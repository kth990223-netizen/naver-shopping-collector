import BrandRow from "./BrandRow";
import type { Brand } from "../../types/brand";

interface Props {
  brands: Brand[];
}

export default function BrandTable({ brands }: Props) {
  return (
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
          <th>브랜드명</th>
          <th width="180">최초 발견</th>
          <th width="180">마지막 발견</th>
        </tr>
      </thead>

      <tbody>
        {brands.length === 0 ? (
          <tr>
            <td colSpan={3} align="center">
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
  );
}