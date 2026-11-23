import { Box, keyframes } from '@mui/material';

const TILE = 120;
const TILES = 24;
const COLORS = ['#FF3B30', '#34C759', '#FFCC00', '#0A84FF', '#FF9500'];
const BULBS = [
    { x: 20, y: 5.9, tilt: 7 },
    { x: 60, y: 9, tilt: 0 },
    { x: 100, y: 5.9, tilt: -7 },
];
const GLASS = 'M0 3C-3.4 3-4.4 6.6-3.6 9.6-2.8 12.7-1.1 14.6 0 15.2 1.1 14.6 2.8 12.7 3.6 9.6 4.4 6.6 3.4 3 0 3z';

const lit = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
`;

const halo = keyframes`
    0%, 100% { opacity: 0.85; }
    50% { opacity: 0; }
`;

const blink = (frames: ReturnType<typeof keyframes>, n: number) => ({
    animation: `${frames} ${1.8 + (n % 3) * 0.6}s ease-in-out ${-(n % 7) * 0.45}s infinite`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const Glows = () => (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
            {COLORS.map((color, i) => (
                <radialGradient key={i} id={`fairy-glow-${i}`}>
                    <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </radialGradient>
            ))}
            <linearGradient id="fairy-cap" x1="0" x2="1">
                <stop offset="0%" stopColor="#6B6B6B" />
                <stop offset="45%" stopColor="#D9D9D9" />
                <stop offset="100%" stopColor="#7A7A7A" />
            </linearGradient>
        </defs>
    </svg>
);

const Tile: React.FC<{ index: number }> = ({ index }) => (
    <Box component="svg" viewBox={`0 0 ${TILE} 28`} sx={{ display: 'block', flex: 'none', width: TILE, height: 28, overflow: 'visible' }}>
        <path d={`M0 2Q${TILE / 2} 16 ${TILE} 2`} fill="none" stroke="currentColor" strokeWidth={1.1} />
        <path d={`M0 3Q${TILE / 2} 15 ${TILE} 3`} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.6} />
        {BULBS.map(({ x, y, tilt }, i) => {
            const n = index * BULBS.length + i;
            const color = n % COLORS.length;
            return (
                <g key={i} transform={`translate(${x} ${y - 1}) rotate(${tilt})`}>
                    <Box component="circle" cx={0} cy={9.5} r={10} fill={`url(#fairy-glow-${color})`} sx={blink(halo, n)} />
                    <Box component="path" d={GLASS} fill={COLORS[color]} sx={blink(lit, n)} />
                    <ellipse cx={-1.5} cy={7.5} rx={0.8} ry={2.2} fill="#FFFFFF" opacity={0.6} />
                    <rect x={-2.1} y={0} width={4.2} height={3.6} rx={0.7} fill="url(#fairy-cap)" />
                </g>
            );
        })}
    </Box>
);

const FairyLights = () => (
    <Box
        sx={{
            position: 'absolute',
            top: 'calc(100% - 3px)',
            left: 0,
            right: 0,
            height: 32,
            display: 'flex',
            overflow: 'hidden',
            color: 'text.secondary',
        }}
    >
        <Glows />
        {Array.from({ length: TILES }, (_, i) => (
            <Tile key={i} index={i} />
        ))}
    </Box>
);

export default FairyLights;
