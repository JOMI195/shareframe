import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Provider } from 'react-redux';
import { persistor, store } from './store/index.ts';
import http from "./services/httpService";
import '@fontsource/inter';
import { Suspense } from 'react';
import ErrorBoundary from './common/components/error/errorBoundary/errorBoundary.tsx';
import LoadingFallback from './common/components/loadingFallback.tsx';
import { PersistGate } from 'redux-persist/integration/react';

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

http.apiSetup(store);
const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <Suspense fallback={<LoadingFallback />}>
    <AppWrapper />
  </Suspense>
);
