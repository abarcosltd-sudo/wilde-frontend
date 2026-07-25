import { useMutation } from '@tanstack/react-query';
import { createDocument, Collections } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { notify } from '@/features/notifications/notify';

/**
 * Sends an approach from one creative to another.
 *
 * The Hire buttons used to be `mailto:` links built from the recipient's email,
 * which only worked because every address was readable by anyone. Email has
 * since been removed from the profile document, so the approach is recorded
 * in-app and surfaced through the existing notification feed instead.
 *
 * There is no messaging thread yet, so this is one-directional: the recipient
 * is told who is interested and what about, and replies out of band.
 */
export const useHireRequest = () => {
  const { user } = useAuthStore();
  const showToast = useUiStore(s => s.showToast);

  const { mutate: sendHireRequest, isPending } = useMutation({
    mutationFn: async (
      { toUserId, subject, message }: { toUserId: string; subject: string; message: string },
    ) => {
      if (!user) throw new Error('Not signed in');
      await createDocument(Collections.HIRE_REQUESTS, {
        fromUserId: user.uid, toUserId, subject, message,
      });
      await notify(toUserId, '💼', `${user.displayName} is interested in "${subject}"`);
    },
    onSuccess: () => showToast('Request sent', 'success'),
    onError: () => showToast("Couldn't send that request. Please try again.", 'danger'),
  });

  return { sendHireRequest, isPending };
};
