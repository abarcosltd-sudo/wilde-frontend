import React from 'react';
import { IonIcon } from '@ionic/react';
import { flame } from 'ionicons/icons';

interface StreakBadgeProps { count: number; }

// Stays orange rather than moving to the gold accent: the flame is what the
// badge means, and gold is used for chrome, not for status.
const StreakBadge: React.FC<StreakBadgeProps> = ({ count }) => (
  <div className="flex items-center gap-1 rounded-full px-2 py-0.5
    bg-orange-50 border border-orange-200
    dark:bg-orange-950/40 dark:border-orange-800">
    <IonIcon icon={flame} aria-hidden="true"
      className="text-orange-600 dark:text-orange-400 text-sm" />
    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{count} day streak</span>
  </div>
);

export default StreakBadge;
