import React from 'react';
import { IonIcon } from '@ionic/react';
import { flame } from 'ionicons/icons';

interface StreakBadgeProps { count: number; }

const StreakBadge: React.FC<StreakBadgeProps> = ({ count }) => (
  <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
    <IonIcon icon={flame} aria-hidden="true" className="text-orange-600 text-sm" />
    <span className="text-xs font-bold text-orange-600">{count} day streak</span>
  </div>
);

export default StreakBadge;
