import api from '@/services/api.service';

export const postJob = (data: {
  title: string;
  description: string;
  neededRole: string;
  budget: number;
  currency: 'NGN' | 'USD';
}) => api.post('/jobs', data);

export const applyForJob = (jobId: string, coverLetter: string) =>
  api.post(`/jobs/${jobId}/apply`, { coverLetter });
