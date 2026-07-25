import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryDocuments, createDocument, deleteDocument, updateDocument,
  Collections, where, orderBy, limit, increment,
} from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Group, GroupMember } from '@/types';

/** Community groups, backed by Firestore — see the note in `usePosts`. */
export const useGroups = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const membershipKey = ['group-memberships', user?.uid] as const;

  const { data: groups = [], isPending: isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => queryDocuments<Group>(Collections.GROUPS, [
      orderBy('memberCount', 'desc'), limit(50),
    ]),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: membershipKey,
    queryFn: () => queryDocuments<GroupMember & { id: string }>(
      Collections.GROUP_MEMBERS, [where('userId', '==', user!.uid)]),
    enabled: !!user,
  });

  const joinedGroupIds = new Set(memberships.map(m => m.groupId));

  const { mutate: createGroup, isPending: isCreating } = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!user) throw new Error('Not signed in');
      const groupId = await createDocument(Collections.GROUPS, {
        name, description, createdBy: user.uid, memberCount: 1,
      });
      // The creator is the first member, so the group is never listed empty.
      await createDocument(Collections.GROUP_MEMBERS, {
        groupId, userId: user.uid, role: 'admin',
      });
      return groupId;
    },
    onError: () => showToast("Couldn't create that group. Please try again.", 'danger'),
    onSuccess: () => showToast('Group created', 'success'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: membershipKey });
    },
  });

  const { mutate: toggleMembership } = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not signed in');
      const existing = memberships.find(m => m.groupId === groupId);
      if (existing) {
        await deleteDocument(Collections.GROUP_MEMBERS, existing.id);
        await updateDocument(Collections.GROUPS, groupId, { memberCount: increment(-1) });
      } else {
        await createDocument(Collections.GROUP_MEMBERS, {
          groupId, userId: user.uid, role: 'member',
        });
        await updateDocument(Collections.GROUPS, groupId, { memberCount: increment(1) });
      }
    },

    // Join/Leave flips immediately, along with the member count next to it.
    onMutate: async (groupId: string) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: membershipKey }),
        qc.cancelQueries({ queryKey: ['groups'] }),
      ]);
      const prevMemberships = qc.getQueryData<(GroupMember & { id: string })[]>(membershipKey);
      const prevGroups = qc.getQueryData<Group[]>(['groups']);
      const wasJoined = joinedGroupIds.has(groupId);

      qc.setQueryData<(GroupMember & { id: string })[]>(membershipKey, old => wasJoined
        ? (old ?? []).filter(m => m.groupId !== groupId)
        : [...(old ?? []), {
            id: 'optimistic', groupId, userId: user!.uid, role: 'member', joinedAt: '',
          } as GroupMember & { id: string }]);

      qc.setQueryData<Group[]>(['groups'], old => old?.map(g => g.id === groupId
        ? { ...g, memberCount: Math.max(0, (g.memberCount ?? 0) + (wasJoined ? -1 : 1)) }
        : g));

      return { prevMemberships, prevGroups };
    },

    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      qc.setQueryData(membershipKey, ctx.prevMemberships);
      qc.setQueryData(['groups'], ctx.prevGroups);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: membershipKey });
    },
  });

  return { groups, isLoading, createGroup, isCreating, joinedGroupIds, toggleMembership };
};
