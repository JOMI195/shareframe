import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Provider } from 'react-redux';
import { store } from './store/index.ts';
import http from "./services/httpService";
import '@fontsource/inter';
import StoreGate from './common/components/storeGate.tsx';
import { Suspense } from 'react';
import ErrorBoundary from './common/components/error/errorBoundary/errorBoundary.tsx';
import LoadingFallback from './common/components/loadingFallback.tsx';

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <StoreGate>
          <App />
        </StoreGate>
      </Provider>
    </ErrorBoundary>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <Suspense fallback={<LoadingFallback />}>
    <AppWrapper />
  </Suspense>
);

http.apiSetup(store);
