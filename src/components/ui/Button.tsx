import React from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?:  () => void;
  variant?:  'filled' | 'outline' | 'ghost';
  size?:     'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?:  boolean;
  expand?:    'block' | 'full';
  type?:      'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children, onClick, variant = 'filled', size = 'md',
  isLoading, disabled, expand, type = 'button', className,
}) => {
  const fill = variant === 'filled' ? 'solid' : variant === 'outline' ? 'outline' : 'clear';
  return (
    <IonButton
      fill={fill}
      expand={expand}
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
      className={className}
      size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'default'}
    >
      {isLoading ? <IonSpinner name="crescent" /> : children}
    </IonButton>
  );
};

export default Button;
