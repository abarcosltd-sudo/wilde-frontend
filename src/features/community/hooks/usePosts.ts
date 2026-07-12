import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.service';
import { Post } from '@/types';

export const usePosts = (groupId?: string) => {
  const qc = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['posts', groupId],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ data: Post[]; hasMore: boolean }>('/community/posts', {
        params: { groupId, page: pageParam, limit: 20 },
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (last, all) => last.hasMore ? all.length + 1 : undefined,
  });

  const { mutate: createPost } = useMutation({
    mutationFn: (content: string) =>
      api.post('/community/posts', { content, groupId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', groupId] }),
  });

  const posts = data?.pages.flatMap(p => p.data) ?? [];
  return { posts, fetchNextPage, hasNextPage, isLoading, createPost };
};
