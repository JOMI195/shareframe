import '@fontsource/merriweather/latin-400.css';
import '@fontsource/merriweather/latin-700.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-700.css';
import { FONTS } from './textOverlays';

// Canvas text only uses a webfont that is already loaded, it never triggers the download.
export const loadFonts = async () => {
    if (!document.fonts) return;
    const loads = Object.values(FONTS).flatMap(({ family }) => [
        document.fonts.load(`normal 16px "${family}"`),
        document.fonts.load(`bold 16px "${family}"`),
    ]);
    await Promise.allSettled(loads);
};
