import { Box, keyframes, useTheme } from '@mui/material';

const TILE = 160;
const TILES = 18;
const HEIGHT = 40;

// Glass colours as [highlight, body, shade].
const BULBS = [
    ['#FF9AA8', '#E8384F', '#A3172B'],
    ['#9CF2C0', '#2FBF71', '#178049'],
    ['#FFE6A6', '#F5B83D', '#C2810F'],
    ['#B5D0FF', '#4D8EF7', '#1F56B8'],
];
const BAUBLES = [
    ['#FFB3BE', '#D62845', '#7E0F22'],
    ['#FFF0B8', '#E2A825', '#8A5B05'],
    ['#A8F0CF', '#1F9E6A', '#0B5236'],
];

const GLASS = 'M0 3C-3.6 3-4.6 6.8-3.8 9.9-3 13.1-1.2 15.1 0 15.7 1.2 15.1 3 13.1 3.8 9.9 4.6 6.8 3.6 3 0 3z';
const STAR = 'M0-5.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L0 2.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z';

const cordY = (x: number) => {
    const t = x / TILE;
    return 2 + 28 * t * (1 - t);
};

const breathe = keyframes`
    0%, 100% { opacity: 0.35; }
    50% { opacity: 1; }
`;

const dim = keyframes`
    0%, 100% { opacity: 0.75; }
    50% { opacity: 1; }
`;

const sway = keyframes`
    from { transform: rotate(-7deg); }
    to { transform: rotate(7deg); }
`;

const still = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const Defs = () => (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <defs>
            {BULBS.map(([light, body, shade], i) => (
                <g key={i}>
                    <linearGradient id={`xmas-bulb-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={light} />
                        <stop offset="45%" stopColor={body} />
                        <stop offset="100%" stopColor={shade} />
                    </linearGradient>
                    <radialGradient id={`xmas-glow-${i}`}>
                        <stop offset="0%" stopColor={body} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={body} stopOpacity={0} />
                    </radialGradient>
                </g>
            ))}
            {BAUBLES.map(([light, body, shade], i) => (
                <radialGradient key={i} id={`xmas-bauble-${i}`} cx="0.4" cy="0.35" r="0.75" fx="0.32" fy="0.28">
                    <stop offset="0%" stopColor={light} />
                    <stop offset="40%" stopColor={body} />
                    <stop offset="100%" stopColor={shade} />
                </radialGradient>
            ))}
            <linearGradient id="xmas-cap" x1="0" x2="1">
                <stop offset="0%" stopColor="#8A7A55" />
                <stop offset="50%" stopColor="#F2E3B3" />
                <stop offset="100%" stopColor="#9C8550" />
            </linearGradient>
            <linearGradient id="xmas-star" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF3C4" />
                <stop offset="50%" stopColor="#F5C042" />
                <stop offset="100%" stopColor="#B57F12" />
            </linearGradient>
        </defs>
    </svg>
);

const Bulb: React.FC<{ x: number; n: number }> = ({ x, n }) => {
    const color = n % BULBS.length;
    const timing = `${2.4 + (n % 3) * 0.5}s ease-in-out ${(-(n % 9) * 0.35).toFixed(2)}s infinite`;
    const tilt = ((n % 5) - 2) * 6;
    return (
        <g transform={`translate(${x} ${cordY(x) - 1}) rotate(${tilt})`}>
            <Box component="circle" cx={0} cy={10} r={11} fill={`url(#xmas-glow-${color})`} sx={{ animation: `${breathe} ${timing}`, ...still }} />
            <Box component="path" d={GLASS} fill={`url(#xmas-bulb-${color})`} sx={{ animation: `${dim} ${timing}`, ...still }} />
            <path d="M-1.9 6.5c-.6 1.6-.5 3.4.1 4.8" fill="none" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={0.9} strokeLinecap="round" />
            <rect x={-2.2} y={0} width={4.4} height={3.8} rx={0.8} fill="url(#xmas-cap)" />
        </g>
    );
};

const Hanging: React.FC<{ x: number; n: number; children: React.ReactNode; drop: number }> = ({ x, n, children, drop }) => (
    <g transform={`translate(${x} ${cordY(x)})`}>
        <Box
            component="g"
            sx={{
                transformBox: 'fill-box',
                transformOrigin: '50% 0%',
                animation: `${sway} ${2.6 + (n % 3) * 0.4}s ease-in-out ${-(n % 4) * 0.6}s infinite alternate`,
                ...still,
            }}
        >
            <path d={`M0 0V${drop}`} stroke="#C9B37A" strokeWidth={0.6} />
            <g transform={`translate(0 ${drop})`}>{children}</g>
        </Box>
    </g>
);

const Bauble: React.FC<{ color: number }> = ({ color }) => (
    <>
        <rect x={-1.6} y={0} width={3.2} height={2.4} rx={0.6} fill="url(#xmas-cap)" />
        <circle cx={0} cy={8.4} r={6.2} fill={`url(#xmas-bauble-${color})`} />
        <ellipse cx={-2.2} cy={6.2} rx={1.5} ry={2.2} fill="#FFFFFF" opacity={0.6} transform="rotate(30 -2.2 6.2)" />
    </>
);

const Star = () => (
    <g transform="translate(0 7) scale(1.35)">
        <path d={STAR} fill="url(#xmas-star)" stroke="#A8740E" strokeWidth={0.4} strokeLinejoin="round" />
        <circle cx={-1.2} cy={-1.4} r={0.9} fill="#FFFFFF" opacity={0.8} />
    </g>
);

const Tile: React.FC<{ index: number; cord: string }> = ({ index, cord }) => {
    const n = index * 3;
    return (
        <Box component="svg" viewBox={`0 0 ${TILE} ${HEIGHT}`} sx={{ display: 'block', flex: 'none', width: TILE, height: HEIGHT, overflow: 'visible' }}>
            <path d={`M0 2Q${TILE / 2} 30 ${TILE} 2`} fill="none" stroke={cord} strokeWidth={1.6} />
            <path d={`M0 1.4Q${TILE / 2} 29.4 ${TILE} 1.4`} fill="none" stroke="#3C8A5E" strokeWidth={0.5} opacity={0.7} />
            <Hanging x={48} n={index} drop={5}>
                <Bauble color={index % BAUBLES.length} />
            </Hanging>
            <Hanging x={112} n={index + 1} drop={4}>
                {index % 2 ? <Star /> : <Bauble color={(index + 1) % BAUBLES.length} />}
            </Hanging>
            <Bulb x={16} n={n} />
            <Bulb x={80} n={n + 1} />
            <Bulb x={144} n={n + 2} />
        </Box>
    );
};

const FairyLights = () => {
    const cord = useTheme().palette.mode === 'dark' ? '#3E8A60' : '#1E4D35';
    return (
    <Box sx={{ position: 'absolute', top: 'calc(100% - 3px)', left: 0, right: 0, height: HEIGHT, display: 'flex', overflow: 'hidden' }}>
        <Defs />
        {Array.from({ length: TILES }, (_, i) => (
            <Tile key={i} index={i} cord={cord} />
        ))}
    </Box>
    );
};

export default FairyLights;
