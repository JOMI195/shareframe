import { Box, keyframes } from '@mui/material';

const HEAD = 'M20 12C13 12 12 18 13 24c1 7 3 13 7 13s6-6 7-13c1-6 0-12-7-12z';
const EARS = 'M13.5 17C8 14.5 5.5 16.5 4.5 18c3 2 6.5 2 9 1zM26.5 17c5.5-2.5 8-.5 9 1-3 2-6.5 2-9 1z';
const ANTLERS = 'M15 13C13 8 9 7 6.5 3.5M10.5 8.5 7 9.5M8.5 5.5 9 2.5M25 13c2-5 6-6 8.5-9.5M29.5 8.5 33 9.5M31.5 5.5 31 2.5';

// Hidden most of the cycle, then rises, looks around and sinks again.
const peek = keyframes`
    0%, 70%, 94%, 100% { transform: translateY(110%) rotate(0deg); }
    76% { transform: translateY(28%) rotate(5deg); }
    81% { transform: translateY(24%) rotate(-5deg); }
    87% { transform: translateY(26%) rotate(3deg); }
`;

const glow = keyframes`
    from { opacity: 0.55; }
    to { opacity: 1; }
`;

const PeekingReindeer = () => (
    <Box
        sx={{
            position: 'absolute',
            bottom: 0,
            left: { xs: 24, md: 'auto' },
            right: { md: 160 },
            width: { xs: 56, sm: 72 },
            transform: 'translateY(110%)',
            transformOrigin: '50% 100%',
            animation: `${peek} 30s ease-in-out -18s infinite`,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
    >
        <Box component="svg" viewBox="0 0 40 40" sx={{ display: 'block', width: '100%' }}>
            <path d={ANTLERS} fill="none" stroke="#6D4C33" strokeWidth={2.2} strokeLinecap="round" />
            <path d={EARS} fill="#7A4E32" />
            <path d={HEAD} fill="#8D5A3B" />
            <ellipse cx={20} cy={32} rx={5.5} ry={4.2} fill="#C49A6C" />
            <circle cx={16.6} cy={21} r={1.5} fill="#2B1F36" />
            <circle cx={23.4} cy={21} r={1.5} fill="#2B1F36" />
            <circle cx={17.1} cy={20.5} r={0.5} fill="#FFFFFF" />
            <circle cx={23.9} cy={20.5} r={0.5} fill="#FFFFFF" />
            <circle cx={20} cy={30.5} r={3.6} fill="#FF5252" opacity={0.35} />
            <Box
                component="circle"
                cx={20}
                cy={30.5}
                r={2.6}
                fill="#E53935"
                sx={{
                    animation: `${glow} 0.9s ease-in-out infinite alternate`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            />
        </Box>
    </Box>
);

export default PeekingReindeer;
