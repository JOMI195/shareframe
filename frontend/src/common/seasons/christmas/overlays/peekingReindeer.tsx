import { Box, keyframes } from '@mui/material';
import { BROWN, BROWN_SHADE, INK, RED, TAN } from '../palette';

const HEAD = 'M20 12C13 12 12 18 13 24c1 7 3 13 7 13s6-6 7-13c1-6 0-12-7-12z';
const HEAD_SHADE = 'M20 12c7 0 8 6 7 12-1 7-3 13-7 13 2-3 3.4-8 3.8-13 .4-5-.6-10-3.8-12z';
const EARS = 'M13.5 17C8 14.5 5.5 16.5 4.5 18c3 2 6.5 2 9 1zM26.5 17c5.5-2.5 8-.5 9 1-3 2-6.5 2-9 1z';
const INNER_EARS = 'M12.5 17.6c-2.8-1-5-.7-6.2.4 2 1 4.2 1.1 6.2.6zM27.5 17.6c2.8-1 5-.7 6.2.4-2 1-4.2 1.1-6.2.6z';
const ANTLERS = 'M15 13C13 8 9 7 6.5 3.5M10.5 8.5 7 9.5M8.5 5.5 9 2.5M25 13c2-5 6-6 8.5-9.5M29.5 8.5 33 9.5M31.5 5.5 31 2.5';

// Hidden most of the cycle, then rises, looks around and sinks again.
const peek = keyframes`
    0%, 70%, 94%, 100% { transform: translateY(110%) rotate(0deg); }
    76% { transform: translateY(12%) rotate(5deg); }
    81% { transform: translateY(8%) rotate(-5deg); }
    87% { transform: translateY(10%) rotate(3deg); }
`;

const blink = keyframes`
    from { transform: scale(0.85); }
    to { transform: scale(1.15); }
`;

const PeekingReindeer = () => (
    <Box
        sx={{
            position: 'absolute',
            bottom: 0,
            left: { xs: 24, md: 'auto' },
            right: { md: 160 },
            width: { xs: 60, sm: 76 },
            transform: 'translateY(110%)',
            transformOrigin: '50% 100%',
            animation: `${peek} 30s ease-in-out -18s infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
    >
        <Box component="svg" viewBox="0 0 40 40" sx={{ display: 'block', width: '100%', overflow: 'visible' }}>
            <path d={ANTLERS} fill="none" stroke={TAN} strokeWidth={2.4} strokeLinecap="round" />
            <path d={EARS} fill={BROWN} />
            <path d={INNER_EARS} fill="#F2A7B2" />
            <path d={HEAD} fill={BROWN} />
            <path d={HEAD_SHADE} fill={BROWN_SHADE} opacity={0.45} />
            <ellipse cx={20} cy={32} rx={5.6} ry={4.4} fill={TAN} />
            <ellipse cx={16.5} cy={21.2} rx={1.6} ry={1.9} fill={INK} />
            <ellipse cx={23.5} cy={21.2} rx={1.6} ry={1.9} fill={INK} />
            <circle cx={17} cy={20.5} r={0.5} fill="#FFFFFF" />
            <circle cx={24} cy={20.5} r={0.5} fill="#FFFFFF" />
            <path d="M18.2 34.6q1.8 1.2 3.6 0" fill="none" stroke={INK} strokeWidth={0.6} strokeLinecap="round" />
            <Box
                component="circle"
                cx={20}
                cy={30.4}
                r={2.8}
                fill={RED}
                sx={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `${blink} 1s ease-in-out infinite alternate`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            />
        </Box>
    </Box>
);

export default PeekingReindeer;
