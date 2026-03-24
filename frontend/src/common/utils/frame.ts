export const isFrameActive = (last_seen: string | undefined | null, maxInactivityMins: number = 30 * 60 * 1000): boolean => {
    if (!last_seen || typeof last_seen !== 'string') {
        return false;
    }

    const heartbeatTime = new Date(last_seen);

    if (isNaN(heartbeatTime.getTime())) {
        return false;
    }

    const currentTime = new Date();

    const timeDifference = currentTime.getTime() - heartbeatTime.getTime();

    return timeDifference <= maxInactivityMins;
};