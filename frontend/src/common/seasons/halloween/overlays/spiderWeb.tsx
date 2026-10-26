import { Box, keyframes, useTheme } from '@mui/material';

const WEB = 'M100 0L8 0M100 0L15 35.2M100 0L34.9 65.1M100 0L64.8 85M100 0L100 92M78 0Q81.4 3.7 79.7 8.4M79.7 8.4Q84.3 10.5 84.4 15.6M84.4 15.6Q89.5 15.7 91.6 20.3M91.6 20.3Q96.3 18.6 100 22M58 0Q64.6 7 61.2 16.1M61.2 16.1Q70 20.1 70.3 29.7M70.3 29.7Q79.9 30 83.9 38.8M83.9 38.8Q93 35.4 100 42M38 0Q47.7 10.4 42.7 23.7M42.7 23.7Q55.7 29.6 56.2 43.8M56.2 43.8Q70.4 44.3 76.3 57.3M76.3 57.3Q89.6 52.3 100 62M18 0Q30.8 13.8 24.2 31.4M24.2 31.4Q41.4 39.2 42 58M42 58Q60.8 58.6 68.6 75.8M68.6 75.8Q86.2 69.2 100 82';
const LEGS = 'M68 72Q63 67 60 70M68 74Q62 72 59 75M68 76Q62 77 60 81M68 78Q64 81 63 86M72.6 72Q77.6 67 80.6 70M72.6 74Q78.6 72 81.6 75M72.6 76Q78.6 77 80.6 81M72.6 78Q76.6 81 77.6 86';

const DROP = 110;
const THREAD = 40.3;

const swing = keyframes`
    from { transform: rotate(-6deg); }
    to { transform: rotate(6deg); }
`;

// Rests in the web most of the cycle, then lowers itself on its thread and climbs back.
const drop = keyframes`
    0%, 55%, 100% { transform: translateY(0); }
    64% { transform: translateY(${DROP}px); }
    67% { transform: translateY(${DROP - 8}px); }
    70%, 82% { transform: translateY(${DROP}px); }
`;

const stretch = keyframes`
    0%, 55%, 100% { transform: scaleY(1); }
    64% { transform: scaleY(${(THREAD + DROP) / THREAD}); }
    67% { transform: scaleY(${(THREAD + DROP - 8) / THREAD}); }
    70%, 82% { transform: scaleY(${(THREAD + DROP) / THREAD}); }
`;

const cycle = (frames: ReturnType<typeof keyframes>) => ({
    animation: `${frames} 16s ease-in-out infinite`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const SpiderWeb = () => {
    const theme = useTheme();
    return (
        <Box
            component="svg"
            viewBox="0 0 100 220"
            sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: { xs: 64, sm: 96 },
                height: { xs: 141, sm: 211 },
                display: 'block',
                color: 'text.secondary',
            }}
        >
            <path d={WEB} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.45} />
            <Box
                component="g"
                sx={{
                    transformBox: 'view-box',
                    transformOrigin: '70.3px 29.7px',
                    animation: `${swing} 3s ease-in-out infinite alternate`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            >
                <Box
                    component="path"
                    d="M70.3 29.7L70.3 70"
                    stroke="currentColor"
                    strokeWidth={0.6}
                    opacity={0.6}
                    sx={{ transformBox: 'view-box', transformOrigin: '70.3px 29.7px', ...cycle(stretch) }}
                />
                <Box component="g" sx={cycle(drop)}>
                    <path d={LEGS} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
                    <circle cx={70.3} cy={70} r={2.6} fill="currentColor" />
                    <circle cx={70.3} cy={76} r={4.2} fill="currentColor" />
                    <circle cx={69.3} cy={69.4} r={0.55} fill={theme.palette.accent.main} />
                    <circle cx={71.3} cy={69.4} r={0.55} fill={theme.palette.accent.main} />
                </Box>
            </Box>
        </Box>
    );
};

export default SpiderWeb;
