import React, { useMemo, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { swapVerticalOutline } from 'ionicons/icons';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import { formatCurrency } from '@/utils';

const JobsPage: React.FC = () => {
  const { jobs, apply, isApplying } = useJobs();
  const [sortDesc, setSortDesc] = useState(true);

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
            <button onClick={() => setSortDesc(v => !v)}
              aria-label={sortDesc ? 'Sorted by budget, highest first. Tap to sort lowest first.' : 'Sorted by budget, lowest first. Tap to sort highest first.'}
              className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
              <IonIcon icon={swapVerticalOutline} aria-hidden="true" />
            </button>
          </div>
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
                    className="text-xs bg-wilde-black text-white rounded-md px-3 py-1.5">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JobsPage;
