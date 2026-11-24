import { Box, keyframes, useTheme } from '@mui/material';
import { silhouetteColor } from '../../motion';
import { BLUE, BLUE_SHADE, GOLD, GOLD_SHADE, GREEN, GREEN_SHADE, RED, RED_SHADE } from '../palette';
import { newYearNumber } from '../year';

const SILVER = '#C9CED6';
const SILVER_SHADE = '#9AA1AD';
const WIDTH = 300;
const HEIGHT = 46;
const TIE = 4;
const SAG = 7;
const BULB_GAP = 40;
const BULBS = 24;

const cordY = (x: number) => {
    const t = x / WIDTH;
    return TIE + 4 * SAG * t * (1 - t);
};

const sway = keyframes`
    from { transform: rotate(-2deg); }
    to { transform: rotate(2deg); }
`;

const bob = keyframes`
    from { transform: translateY(-1.5px); }
    to { transform: translateY(1.5px); }
`;

const shimmer = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
`;

const still = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

// No purple: it would vanish on the purple greeting card.
const FLAGS = [
    [RED, RED_SHADE],
    [GOLD, GOLD_SHADE],
    [GREEN, GREEN_SHADE],
    [BLUE, BLUE_SHADE],
];
const PENNANT = 'M-10.5 0h21v26L0 21l-10.5 5z';

// A swallowtail pennant per letter, tilted along the string.
const Pennant: React.FC<{ x: number; n: number; char: string }> = ({ x, n, char }) => {
    const slope = (Math.atan((4 * SAG * (1 - (2 * x) / WIDTH)) / WIDTH) * 180) / Math.PI;
    return (
        <g transform={`translate(${x} ${cordY(x)}) rotate(${slope})`}>
            <Box
                component="g"
                sx={{
                    transformBox: 'fill-box',
                    transformOrigin: '50% 0%',
                    animation: `${sway} ${2.4 + (n % 3) * 0.5}s ease-in-out ${-(n % 4) * 0.5}s infinite alternate`,
                    ...still,
                }}
            >
                <path d={PENNANT} fill={FLAGS[n % FLAGS.length][0]} stroke={FLAGS[n % FLAGS.length][1]} strokeWidth={0.8} strokeLinejoin="round" />
                <text x={0} y={16.5} textAnchor="middle" fontSize={15} fontWeight={900} fontFamily="inherit" fill="#FFFFFF">
                    {char}
                </text>
            </Box>
        </g>
    );
};

const Balloon: React.FC<{ x: number; color: string; ribbon: string; n: number }> = ({ x, color, ribbon, n }) => (
    <Box component="g" sx={{ animation: `${bob} ${2 + n * 0.4}s ease-in-out infinite alternate`, ...still }}>
        <path d={`M${x} 22q-3 5 0 10t0 10M${x} 22q3 5 1 11t1 11`} fill="none" stroke={ribbon} strokeWidth={0.8} />
        <ellipse cx={x} cy={11} rx={8} ry={10} fill={color} />
        <path d={`M${x - 1.6} 22.4h3.2L${x} 19.6z`} fill={color} />
    </Box>
);

// Bulbs are light sources, so they glow unlike the flat pieces.
const Bulbs: React.FC<{ line: string; side: 'left' | 'right' }> = ({ line, side }) => (
    <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }}>
        <Box component="svg" viewBox={`0 0 ${BULB_GAP * BULBS} ${HEIGHT}`} sx={{ display: 'block', flex: 'none', width: BULB_GAP * BULBS, height: HEIGHT }}>
            <path d={`M0 ${TIE}H${BULB_GAP * BULBS}`} stroke={line} strokeWidth={1.2} />
            {Array.from({ length: BULBS }, (_, i) => (
                <g key={i} transform={`translate(${i * BULB_GAP + BULB_GAP / 2} ${TIE})`}>
                    <rect x={-1.6} y={0} width={3.2} height={2.6} rx={0.6} fill="#6B6380" />
                    <Box
                        component="circle"
                        cx={0}
                        cy={7}
                        r={4.4}
                        fill="#FFF4D6"
                        sx={{
                            filter: 'drop-shadow(0 0 2px #FFD98A) drop-shadow(0 0 6px #FFC34D)',
                            animation: `${shimmer} ${1.8 + (i % 3) * 0.4}s ease-in-out ${-(i % 5) * 0.3}s infinite`,
                            ...still,
                        }}
                    />
                </g>
            ))}
        </Box>
    </Box>
);

const YearBanner = () => {
    const line = silhouetteColor(useTheme());
    const chars = `FROHES ${newYearNumber(new Date())}`.split('');
    const step = (WIDTH - 68) / (chars.length - 1);

    return (
        <Box sx={{ position: 'absolute', top: '100%', left: 0, right: 0, height: HEIGHT, display: 'flex', overflow: 'hidden' }}>
            <Bulbs line={line} side="left" />
            <Box component="svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} sx={{ display: 'block', flex: 'none', width: WIDTH, height: HEIGHT, overflow: 'visible' }}>
                <path d={`M0 ${TIE}Q${WIDTH / 2} ${TIE + 2 * SAG} ${WIDTH} ${TIE}`} fill="none" stroke={line} strokeWidth={1.2} />
                {chars.map((char, i) => (char === ' ' ? null : <Pennant key={i} x={34 + i * step} n={i} char={char} />))}
                <Balloon x={10} color={GOLD} ribbon={GOLD_SHADE} n={0} />
                <Balloon x={WIDTH - 10} color={SILVER} ribbon={SILVER_SHADE} n={1} />
            </Box>
            <Bulbs line={line} side="right" />
        </Box>
    );
};

export default YearBanner;
