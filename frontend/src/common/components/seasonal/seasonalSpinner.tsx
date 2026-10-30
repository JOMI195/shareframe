import { createElement } from 'react';
import { Box, CircularProgress, keyframes } from '@mui/material';
import { useSeasonPick } from './useSeasonSlot';

const bounce = keyframes`
    0%, 100% { transform: translateY(0) rotate(-10deg); }
    50% { transform: translateY(-25%) rotate(10deg); }
`;

const SeasonalSpinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
    const Icon = useSeasonPick('loading');
    if (!Icon) return <CircularProgress size={size} />;

    return (
        <Box role="progressbar" aria-label="Lädt" sx={{ display: 'inline-flex', p: 1 }}>
            {createElement(Icon, { sx: { fontSize: size, color: 'accent.main', animation: `${bounce} 0.9s ease-in-out infinite`, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } } })}
        </Box>
    );
};

export default SeasonalSpinner;
