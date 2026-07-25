import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { chevronBackOutline, chevronDownOutline, mailOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import IconButton from '@/components/ui/IconButton';

const SUPPORT_EMAIL = 'abarcosltd@gmail.com';

/**
 * Answers describe how the app actually behaves today — including the parts
 * that aren't built yet — rather than promising features that don't exist.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I publish a work?',
    a: 'Open it in the Writing Studio and tap Publish. Drafts stay private to you '
     + 'until then. Once published, it appears on Home and in Explore, and everyone '
     + 'who follows you gets a notification.',
  },
  {
    q: 'How do chapters work?',
    a: 'Long Works are split into chapters — use the + button above the editor to add '
     + 'one, and tap a chapter to switch between them. Every other work type is a '
     + 'single document. Readers see the chapters stitched together in order.',
  },
  {
    q: 'How do I charge for a work?',
    a: 'Set a price on the work and publish it. Readers see a free preview of roughly '
     + 'half the text, then a prompt to unlock the rest.',
  },
  {
    q: 'When do I get paid?',
    a: 'Payouts are not live yet. Purchases are currently recorded against your account '
     + 'and shown in your Sales total, but no payment provider is connected, so no money '
     + 'moves. We will contact you before that changes.',
  },
  {
    q: 'Who can leave a review on my profile?',
    a: 'Only someone who has completed a purchase from you, and only once. That is why '
     + 'the review form appears for some visitors and not others.',
  },
  {
    q: 'How do collaborations work?',
    a: 'In the Writing Studio, tap Collaborate to invite other creatives. They appear in '
     + 'the collaborator row, and tapping it opens a shared view of the work with comments.',
  },
  {
    q: 'How do I export my work?',
    a: 'Tap the download icon in the Writing Studio. PDF opens your print dialog — choose '
     + '"Save as PDF". Word and plain text download directly.',
  },
  {
    q: 'What is a streak?',
    a: 'The number of consecutive days you have saved work. Saving twice in one day counts '
     + 'once; missing a day resets it to 1.',
  },
];

const HelpPage: React.FC = () => {
  const history = useHistory();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <IonPage>
      <IonContent>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 -ml-2">
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <h1 className="font-bold text-lg">Help &amp; Support</h1>
          </div>

          <div className="border border-wilde-border rounded-xl overflow-hidden mb-6">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={faq.q} className={i > 0 ? 'border-t border-wilde-border' : ''}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex items-center justify-between gap-3 w-full text-left px-3 py-3
                      transition-colors active:bg-gray-50">
                    <span className="text-sm font-medium">{faq.q}</span>
                    <IonIcon icon={chevronDownOutline} aria-hidden="true"
                      className={'text-gray-500 shrink-0 transition-transform ' +
                        (isOpen ? 'rotate-180' : '')} />
                  </button>
                  {isOpen && (
                    <p className="px-3 pb-3 text-sm leading-relaxed text-wilde-muted animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="text-sm font-bold mb-2">Still stuck?</h2>
          <p className="text-sm text-wilde-muted mb-3">
            Send us the details and we'll get back to you.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('WILDE support request')}`}
            className="flex items-center justify-center gap-2 w-full border border-wilde-black
              rounded-lg py-2.5 text-sm font-medium transition-colors active:bg-gray-50">
            <IonIcon icon={mailOutline} aria-hidden="true" />
            Contact support
          </a>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HelpPage;
