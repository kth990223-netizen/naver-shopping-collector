import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../services/brandService";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
  });
}