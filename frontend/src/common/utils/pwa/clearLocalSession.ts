import { getPushSubscription } from './push';
import { clearSharedFiles } from './sharedFiles';
import { clearAvatarCache } from '@/common/utils/avatar/avatarCache';
import { clearImageCache } from '@/common/utils/imageCache';

// Browser side only: when the session is already gone, a server call would 401 and log out again.
// Unsubscribing invalidates the endpoint, so the server drops it on its next push.
export const clearLocalSession = async () => {
    const subscription = await getPushSubscription().catch(() => null);
    await subscription?.unsubscribe().catch(() => undefined);
    await clearSharedFiles().catch(() => undefined);
    clearAvatarCache();
    clearImageCache();
};
