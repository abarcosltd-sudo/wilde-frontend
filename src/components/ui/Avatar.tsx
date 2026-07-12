import React from 'react';
import { IonAvatar, IonImg } from '@ionic/react';

interface AvatarProps {
  src?:      string;
  name?:     string;
  size?:     'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: '32px', md: '44px', lg: '64px' };

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const dim = sizeMap[size];
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <IonAvatar style={{ width: dim, height: dim }} className={className}>
      {src
        ? <IonImg src={src} alt={name ?? 'Profile picture'} />
        : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600 font-semibold text-sm">
            {initials}
          </div>
        )
      }
    </IonAvatar>
  );
};

export default Avatar;
