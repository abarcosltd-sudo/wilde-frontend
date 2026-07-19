import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import App from './App';
import './index.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

setupIonicReact({
  mode: 'ios',
});

const container = document.getElementById('root') as HTMLElement;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

