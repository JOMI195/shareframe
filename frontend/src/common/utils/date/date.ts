export const formatDateOnly = (isoDateString: string | number | Date, locale = 'de-DE') => {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

export const formatDate = (isoDateString: string | number | Date, locale = 'de-DE') => {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    }).format(date);
};