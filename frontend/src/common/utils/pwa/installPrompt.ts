export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

let state: InstallState = { deferred: null, installed: false };
const listeners = new Set<() => void>();

const setState = (next: Partial<InstallState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS reports itself as a Mac.
export const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const onBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  setState({ deferred: event as BeforeInstallPromptEvent });
};

const onAppInstalled = () => setState({ deferred: null, installed: true });

// Called before React mounts: the browser may fire beforeinstallprompt only once, early.
export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
  setState({ deferred: null, installed: isStandalone() });
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

export const promptInstall = async () => {
  const { deferred } = state;
  if (!deferred) return 'unavailable';

  // A deferred event can only be prompted once.
  setState({ deferred: null });
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  return outcome;
};
