import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { formatTimeAgo } from '@/utils';

const NotificationsPage: React.FC = () => {
  const { notifications } = useNotifications();

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <h1 className="font-bold text-lg mb-4">Notifications</h1>
          {notifications.map(n => (
            <div key={n.id} className="flex items-start gap-3 py-3 border-b border-wilde-border">
              <span className="text-xl">{n.icon}</span>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
              </div>
              <span className="text-xs text-wilde-muted">{formatTimeAgo(n.createdAt)}</span>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-wilde-muted text-sm mt-12">No notifications yet</p>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
