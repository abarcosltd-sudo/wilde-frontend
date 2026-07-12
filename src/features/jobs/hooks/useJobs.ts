import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { Job } from '@/types';

export const useJobs = () => {
  const [isApplying, setIsApplying] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => queryDocuments<Job>(Collections.JOBS, [orderBy('createdAt', 'desc'), limit(30)]),
  });

  const apply = async (jobId: string) => {
    setIsApplying(true);
    // TODO: call /api/jobs/:id/apply
    setIsApplying(false);
  };

  return { jobs, apply, isApplying };
};
