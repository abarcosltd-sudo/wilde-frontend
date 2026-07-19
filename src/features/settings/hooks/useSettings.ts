import { useState } from 'react';
import { updateDocument } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Collections } from '@/firebase/firestore.helpers';

export const useSettings = () => {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = async (data: Partial<{ displayName: string; bio: string; photoURL: string }>) => {
    if (!user) return;
    setIsSaving(true);
    await updateDocument(Collections.USERS, user.uid, data);
    setUser({ ...user, ...data });
    setIsSaving(false);
  };

  return { user, updateProfile, isSaving };
};
