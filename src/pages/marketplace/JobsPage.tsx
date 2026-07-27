import React, { useMemo, useState } from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent } from '@ionic/react';
import { swapVerticalOutline, addOutline } from 'ionicons/icons';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import PostJobModal from '@/features/jobs/components/PostJobModal';
import IconButton from '@/components/ui/IconButton';
import { SkeletonScreen, ListRowSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils';

const JobsPage: React.FC = () => {
  const { jobs, apply, isApplying, appliedJobIds, refetchJobs, isLoading } = useJobs();
  const [sortDesc, setSortDesc] = useState(true);
  const [isPostOpen, setPostOpen] = useState(false);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => sortDesc ? b.budget - a.budget : a.budget - b.budget),
    [jobs, sortDesc]
  );

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold tracking-tight">Creative Jobs</h1>
            <div className="flex items-center gap-1">
              <IconButton icon={addOutline} label="Post a job" onClick={() => setPostOpen(true)} />
              <IconButton icon={swapVerticalOutline} onClick={() => setSortDesc(v => !v)}
                label={sortDesc ? 'Budget: highest first' : 'Budget: lowest first'} />
            </div>
          </div>

          {isLoading ? (
            <SkeletonScreen label="jobs"><ListRowSkeleton count={4} thumb={false} /></SkeletonScreen>
          ) : sortedJobs.length === 0 ? (
            <div className="text-center mt-12">
              <p className="text-wilde-muted text-sm">No jobs posted yet</p>
              <p className="text-xs text-wilde-muted mt-1">Use the + button to post the first one.</p>
            </div>
          ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {sortedJobs.map(job => (
              <div key={job.id} className="border border-wilde-border rounded-xl p-4">
                <p className="font-bold text-sm">{job.title}</p>
                <p className="text-xs text-wilde-muted mt-0.5">Need: {job.neededRole}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold">
                    Budget {formatCurrency(job.budget, job.currency)}
                  </span>
                  <button onClick={() => apply(job.id)}
                    disabled={isApplying || appliedJobIds.has(job.id)}
                    className="text-xs bg-wilde-black text-wilde-on-ink rounded-md px-3 py-1.5
                      transition-opacity disabled:opacity-50">
                    {appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </IonContent>
      <PostJobModal isOpen={isPostOpen} onClose={() => setPostOpen(false)} onPosted={refetchJobs} />
    </IonPage>
  );
};

export default JobsPage;
