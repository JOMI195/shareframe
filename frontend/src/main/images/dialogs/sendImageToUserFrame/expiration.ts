export type TimeUnit = 'hours' | 'days';

export const PREDEFINED_EXPIRATION_OPTIONS = [
    { label: '24 Stunden', hours: 24 },
    { label: '7 Tage', hours: 168 },
    { label: '14 Tage', hours: 336 },
    { label: '30 Tage', hours: 720 }
];

export const DEFAULT_EXPIRATION_HOURS = PREDEFINED_EXPIRATION_OPTIONS[0].hours;

export const MAX_CUSTOM_EXPIRATION = 365;

// null marks an entry that cannot be sent.
export const toExpirationHours = (value: string, unit: TimeUnit): number | null => {
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > MAX_CUSTOM_EXPIRATION) return null;
    return unit === 'days' ? numericValue * 24 : numericValue;
};

export const expirationTimestamp = (expirationHours: number, now: number = Date.now()): number =>
    Math.floor(now / 1000 + expirationHours * 3600);
