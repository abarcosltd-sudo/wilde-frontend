import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { useProfileDash } from '@/features/profile/hooks/useProfileDash';
import Avatar from '@/components/ui/Avatar';
import EditProfileModal from '@/features/profile/components/EditProfileModal';
import { formatCount, formatCurrency } from '@/utils';
import { ROUTES } from '@/constants';

const ProfileDashPage: React.FC = () => {
  const { user } = useAuthStore();
  const { analytics } = useProfileDash();
  const history = useHistory();
  const [isEditOpen, setEditOpen] = useState(false);

  if (!user) return null;

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">Your Studio</h2>
            <button onClick={() => history.push(ROUTES.SETTINGS)}
              aria-label="Open settings"
              className="min-w-11 min-h-11 flex items-center justify-center text-lg rounded-full active:bg-gray-100">
              <IonIcon icon={menuOutline} aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={user.photoURL} name={user.displayName} size="lg" />
            <div className="flex-1">
              <p className="font-bold text-sm">{user.displayName}</p>
              <p className="text-xs text-wilde-muted">{user.roles.join(' · ')}</p>
            </div>
            <button onClick={() => setEditOpen(true)}
              className="text-xs border border-wilde-border rounded-md px-3 py-1.5">
              Edit Profile
            </button>
          </div>
          <div className="grid grid-cols-3 text-center gap-2 mb-4">
            <div>
              <p className="font-black text-base">{user.worksCount}</p>
              <p className="text-xs text-wilde-muted">Works</p>
            </div>
            <div>
              <p className="font-black text-base">{formatCount(user.followersCount)}</p>
              <p className="text-xs text-wilde-muted">Followers</p>
            </div>
            <div>
              <p className="font-black text-base">{formatCurrency(user.totalSales)}</p>
              <p className="text-xs text-wilde-muted">Sales</p>
            </div>
          </div>
          <div className="border-t border-wilde-border pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold">Analytics</h3>
              <span className="text-xs text-wilde-muted">This Month ›</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-wilde-muted">Views</p>
                <p className="font-bold">{formatCount(analytics?.views ?? 0)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-wilde-muted">Engagement</p>
                <p className="font-bold">{formatCount(analytics?.engagement ?? 0)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-wilde-muted">Revenue</p>
                <p className="font-bold">{formatCurrency(analytics?.revenue ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
      <EditProfileModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} />
    </IonPage>
  );
};

export default ProfileDashPage;
