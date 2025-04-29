import { ISentImage } from "@/types";

export interface DayActivity {
    day: string;
    sentCount: number;
    receivedCount: number;
}

export const useWeeklyActivityData = (sentImages: ISentImage[], username: string): DayActivity[] => {
    interface DayInfo {
        date: Date;
        dayName: string;
    }

    // Get the last 7 days for date comparison - starting with Monday as first day
    const getLast7Days = (): DayInfo[] => {
        const days: DayInfo[] = [];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.

        // Calculate days to go back to reach previous Monday
        const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Generate 7 days starting from Monday
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - startOffset + i);

            // European/German day order (Monday first)
            const europeanDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

            days.push({
                date,
                dayName: europeanDayNames[i]
            });
        }
        return days;
    };

    const last7Days = getLast7Days();

    // Calculate activity data
    return last7Days.map(({ date, dayName }) => {
        // Set time to beginning of day for comparison
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Count images sent by me on this day
        const sentByMe = sentImages.filter(image =>
            new Date(image.sent_at) >= startOfDay &&
            new Date(image.sent_at) <= endOfDay &&
            image.sender === username
        ).length;

        // Count images received by me on this day
        const receivedByMe = sentImages.filter(image =>
            new Date(image.sent_at) >= startOfDay &&
            new Date(image.sent_at) <= endOfDay &&
            image.reciever === username
        ).length;

        return {
            day: dayName,
            sentCount: sentByMe,
            receivedCount: receivedByMe
        };
    });
};