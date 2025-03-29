import { IFrame } from "@/types";

export const isFrameActive = (frame: IFrame, maxInactivityMins: number = 30 * 60 * 1000): boolean => {
    if (!frame.last_board_heartbeat) {
        return false;
    }

    const heartbeatTime = new Date(frame.last_board_heartbeat);
    const currentTime = new Date();

    const timeDifference = currentTime.getTime() - heartbeatTime.getTime();

    return timeDifference <= maxInactivityMins;
};