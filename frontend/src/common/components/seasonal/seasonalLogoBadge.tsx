import { PropsWithChildren, useState } from 'react';
import { Box, ButtonBase, keyframes } from '@mui/material';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';
import { triggerFlyby } from '@/common/seasons/flyby';

const wobble = keyframes`
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-18deg); }
    75% { transform: rotate(18deg); }
`;

const SeasonalLogoBadge: React.FC<PropsWithChildren<{ size?: number }>> = ({ children, size = 18 }) => {
    const { season } = useColorThemeContext();
    const [wobbles, setWobbles] = useState(0);
    if (!season) return children;

    const { LogoIcon } = season;
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            {children}
            <ButtonBase
                aria-label={season.label}
                onClick={() => {
                    setWobbles((n) => n + 1);
                    triggerFlyby();
                }}
                sx={{ position: 'absolute', top: -size / 3, right: -size / 2, borderRadius: '50%' }}
            >
                <LogoIcon
                    key={wobbles}
                    sx={{
                        fontSize: size,
                        color: 'accent.main',
                        animation: wobbles ? `${wobble} 0.5s ease-in-out` : 'none',
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }}
                />
            </ButtonBase>
        </Box>
    );
};

export default SeasonalLogoBadge;
