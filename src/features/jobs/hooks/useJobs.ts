import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments, createDocument, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { Job } from '@/types';
import Swal from '@/utils/swal';

interface JobApplication { id: string; jobId: string; applicantId: string; }

export const useJobs = () => {
  const { user } = useAuthStore();
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => queryDocuments<Job>(Collections.JOBS, [orderBy('createdAt', 'desc'), limit(30)]),
  });

  useEffect(() => {
    if (!user) return;
    queryDocuments<JobApplication>(Collections.JOB_APPLICATIONS, [where('applicantId', '==', user.uid)])
      .then(apps => setAppliedJobIds(new Set(apps.map(a => a.jobId))));
  }, [user?.uid]);

  const apply = async (jobId: string) => {
    if (!user || appliedJobIds.has(jobId)) return;
    setIsApplying(true);
    try {
      await createDocument(Collections.JOB_APPLICATIONS, { jobId, applicantId: user.uid });
      setAppliedJobIds(prev => new Set(prev).add(jobId));
      await Swal.fire({
        icon: 'success', title: 'Application sent!', timer: 1500, showConfirmButton: false,
      });
    } finally {
      setIsApplying(false);
    }
  };

  return { jobs, apply, isApplying, appliedJobIds, refetchJobs };
};
