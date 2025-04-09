const apiBaseUrl = () => "/api";
const frameBaseUrl = () => `${apiBaseUrl()}/frame`;
//const connectionBaseUrl = () => `${apiBaseUrl()}/connection`;


// Auth


// Connection


// Slideshow
export const getSlideshowUrl = () => `${frameBaseUrl()}/slideshow`;

export const getClearDisplayUrl = () => `${frameBaseUrl()}/clear`;

export const getSlideshowIsActiveUrl = () => `${frameBaseUrl()}/slideshow/is-active`;

export const getSkipSlideshowImageUrl = () => `${frameBaseUrl()}/slideshow/skip-slideshow-image`;

// Updates
export const getLatestReleaseUrl = () => `${frameBaseUrl()}/updates/latest`;

export const getPerformUpdateUrl = () => `${frameBaseUrl()}/updates/perform-update`;

// PiPower
export const getRestartPiUrl = () => `${apiBaseUrl()}/pi/restart`;

export const getShutdownPiUrl = () => `${apiBaseUrl()}/pi/shutdown`;