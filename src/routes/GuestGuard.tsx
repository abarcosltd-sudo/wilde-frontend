import React from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';

interface GuestGuardProps {
  path: string;
  component: React.ComponentType<RouteComponentProps>;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ component: Component, ...rest }) => {
  const { user } = useAuthStore();
  return (
    <Route
      {...rest}
      render={props =>
        user ? <Redirect to={ROUTES.HOME} /> : <Component {...props} />
      }
    />
  );
};

export default GuestGuard;
