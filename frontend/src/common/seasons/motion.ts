import { useRef } from 'react';
import { keyframes, type Theme } from '@mui/material';

export const travel = keyframes`
    from { transform: translateX(-20vw); }
    to { transform: translateX(120vw); }
`;

export const fade = keyframes`
    0% { opacity: 0; }
    30%, 70% { opacity: 1; }
    100% { opacity: 0; }
`;

export const silhouetteColor = (theme: Theme) => (theme.palette.mode === 'dark' ? '#C9B8E8' : '#2B1F36');

// Calls onDone once each of the count pieces has finished its own animation.
export const useAllEnded = (count: number, onDone: () => void) => {
    const ended = useRef(0);
    return (event: React.AnimationEvent) => {
        if (event.target !== event.currentTarget) return;
        ended.current += 1;
        if (ended.current === count) onDone();
    };
};
