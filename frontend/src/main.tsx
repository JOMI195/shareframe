import { createRoot } from 'react-dom/client';
import { persistor, store } from './store/index.ts';
import http from "./services/httpService";
import { getCsrfUrl } from "./assets/endpoints/api/authEndpoints";
import '@fontsource/inter';
import { Suspense } from 'react';
import AppWrapper from './appWrapper.tsx';
import LoadingFallback from './common/components/loadingFallback.tsx';

http.apiSetup(store, persistor);
// Seeds the csrftoken cookie for the first unsafe request.
http.get(getCsrfUrl()).catch(() => undefined);
const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <Suspense fallback={<LoadingFallback />}>
    <AppWrapper />
  </Suspense>
);
