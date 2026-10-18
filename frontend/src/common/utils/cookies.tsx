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

const COOKIE_PROBE = "sf_cookie_probe";

// cookieEnabled alone misses per-site blocking, so a probe must round-trip.
export const areCookiesEnabled = () => {
    if (!navigator.cookieEnabled) {
        return false;
    }

    try {
        document.cookie = `${COOKIE_PROBE}=1; path=/; SameSite=Lax`;
        const stored = document.cookie.includes(`${COOKIE_PROBE}=1`);
        document.cookie = `${COOKIE_PROBE}=; path=/; max-age=0; SameSite=Lax`;
        return stored;
    } catch {
        return false;
    }
}
