import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getKeywords,
  createKeyword,
  removeKeyword,
  updateKeywordEnabled,
} from "../services/keywordService";

export function useKeywords() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["keywords"],
    queryFn: getKeywords,
  });

  const create = useMutation({
    mutationFn: createKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["keywords"],
      });
    },
  });

  const remove = useMutation({
    mutationFn: removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["keywords"],
      });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateKeywordEnabled(id, enabled),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["keywords"],
      });
    },
  });

  return {
    ...query,
    create,
    remove,
    toggle,
  };
}
