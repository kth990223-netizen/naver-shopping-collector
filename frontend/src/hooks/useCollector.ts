import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollectorStatus, startCollection } from "../services/collectorClient";

export function useCollectorStatus() {
  return useQuery({
    queryKey: ["collector-status"],
    queryFn: getCollectorStatus,
    retry: false,
    refetchInterval: (query) => (query.state.data?.running ? 2000 : 5000),
  });
}

export function useStartCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collector-status"] });
    },
  });
}
