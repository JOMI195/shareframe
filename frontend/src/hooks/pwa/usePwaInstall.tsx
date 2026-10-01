import { useSyncExternalStore } from 'react';
import { getSnapshot, isIos, promptInstall, subscribe } from '@/common/utils/pwa/installPrompt';

export const usePwaInstall = () => {
    const { deferred, installed } = useSyncExternalStore(subscribe, getSnapshot);

    return {
        installed,
        canPrompt: !installed && deferred !== null,
        showIosHint: !installed && isIos(),
        promptInstall,
    };
};
