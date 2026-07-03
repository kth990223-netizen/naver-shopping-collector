import { useQuery } from "@tanstack/react-query";
import { getKeywordHistories } from "../services/brandChangeService";

export function useKeywordHistories() {
  return useQuery({
    queryKey: ["keyword-histories"],
    queryFn: getKeywordHistories,
  });
}
