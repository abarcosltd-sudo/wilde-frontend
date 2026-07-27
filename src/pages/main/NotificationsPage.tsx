import React from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent } from '@ionic/react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { SkeletonScreen, NotificationSkeleton } from '@/components/ui/Skeleton';
import { formatTimeAgo } from '@/utils';

const NotificationsPage: React.FC = () => {
  const {
    notifications, unreadCount, markAsRead, markAllAsRead, isMarkingAll, isLoading,
  } = useNotifications();

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()} disabled={isMarkingAll}
                className="text-xs text-wilde-muted underline disabled:opacity-40">
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <SkeletonScreen label="notifications"><NotificationSkeleton /></SkeletonScreen>
          ) : notifications.length === 0 ? (
            <div className="text-center mt-12">
              <p className="text-sm text-wilde-muted">No notifications yet</p>
              <p className="text-xs text-wilde-muted mt-1">
                Follows, sales and comments on your work will show up here.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {notifications.map(n => (
                <button key={n.id} onClick={() => !n.read && markAsRead(n.id)}
                  className={'flex items-start gap-3 py-3 border-b border-wilde-border w-full text-left ' +
                    'transition-colors ' + (n.read ? '' : 'bg-wilde-subtle')}>
                  <span className="text-xl" aria-hidden="true">{n.icon}</span>
                  <div className="flex-1">
                    <p className={'text-sm ' + (n.read ? '' : 'font-semibold')}>{n.message}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-wilde-black mt-1.5 shrink-0" aria-label="Unread" />
                  )}
                  <span className="text-xs text-wilde-muted whitespace-nowrap">
                    {formatTimeAgo(n.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
