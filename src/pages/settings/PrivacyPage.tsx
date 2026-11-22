import React from 'react';
import { PAGE_CLASS } from '@/components/layout/Page';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  chevronBackOutline, globeOutline, peopleOutline, lockClosedOutline,
  shieldOutline, cloudOutline, alertCircleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import IconButton from '@/components/ui/IconButton';
import { ROUTES } from '@/constants';

/**
 * A factual account of what this app stores and who can see it, written from
 * `firestore.rules`, `storage.rules` and the code that actually runs. Every line
 * below should stay checkable against those files: if a rule changes, this page
 * changes with it.
 *
 * It is deliberately not a legal privacy policy or terms of service — those have
 * to be written and reviewed by the operator — and it says so on the page.
 */
const PUBLIC_ITEMS = [
  'Your display name, username, photo, bio and creative roles',
  'Your follower and following counts, and who follows whom',
  'Any work you have published, including its title, cover and text',
  'Reviews other creatives have left on your profile',
  'Jobs, community posts, comments and groups you create',
];

const SIGNED_IN_ITEMS = [
  'Which works you have liked',
  'Which groups you have joined',
  'Which jobs you have applied to',
];

const PRIVATE_ITEMS = [
  'Your notifications and your writing streak',
  'Your writing reminders and your AI prompt history',
  'Your orders: visible to you and to the other side of the sale',
  'Hire requests: visible to you and to the person you contacted',
];

const STAFF_ITEMS = [
  'WILDE staff with admin access can see your orders, payments, notifications, ' +
    'streak, reminders and AI prompt history, and can hide content or suspend an account that breaks the rules',
];

const SHARED_ITEMS = [
  'Google (Firebase) hosts sign-in, the database and uploaded images',
  'Paystack or Flutterwave receive your email address and the amount when you pay ' +
    '(Flutterwave also receives your name). They handle your card details; WILDE never sees them',
  'OpenAI receives the text of any AI prompt you generate',
];

const Section: React.FC<{
  icon: string; title: string; items: string[]; note?: string;
}> = ({ icon, title, items, note }) => (
  <section className="mb-6">
    <h2 className="flex items-center gap-2 text-[17px] font-semibold mb-2">
      <IonIcon icon={icon} aria-hidden="true" />
      {title}
    </h2>
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map(item => (
        <li key={item} className="text-[15px] leading-snug text-wilde-muted">{item}</li>
      ))}
    </ul>
    {note && <p className="text-[15px] leading-snug text-wilde-muted mt-2">{note}</p>}
  </section>
);

const PrivacyPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <div className={PAGE_CLASS}>
          <div className="mx-auto w-full max-w-xl">
            <div className="flex items-center gap-2 mb-4 -ml-2">
              <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
              <h1 className="text-[28px] font-bold tracking-tight leading-none">Privacy</h1>
            </div>

            <p className="text-[15px] leading-snug text-wilde-muted mb-6">
              What WILDE stores about you, and who can see it. This describes how the app works
              today. It is not a formal privacy policy or terms of service.
            </p>

            {/* Said first, because it changes what the lists below mean for an
                author: drafts and paid text look private in the app but are not
                yet locked down where the data is stored. */}
            <section className="border border-amber-300 dark:border-amber-800 bg-amber-50
              dark:bg-amber-950/40 rounded-2xl p-4 mb-6">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold mb-1.5">
                <IonIcon icon={alertCircleOutline} aria-hidden="true"
                  className="text-amber-600 dark:text-amber-400" />
                Drafts and paid text are not locked down yet
              </h2>
              <p className="text-[15px] leading-snug text-wilde-muted">
                Other people do not see your drafts in the app, and readers only see part of a paid
                work until they buy it. But neither is protected at the level of the database yet, so
                a technically skilled person could read them. Do not keep anything in a draft that you
                would not be comfortable publishing. We plan to fix this.
              </p>
            </section>

            <Section icon={globeOutline} title="Visible to everyone" items={PUBLIC_ITEMS} />
            <Section icon={peopleOutline} title="Visible to other signed-in users" items={SIGNED_IN_ITEMS} />
            <Section icon={lockClosedOutline} title="Visible only to you and those involved" items={PRIVATE_ITEMS} />
            <Section icon={shieldOutline} title="Visible to WILDE staff" items={STAFF_ITEMS} />
            <Section icon={cloudOutline} title="Shared with services we use" items={SHARED_ITEMS} />

            <section className="mb-6">
              <h2 className="text-[17px] font-semibold mb-2">Your email address</h2>
              <p className="text-[15px] leading-snug text-wilde-muted">
                Your email stays with your sign-in account. It is not on your public profile, and the
                Hire button does not share it: it records your request and notifies the person with
                your name and what it is about.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-[17px] font-semibold mb-2">Deleting your account or getting your data</h2>
              <p className="text-[15px] leading-snug text-wilde-muted">
                You cannot do either from inside the app yet.{' '}
                <button onClick={() => history.push(ROUTES.HELP)}
                  className="font-semibold text-brand underline underline-offset-2">
                  Contact support
                </button>{' '}
                to ask.
              </p>
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;
