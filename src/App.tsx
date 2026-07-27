import React from 'react';
import { IonApp } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './routes/AppRouter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import Toast from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes, so returning to a tab renders from
      // cache instantly instead of showing a spinner and refetching.
      staleTime: 1000 * 60 * 5,
      // Keep it around well past that, so navigating away and back is instant
      // even once the data has gone stale (it re-renders, then refetches).
      gcTime: 1000 * 60 * 30,
      retry: 1,
      // This is a mobile-first app; refetching every time the webview regains
      // focus causes visible churn without telling the user anything new.
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  useAuth()
  // Owns the `.dark` class on <html> for the whole app.
  useTheme()
  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <AppRouter />
        <Toast />
      </IonApp>
    </QueryClientProvider>
  )
};

export default App;
