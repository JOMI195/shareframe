export const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
};

// Every full page load gets the key "default", so pages would share one saved position.
export const scrollRestorationKey = (location: { key: string; pathname: string }) =>
    location.key === 'default' ? location.pathname : location.key;
