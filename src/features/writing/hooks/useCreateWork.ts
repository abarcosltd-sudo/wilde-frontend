import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { createDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { ROUTES } from '@/constants';
import { WorkType } from '@/types';

/**
 * Creates an empty draft and opens it in the Writing Studio.
 *
 * Previously duplicated between `CreateMenuPage` and `CreateMenuModal`, which
 * had drifted apart — the page offered "Upload Artwork" and the modal didn't.
 * The page has since been removed; this is the single definition.
 */
export const useCreateWork = () => {
  const { user } = useAuthStore();
  const history = useHistory();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);

  const { mutate: createWork, isPending } = useMutation({
    mutationFn: async (type: WorkType) => {
      if (!user) throw new Error('Not signed in');
      return createDocument(Collections.WORKS, {
        authorId: user.uid, title: 'Untitled', type,
        // No price: it is set at publish time, and its absence means free.
        status: 'draft', viewCount: 0, likeCount: 0, tags: [],
      });
    },
    onSuccess: id => {
      qc.invalidateQueries({ queryKey: ['creator-works', user?.uid] });
      history.push(ROUTES.WRITING_STUDIO.replace(':workId', id));
    },
    onError: () => showToast("Couldn't start that draft. Please try again.", 'danger'),
  });

  return { createWork, isPending };
};
