import { Box, keyframes } from '@mui/material';

const BODY = 'M12 2C7.6 2 5 5.3 5 9.5V21l2.3-1.6L9.7 21l2.3-1.6 2.3 1.6 2.4-1.6L19 21V9.5C19 5.3 16.4 2 12 2z';

// Hidden most of the cycle, then rises, looks around and sinks again.
const peek = keyframes`
    0%, 78%, 96%, 100% { transform: translateY(110%) rotate(0deg); }
    82% { transform: translateY(35%) rotate(-6deg); }
    86% { transform: translateY(30%) rotate(6deg); }
    90% { transform: translateY(32%) rotate(-4deg); }
`;

const blink = keyframes`
    0%, 86%, 88%, 100% { transform: scaleY(1); }
    87% { transform: scaleY(0.1); }
`;

const PeekingGhost = () => (
    <Box
        sx={{
            position: 'absolute',
            bottom: 0,
            right: { xs: 96, md: 160 },
            width: { xs: 44, sm: 56 },
            transform: 'translateY(110%)',
            transformOrigin: '50% 100%',
            animation: `${peek} 28s ease-in-out -14s infinite`,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
    >
        <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: '100%' }}>
            <path d={BODY} fill="#FFFFFF" />
            <Box
                component="g"
                fill="#2B1F36"
                sx={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `${blink} 28s linear -14s infinite`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            >
                <ellipse cx={9.5} cy={9.8} rx={1.3} ry={1.6} />
                <ellipse cx={14.5} cy={9.8} rx={1.3} ry={1.6} />
            </Box>
            <ellipse cx={12} cy={14.5} rx={1.2} ry={1.5} fill="#2B1F36" />
        </Box>
    </Box>
);

export default PeekingGhost;
