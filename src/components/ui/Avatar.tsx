import React from 'react';
import { IonAvatar, IonImg } from '@ionic/react';

interface AvatarProps {
  src?:      string;
  name?:     string;
  size?:     'sm' | 'md' | 'lg' | 'xl';
  /** A brand ring, used on the owner's own profile. */
  ring?:     boolean;
  className?: string;
}

const sizeMap = { sm: '32px', md: '44px', lg: '64px', xl: '88px' };
const textMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-xl', xl: 'text-3xl' };

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', ring, className = '' }) => {
  const dim = sizeMap[size];
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <IonAvatar style={{ width: dim, height: dim }}
      className={`${ring ? 'ring-2 ring-brand ring-offset-2 ring-offset-wilde-surface' : ''} ${className}`}>
      {src
        ? <IonImg src={src} alt={name ?? 'Profile picture'} />
        : (
          <div className={`flex items-center justify-center w-full h-full rounded-full bg-brand-soft text-brand
            font-semibold ${textMap[size]}`}>
            {initials}
          </div>
        )
      }
    </IonAvatar>
  );
};

export default Avatar;
