import type { Brand } from "../../types/brand";

interface Props {
  brand: Brand;
}

export default function BrandRow({ brand }: Props) {
  return (
    <tr>
      <td>{brand.brand_name}</td>

      <td align="center">
        {new Date(brand.first_seen).toLocaleDateString()}
      </td>

      <td align="center">
        {new Date(brand.last_seen).toLocaleDateString()}
      </td>
    </tr>
  );
}