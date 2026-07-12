import api from '@/services/api.service';

export const syncUserWithBackend = (displayName: string, username: string, email: string) =>
  api.post('/auth/sync-user', { displayName, username, email });
