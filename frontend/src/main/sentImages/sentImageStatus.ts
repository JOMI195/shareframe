import { ISentImage } from "@/types";

export type SentImageState = 'scheduled' | 'active' | 'expired';

export const getSentImageState = (sentImage: ISentImage, now: number = Date.now()): SentImageState => {
    if (sentImage.status === 'scheduled') return 'scheduled';
    if (sentImage.expires_at === null) return 'expired';
    return new Date(sentImage.expires_at).getTime() < now ? 'expired' : 'active';
};

export const SENT_IMAGE_STATE_LABELS: Record<SentImageState, string> = {
    scheduled: 'Geplant',
    active: 'Aktiv',
    expired: 'Abgelaufen',
};

const MINUTE_MS = 60 * 1000;

const plural = (count: number, singular: string, pluralForm: string) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

export const getActiveDurationMs = (sentImage: ISentImage): number | null => {
    if (sentImage.expires_at === null) return null;
    const start = sentImage.status === 'scheduled' && sentImage.scheduled_for ? sentImage.scheduled_for : sentImage.sent_at;
    return Math.max(0, new Date(sentImage.expires_at).getTime() - new Date(start).getTime());
};

export const formatDuration = (durationMs: number): string => {
    const totalMinutes = Math.round(durationMs / MINUTE_MS);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [
        days > 0 && plural(days, 'Tag', 'Tage'),
        hours > 0 && plural(hours, 'Stunde', 'Stunden'),
        minutes > 0 && plural(minutes, 'Minute', 'Minuten'),
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : 'weniger als 1 Minute';
};
