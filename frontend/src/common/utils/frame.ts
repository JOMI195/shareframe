export const isFrameActive = (last_board_heartbeat: string | undefined | null, maxInactivityMins: number = 30 * 60 * 1000): boolean => {
    if (!last_board_heartbeat || typeof last_board_heartbeat !== 'string') {
        return false;
    }

    const heartbeatTime = new Date(last_board_heartbeat);

    if (isNaN(heartbeatTime.getTime())) {
        return false;
    }

    const currentTime = new Date();

    const timeDifference = currentTime.getTime() - heartbeatTime.getTime();

    return timeDifference <= maxInactivityMins;
};