import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { formatTimeAgo } from '@/utils';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <h1 className="font-bold text-lg mb-4">Notifications</h1>
          {notifications.map(n => (
            <button key={n.id} onClick={() => !n.read && markAsRead(n.id)}
              className={'flex items-start gap-3 py-3 border-b border-wilde-border w-full text-left ' +
                (n.read ? '' : 'bg-gray-50')}>
              <span className="text-xl">{n.icon}</span>
              <div className="flex-1">
                <p className={'text-sm ' + (n.read ? '' : 'font-semibold')}>{n.message}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-wilde-black mt-1.5 shrink-0" aria-label="Unread" />}
              <span className="text-xs text-wilde-muted">{formatTimeAgo(n.createdAt)}</span>
            </button>
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
