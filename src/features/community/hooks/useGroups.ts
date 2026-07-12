import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.service';
import { Group } from '@/types';

export const useGroups = () => {
  const qc = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get<{ data: Group[] }>('/community/groups').then(r => r.data.data),
  });

  const { mutate: createGroup } = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      api.post('/community/groups', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  return { groups, isLoading, createGroup };
};
