import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryDocuments, createDocument, Collections, where, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUiStore } from '@/store/slices/uiStore';
import { Job } from '@/types';

interface JobApplication { id: string; jobId: string; applicantId: string; }

export const useJobs = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);
  const appliedKey = ['job-applications', user?.uid] as const;

  const { data: jobs = [], refetch: refetchJobs, isPending: isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => queryDocuments<Job>(Collections.JOBS, [orderBy('createdAt', 'desc'), limit(30)]),
  });

  const { data: appliedJobIds = new Set<string>() } = useQuery({
    queryKey: appliedKey,
    queryFn: async () => {
      const apps = await queryDocuments<JobApplication>(
        Collections.JOB_APPLICATIONS, [where('applicantId', '==', user!.uid)]);
      return new Set(apps.map(a => a.jobId));
    },
    enabled: !!user,
  });

  const { mutate: apply, isPending: isApplying } = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) return;
      await createDocument(Collections.JOB_APPLICATIONS, { jobId, applicantId: user.uid });
    },

    // The button flips to "Applied" immediately — waiting on a round trip for a
    // one-way action just makes the tap feel unresponsive.
    onMutate: async (jobId: string) => {
      await qc.cancelQueries({ queryKey: appliedKey });
      const prev = qc.getQueryData<Set<string>>(appliedKey);
      qc.setQueryData<Set<string>>(appliedKey, old => new Set(old ?? []).add(jobId));
      return { prev };
    },

    onError: (_err, _jobId, ctx) => {
      if (ctx) qc.setQueryData(appliedKey, ctx.prev);
      showToast("Couldn't send your application. Please try again.", 'danger');
    },

    onSuccess: () => showToast('Application sent', 'success'),
    onSettled: () => qc.invalidateQueries({ queryKey: appliedKey }),
  });

  return { jobs, apply, isApplying, appliedJobIds, refetchJobs, isLoading };
};
