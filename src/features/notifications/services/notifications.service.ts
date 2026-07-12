import api from '@/services/api.service';

export const markNotificationRead = (id: string) =>
  api.patch(`/notifications/${id}/read`, {});
