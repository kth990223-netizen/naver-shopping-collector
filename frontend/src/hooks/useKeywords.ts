import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createKeyword,
  createKeywords,
  getKeywords,
  removeKeyword,
  updateKeywordEnabled,
} from "../services/keywordService";

export function useKeywords() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["keywords"],
    queryFn: getKeywords,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["keywords"],
    });

  const create = useMutation({
    mutationFn: createKeyword,
    onSuccess: refresh,
  });

  const createMany = useMutation({
    mutationFn: createKeywords,
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: removeKeyword,
    onSuccess: refresh,
  });

  const toggle = useMutation({
    mutationFn: ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) =>
      updateKeywordEnabled(id, enabled),

    onSuccess: refresh,
  });

  return {
    ...query,
    create,
    createMany,
    remove,
    toggle,
  };
}