import type { Brand } from "../../types/brand";

interface Props {
  brand: Brand;
}

export default function BrandRow({ brand }: Props) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-800">{brand.brand_name}</td>

      <td className="px-4 py-3 text-center text-sm text-slate-500">
        {new Date(brand.first_seen).toLocaleDateString()}
      </td>

      <td className="px-4 py-3 text-center text-sm text-slate-500">
        {new Date(brand.last_seen).toLocaleDateString()}
      </td>
    </tr>
  );
}
