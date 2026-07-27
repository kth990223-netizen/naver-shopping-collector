import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOldResults } from "../services/cleanupService";

export function useCleanupOldResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOldResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["keyword-histories"] });
    },
  });
}
