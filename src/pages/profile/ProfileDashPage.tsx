import React, { useState } from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { menuOutline, lockClosedOutline, statsChartOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { useProfileDash } from '@/features/profile/hooks/useProfileDash';
import { useMyWorks } from '@/features/profile/hooks/useMyWorks';
import { useStreaks } from '@/features/streaks/hooks/useStreaks';
import Avatar from '@/components/ui/Avatar';
import StreakBadge from '@/components/ui/StreakBadge';
import IconButton from '@/components/ui/IconButton';
import WorkGrid from '@/components/ui/WorkGrid';
import { Skeleton, SkeletonScreen, WorkGridSkeleton } from '@/components/ui/Skeleton';
import EditProfileModal from '@/features/profile/components/EditProfileModal';
import { formatCount, formatCurrency } from '@/utils';
import { ROUTES } from '@/constants';
import { CreativeRole } from '@/types';

type Tab = 'works' | 'drafts' | 'studio';

/** A role is a creator type, so it borrows the matching format's hue. */
const ROLE_STYLE: Record<CreativeRole, string> = {
  writer:       'bg-fmt-book-bg text-fmt-book',
  screenwriter: 'bg-fmt-stage-bg text-fmt-stage',
  playwright:   'bg-fmt-stage-bg text-fmt-stage',
  painter:      'bg-fmt-artwork-bg text-fmt-artwork',
  designer:     'bg-fmt-artwork-bg text-fmt-artwork',
  musician:     'bg-fmt-poem-bg text-fmt-poem',
  other:        'bg-wilde-subtle text-wilde-muted',
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ProfileDashPage: React.FC = () => {
  const { user } = useAuthStore();
  const { analytics, isLoading: isAnalyticsLoading } = useProfileDash();
  const { published, drafts, isLoading: isWorksLoading } = useMyWorks();
  const { streak } = useStreaks();
  const history = useHistory();
  const { search } = useLocation();
  const [isEditOpen, setEditOpen] = useState(false);
  const requested = new URLSearchParams(search).get('tab');
  const [tab, setTab] = useState<Tab>(
    requested === 'drafts' || requested === 'studio' ? requested : 'works');

  if (!user) return null;

  const tabs: { id: Tab; label: string; private?: boolean }[] = [
    { id: 'works',  label: 'Works' },
    { id: 'drafts', label: `Drafts${drafts.length ? ` · ${drafts.length}` : ''}`, private: true },
    { id: 'studio', label: 'Studio', private: true },
  ];

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="mx-auto w-full max-w-xl">
            <header className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold tracking-tight m-0">{user.username.replace(/^@/, '')}</h1>
              <div className="flex items-center gap-2">
                {!!streak?.currentStreak && <StreakBadge count={streak.currentStreak} />}
                <IconButton icon={menuOutline} label="Settings"
                  onClick={() => history.push(ROUTES.SETTINGS)} />
              </div>
            </header>

            <div className="flex items-center gap-5">
              <Avatar src={user.photoURL} name={user.displayName} size="xl" ring />
              {/* dt before dd keeps the label first for screen readers; the
                  column is reversed so the number reads above it. */}
              <dl className="grid grid-cols-3 flex-1 text-center gap-1 m-0">
                <div className="flex flex-col-reverse">
                  <dt className="text-[13px] text-wilde-muted">Works</dt>
                  <dd className="text-xl font-bold m-0">{user.worksCount}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt className="text-[13px] text-wilde-muted">Followers</dt>
                  <dd className="text-xl font-bold m-0">{formatCount(user.followersCount)}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt className="text-[13px] text-wilde-muted">Following</dt>
                  <dd className="text-xl font-bold m-0">{formatCount(user.followingCount)}</dd>
                </div>
              </dl>
            </div>

            <h2 className="text-2xl font-bold tracking-tight mt-4">{user.displayName}</h2>
            {user.roles.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-2 list-none p-0">
                {user.roles.map(r => (
                  <li key={r} className={`rounded-full px-3 py-1 text-[13px] font-medium ${ROLE_STYLE[r] ?? ROLE_STYLE.other}`}>
                    {capitalise(r)}
                  </li>
                ))}
              </ul>
            )}
            {user.bio && <p className="text-[15px] leading-snug mt-3 text-pretty">{user.bio}</p>}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => setEditOpen(true)}
                className="rounded-2xl bg-wilde-subtle py-3 text-[15px] font-semibold active:opacity-70">
                Edit profile
              </button>
              <button onClick={() => setTab('studio')}
                className="rounded-2xl bg-wilde-subtle py-3 text-[15px] font-semibold flex items-center
                  justify-center gap-2 active:opacity-70">
                <IonIcon icon={statsChartOutline} aria-hidden="true" />
                Creator studio
              </button>
            </div>

            <div role="tablist" aria-label="Profile sections"
              className="flex border-b border-wilde-border mt-5">
              {tabs.map(t => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                  className={'flex-1 py-3 text-[15px] font-medium border-b-2 -mb-px flex items-center ' +
                    'justify-center gap-1.5 transition-colors ' +
                    (tab === t.id ? 'border-wilde-black text-wilde-black' : 'border-transparent text-wilde-muted')}>
                  {t.private && <IonIcon icon={lockClosedOutline} aria-label="Only you can see this" className="text-sm" />}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4" role="tabpanel">
              {(tab === 'works' || tab === 'drafts') && (
                isWorksLoading ? (
                  <SkeletonScreen label="your works"><WorkGridSkeleton count={4} /></SkeletonScreen>
                ) : (tab === 'works' ? published : drafts).length === 0 ? (
                  <div className="text-center py-14">
                    <p className="text-[15px] font-medium">
                      {tab === 'works' ? 'Nothing published yet' : 'No drafts'}
                    </p>
                    <p className="text-sm text-wilde-muted mt-1 text-pretty">
                      {tab === 'works'
                        ? 'Tap Create to start something. It will show up here once it is live.'
                        : 'Anything you start but have not published will wait here, visible only to you.'}
                    </p>
                  </div>
                ) : (
                  <WorkGrid works={tab === 'works' ? published : drafts} />
                )
              )}

              {tab === 'studio' && (
                <div role="status" aria-busy={isAnalyticsLoading}>
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-[17px] font-semibold">Analytics</h3>
                    <span className="text-[13px] text-wilde-muted">All time</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Views',      value: formatCount(analytics?.views ?? 0), w: 'w-12' },
                      { label: 'Engagement', value: formatCount(analytics?.engagement ?? 0), w: 'w-12' },
                      { label: 'Revenue',    value: formatCurrency(analytics?.revenue ?? 0), w: 'w-20' },
                      { label: 'Sales',      value: formatCurrency(user.totalSales), w: 'w-20' },
                    ].map(s => (
                      <div key={s.label} className="bg-wilde-subtle rounded-2xl p-4">
                        <p className="text-[13px] text-wilde-muted">{s.label}</p>
                        {isAnalyticsLoading
                          ? <Skeleton className={`h-5 ${s.w} mt-1.5`} />
                          : <p className="text-xl font-bold mt-0.5">{s.value}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>
      <EditProfileModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} />
    </IonPage>
  );
};

export default ProfileDashPage;
