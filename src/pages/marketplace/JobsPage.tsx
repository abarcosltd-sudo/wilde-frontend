import React, { useMemo, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { swapVerticalOutline, addOutline } from 'ionicons/icons';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import PostJobModal from '@/features/jobs/components/PostJobModal';
import { formatCurrency } from '@/utils';

const JobsPage: React.FC = () => {
  const { jobs, apply, isApplying, appliedJobIds, refetchJobs } = useJobs();
  const [sortDesc, setSortDesc] = useState(true);
  const [isPostOpen, setPostOpen] = useState(false);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => sortDesc ? b.budget - a.budget : a.budget - b.budget),
    [jobs, sortDesc]
  );

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-lg">Creative Jobs</h1>
            <div className="flex items-center gap-1">
              <button onClick={() => setPostOpen(true)}
                aria-label="Post a job"
                className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
                <IonIcon icon={addOutline} aria-hidden="true" />
              </button>
              <button onClick={() => setSortDesc(v => !v)}
                aria-label={sortDesc ? 'Sorted by budget, highest first. Tap to sort lowest first.' : 'Sorted by budget, lowest first. Tap to sort highest first.'}
                className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
                <IonIcon icon={swapVerticalOutline} aria-hidden="true" />
              </button>
            </div>
          </div>
          {sortedJobs.length === 0 && (
            <p className="text-center text-wilde-muted text-sm mt-12">No jobs posted yet</p>
          )}
          <div className="flex flex-col gap-3">
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
                    className="text-xs bg-wilde-black text-white rounded-md px-3 py-1.5 disabled:opacity-50">
                    {appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
      <PostJobModal isOpen={isPostOpen} onClose={() => setPostOpen(false)} onPosted={refetchJobs} />
    </IonPage>
  );
};

export default JobsPage;
