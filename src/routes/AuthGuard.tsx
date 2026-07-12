import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';

const AuthGuard: React.FC<RouteProps> = ({ children, ...rest }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  return (
    <Route {...rest}>
      {user ? children : <Redirect to={ROUTES.SIGN_IN} />}
    </Route>
  );
};

export default AuthGuard;
