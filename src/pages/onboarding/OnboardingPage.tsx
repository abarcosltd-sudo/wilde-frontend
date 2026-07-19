import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { brushOutline, pencilOutline, ticketOutline, bookOutline, cashOutline, earthOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { updateDocument } from '@/firebase/firestore.helpers';
import { CREATIVE_ROLES, ROUTES } from '@/constants';
import { Collections } from '@/firebase/firestore.helpers';
import { CreativeRole } from '@/types';
import Button from '@/components/ui/Button';

const SLIDES = [
  { headline: 'Create.\nShare.\nDiscover.', icons: [brushOutline, pencilOutline, ticketOutline], sub: 'Join a community of creatives and bring your ideas to life.' },
  { headline: 'Write.\nPublish.\nEarn.', icons: [bookOutline, cashOutline, earthOutline], sub: 'Turn your creativity into a sustainable career.' },
];

const OnboardingPage: React.FC = () => {
  const [slide, setSlide] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<CreativeRole[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const history = useHistory();
  const isIdentityStep = slide === SLIDES.length;

  const toggleRole = (role: CreativeRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    await updateDocument(Collections.USERS, user.uid, { roles: selectedRoles });
    history.replace(ROUTES.HOME);
  };

  if (isIdentityStep) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="max-w-sm mx-auto pt-12 flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-center">Who are you?</h2>
            <div className="flex flex-col gap-2">
              {CREATIVE_ROLES.map(r => (
                <button key={r.value}
                  onClick={() => toggleRole(r.value as CreativeRole)}
                  className={'flex items-center gap-3 border rounded-lg px-4 py-3 text-sm font-medium transition-colors ' +
                    (selectedRoles.includes(r.value as CreativeRole)
                      ? 'bg-wilde-black text-white border-wilde-black'
                      : 'border-wilde-border')}>
                  <IonIcon icon={r.icon} aria-hidden="true" /><span>{r.label}</span>
                </button>
              ))}
            </div>
            <Button expand="block" isLoading={loading} onClick={handleFinish}>
              Get Started
            </Button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const s = SLIDES[slide];
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="max-w-sm mx-auto pt-12 flex flex-col gap-6 min-h-full">
          <h2 className="text-3xl font-black text-center whitespace-pre-line">{s.headline}</h2>
          <div className="grid grid-cols-3 gap-3">
            {s.icons.map((icon, i) => (
              <div key={i} className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center text-3xl">
                <IonIcon icon={icon} aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-wilde-muted">{s.sub}</p>
          <div className="flex-1" />
          <div className="flex items-center justify-between">
            <button className="text-sm text-wilde-muted min-h-11 px-2 -ml-2" onClick={() => setSlide(SLIDES.length)}>Skip</button>
            <div className="flex gap-1">
              {[...SLIDES, null].map((_, i) => (
                <div key={i} className={'w-2 h-2 rounded-full ' + (i === slide ? 'bg-wilde-black' : 'bg-gray-300')} />
              ))}
            </div>
            <Button onClick={() => setSlide(s => s + 1)}>Next</Button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OnboardingPage;
