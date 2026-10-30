import { createRoot } from 'react-dom/client';
import { persistor, store } from './store/index.ts';
import http from "./services/httpService";
import { getCsrfUrl } from "./assets/endpoints/api/authEndpoints";
import '@fontsource/inter';
import { Suspense } from 'react';
import AppWrapper from './appWrapper.tsx';
import LoadingFallback from './common/components/loadingFallback.tsx';
import StandaloneTheme from './common/components/error/standaloneTheme.tsx';
import { initInstallPrompt } from './common/utils/pwa/installPrompt.ts';
import { initStaleChunkReload } from './common/utils/staleChunkReload.ts';

http.apiSetup(store, persistor);
// Seeds the csrftoken cookie for the first unsafe request.
if (!document.cookie.split('; ').some((cookie) => cookie.startsWith('csrftoken='))) {
  http.get(getCsrfUrl()).catch(() => undefined);
}
initInstallPrompt();
initStaleChunkReload();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Installed apps can stay open for days without a navigation.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => undefined);
      });
    }).catch(() => undefined);
  });
}

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <Suspense fallback={<StandaloneTheme><LoadingFallback /></StandaloneTheme>}>
    <AppWrapper />
  </Suspense>
);
