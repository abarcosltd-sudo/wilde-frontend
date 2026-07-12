import api from '@/services/api.service';

export const buyWork = (workId: string, email: string) =>
  api.post('/market/buy', { workId, email });

export const createListing = (data: {
  title: string;
  description: string;
  pricePerProject: number;
  specialties: string[];
}) => api.post('/market/listings', data);
