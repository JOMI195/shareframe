import { useContext } from 'react';
import { Box, CircularProgress, keyframes } from '@mui/material';
import { ColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';

const bounce = keyframes`
    0%, 100% { transform: translateY(0) rotate(-10deg); }
    50% { transform: translateY(-25%) rotate(10deg); }
`;

// Also rendered outside the theme provider, so the context may be missing.
const SeasonalSpinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
    const season = useContext(ColorThemeContext)?.season;
    if (!season) return <CircularProgress size={size} />;

    const { LogoIcon } = season;
    return (
        <Box role="progressbar" aria-label="Lädt" sx={{ display: 'inline-flex', p: 1 }}>
            <LogoIcon sx={{ fontSize: size, color: 'accent.main', animation: `${bounce} 0.9s ease-in-out infinite` }} />
        </Box>
    );
};

export default SeasonalSpinner;
