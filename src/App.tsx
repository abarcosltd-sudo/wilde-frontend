import React, { Suspense } from 'react';
import { IonApp } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './routes/AppRouter';
import { SplashScreen } from './pages/auth/SplashPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <IonApp>
      <Suspense fallback={<SplashScreen />}>
        <AppRouter />
      </Suspense>
    </IonApp>
  </QueryClientProvider>
);

export default App;
