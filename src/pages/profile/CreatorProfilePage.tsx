import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, star, starOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useCreatorProfile } from '@/features/profile/hooks/useCreatorProfile';
import { useReviews } from '@/features/profile/hooks/useReviews';
import { useAuthStore } from '@/store/slices/authStore';
import { useUser } from '@/hooks/useUser';
import Avatar from '@/components/ui/Avatar';
import WorkCard from '@/components/ui/WorkCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import {
  SkeletonScreen, ProfileHeaderSkeleton, WorkGridSkeleton,
} from '@/components/ui/Skeleton';
import { formatCount } from '@/utils';

const TABS = ['Portfolio', 'About', 'Reviews'];

const StarRow: React.FC<{ rating: number; onChange?: (n: number) => void }> = ({ rating, onChange }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
        className={onChange ? '' : 'pointer-events-none'}>
        <IonIcon icon={n <= Math.round(rating) ? star : starOutline} aria-hidden="true"
          className="text-amber-500 text-base" />
      </button>
    ))}
  </div>
);

const ReviewerName: React.FC<{ reviewerId: string }> = ({ reviewerId }) => {
  const { user: reviewer } = useUser(reviewerId);
  return <>{reviewer?.displayName ?? '…'}</>;
};

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, isSubmitting }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // The review is rendered optimistically, so the form can clear straight away
  // rather than holding the user's text hostage until the write lands.
  const handleSubmit = () => {
    onSubmit(rating, comment.trim());
    setComment('');
  };

  return (
    <div className="border border-wilde-border rounded-lg p-3 mb-4 flex flex-col gap-2">
      <p className="text-xs font-semibold">Leave a review</p>
      <StarRow rating={rating} onChange={setRating} />
      <textarea value={comment} onChange={e => setComment(e.target.value)}
        placeholder="How was working with them?"
        rows={2}
        className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none" />
      <Button size="sm" isLoading={isSubmitting} onClick={handleSubmit}>Submit Review</Button>
    </div>
  );
};

const CreatorProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('Portfolio');
  const {
    creator, works, follow, isFollowing, isFollowPending, isLoading, isWorksLoading,
  } = useCreatorProfile(uid);
  const { reviews, averageRating, canReview, submitReview, isSubmitting } = useReviews(uid);
  const isOwnProfile = user?.uid === uid;

  const backButton = (
    <div className="-ml-2 mb-4">
      <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
    </div>
  );

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="p-4">
            {backButton}
            <SkeletonScreen label="profile">
              <ProfileHeaderSkeleton />
              <div className="mt-6"><WorkGridSkeleton count={4} /></div>
            </SkeletonScreen>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!creator) {
    return (
      <IonPage>
        <IonContent>
          <div className="p-4">
            {backButton}
            <p className="text-sm text-wilde-muted text-center py-12">
              This creator profile could not be found.
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        <div className="p-4 animate-fade-in">
          {backButton}
          <div className="flex flex-col items-center gap-2 mb-4">
            <Avatar src={creator.photoURL} name={creator.displayName} size="lg" />
            <h2 className="font-bold text-base">{creator.displayName}</h2>
            <p className="text-xs text-wilde-muted">{creator.roles.join(' · ')}</p>
            <div className="flex gap-4 text-xs items-center">
              <span>Followers <strong>{formatCount(creator.followersCount)}</strong></span>
              <span>Following <strong>{formatCount(creator.followingCount)}</strong></span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1">
                  <IonIcon icon={star} aria-hidden="true" className="text-amber-500" />
                  <strong>{averageRating.toFixed(1)}</strong> ({reviews.length})
                </span>
              )}
            </div>
          </div>
          {!isOwnProfile && (
            <div className="flex gap-2 mb-4">
              {/* Label and follower count flip on tap via an optimistic update,
                  so this never sits waiting on the write to land. */}
              <button onClick={() => follow()} disabled={isFollowPending}
                aria-pressed={isFollowing}
                className={'flex-1 rounded-lg py-2 text-sm font-medium transition-colors ' +
                  (isFollowing ? 'border border-wilde-border' : 'bg-wilde-black text-white')}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <a href={`mailto:${creator.email}?subject=${encodeURIComponent(`Work opportunity via WILDE`)}`}
                className="flex-1 border border-wilde-border rounded-lg py-2 text-sm font-medium text-center">
                Hire
              </a>
            </div>
          )}
          <div className="flex border-b border-wilde-border mb-4">
            {TABS.map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={'flex-1 text-center py-2 text-xs ' +
                  (tab === t ? 'font-bold border-b-2 border-wilde-black' : 'text-wilde-muted')}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'Portfolio' && (
            isWorksLoading ? (
              <SkeletonScreen label="portfolio"><WorkGridSkeleton count={4} /></SkeletonScreen>
            ) : works.length === 0 ? (
              <p className="text-sm text-wilde-muted text-center py-12">
                {creator.displayName} hasn't published any works yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {works.map(w => <WorkCard key={w.id} work={w} />)}
              </div>
            )
          )}
          {tab === 'About' && (
            creator.bio
              ? <p className="text-sm leading-relaxed text-gray-600">{creator.bio}</p>
              : <p className="text-sm text-wilde-muted text-center py-12">No bio yet.</p>
          )}
          {tab === 'Reviews' && (
            <div>
              {canReview && <ReviewForm onSubmit={submitReview} isSubmitting={isSubmitting} />}
              {reviews.map(r => (
                <div key={r.id} className="border-b border-wilde-border py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold"><ReviewerName reviewerId={r.reviewerId} /></p>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-wilde-muted text-center mt-8">No reviews yet</p>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreatorProfilePage;
