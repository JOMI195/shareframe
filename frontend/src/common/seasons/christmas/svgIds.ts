import { useId } from 'react';

// Gradient ids must be unique per instance, and React's ids contain characters url(#…) can't take.
export const useSvgIds = <K extends string>(...names: K[]): Record<K, string> => {
    const base = `x${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    return Object.fromEntries(names.map((name) => [name, `${base}-${name}`])) as Record<K, string>;
};

export const url = (id: string) => `url(#${id})`;
