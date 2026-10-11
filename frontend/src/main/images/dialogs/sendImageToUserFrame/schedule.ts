export const MAX_SCHEDULE_DAYS = 30;

const HOUR_MS = 3600 * 1000;

export const maxScheduleDate = (now: number = Date.now()): Date =>
    new Date(now + MAX_SCHEDULE_DAYS * 24 * HOUR_MS);

export const defaultScheduleDate = (now: number = Date.now()): Date => {
    const date = new Date(now + HOUR_MS);
    if (date.getMinutes() || date.getSeconds() || date.getMilliseconds()) {
        date.setHours(date.getHours() + 1, 0, 0, 0);
    }
    return date;
};

export const scheduleError = (date: Date | null, now: number = Date.now()): string | null => {
    if (!date || Number.isNaN(date.getTime())) return 'Bitte Datum und Uhrzeit angeben';
    if (date.getTime() <= now) return 'Der Zeitpunkt muss in der Zukunft liegen';
    if (date.getTime() > maxScheduleDate(now).getTime()) return `Höchstens ${MAX_SCHEDULE_DAYS} Tage im Voraus`;
    return null;
};

export const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / 1000);
