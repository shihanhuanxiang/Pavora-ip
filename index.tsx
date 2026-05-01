import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/shell/App';
import { loadTaxonomyData } from './src/shared/services/taxonomyService';

import { NotificationProvider } from './src/shared/context/NotificationContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

(async () => {
  const taxonomyData = await loadTaxonomyData();
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <NotificationProvider>
      <App taxonomyData={taxonomyData} />
    </NotificationProvider>
  );
})();
