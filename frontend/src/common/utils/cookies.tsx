export const isCookieConsentExpired = (consentExpiry: number | null) => {
    const now = Date.now();

    if (consentExpiry === null) {
        return true;
    }

    if (now > consentExpiry) {
        return true;
    }

    return false;
}