import { useQuery } from "@tanstack/react-query";
import { getBrandChanges } from "../services/brandChangeService";

export function useBrandChanges() {
  return useQuery({
    queryKey: ["brand-changes"],
    queryFn: getBrandChanges,
  });
}
