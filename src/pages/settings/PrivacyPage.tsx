import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, globeOutline, lockClosedOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import IconButton from '@/components/ui/IconButton';

/**
 * A factual account of what this app stores and who can see it, derived from
 * the collections and screens that actually exist. It is deliberately not a
 * legal privacy policy — that has to be written and reviewed by the operator.
 */
const PUBLIC_ITEMS = [
  'Your display name, username, photo, bio and creative roles',
  'Your follower and following counts',
  'Any work you have published, including its title, cover and text',
  'Reviews other creatives have left on your profile',
  'Jobs and community posts you create',
];

const PRIVATE_ITEMS = [
  'Drafts — visible only to you until you publish them',
  'Your purchases, and the works you have unlocked',
  'Your notifications',
  'Your writing streak',
];

const Section: React.FC<{
  icon: string; title: string; items: string[]; tone?: string;
}> = ({ icon, title, items, tone = 'text-wilde-black' }) => (
  <section className="mb-6">
    <h2 className="flex items-center gap-2 text-sm font-bold mb-2">
      <IonIcon icon={icon} aria-hidden="true" className={tone} />
      {title}
    </h2>
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map(item => (
        <li key={item} className="text-sm leading-relaxed text-wilde-muted">{item}</li>
      ))}
    </ul>
  </section>
);

const PrivacyPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 -ml-2">
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <h1 className="font-bold text-lg">Privacy</h1>
          </div>

          <p className="text-sm leading-relaxed text-wilde-muted mb-6">
            What WILDE stores about you, and who can see it.
          </p>

          <Section icon={globeOutline} title="Visible to everyone" items={PUBLIC_ITEMS} />
          <Section icon={lockClosedOutline} title="Visible only to you" items={PRIVATE_ITEMS} />

          <section className="border border-amber-300 bg-amber-50 rounded-xl p-3">
            <h2 className="flex items-center gap-2 text-sm font-bold mb-1.5">
              <IonIcon icon={alertCircleOutline} aria-hidden="true" className="text-amber-600" />
              Your email address
            </h2>
            <p className="text-sm leading-relaxed text-wilde-muted">
              The "Hire" button on your profile and on your marketplace listings opens the
              visitor's mail app addressed to you. That means any signed-in user can see the
              email address on your account. There is no setting to turn this off yet.
            </p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;
