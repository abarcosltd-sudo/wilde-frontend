import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { deleteDraft } from '@/features/writing/services/deleteDraft';
import { Work } from '@/types';

/**
 * Deletes one of the signed-in user's drafts.
 *
 * The draft leaves the list immediately and comes back if the delete fails —
 * the same optimistic pattern as the other small writes in the app. The
 * confirmation step belongs to the caller, so the hook stays a plain action.
 */
export const useDeleteDraft = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const myWorksKey = ['my-works', user?.uid] as const;

  const { mutate: removeDraft, isPending, variables } = useMutation({
    mutationFn: (work: Work) => deleteDraft(work),
    onMutate: async work => {
      await qc.cancelQueries({ queryKey: myWorksKey });
      const previous = qc.getQueryData<Work[]>(myWorksKey);
      qc.setQueryData<Work[]>(myWorksKey, old => old?.filter(w => w.id !== work.id));
      return { previous };
    },
    onError: (_err, _work, ctx) => {
      if (ctx?.previous) qc.setQueryData(myWorksKey, ctx.previous);
      showToast("Couldn't delete that draft. Please try again.", 'danger');
    },
    onSuccess: (_data, work) => {
      // Drop what the Studio and reader had cached for it, so reopening the old
      // link finds nothing rather than a ghost.
      qc.removeQueries({ queryKey: ['work', work.id] });
      qc.removeQueries({ queryKey: ['chapters', work.id] });
      showToast('Draft deleted', 'success');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: myWorksKey });
      qc.invalidateQueries({ queryKey: ['creator-works', user?.uid] });
    },
  });

  return { removeDraft, isDeleting: isPending, deletingId: variables?.id };
};
