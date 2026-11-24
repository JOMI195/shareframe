import { Box, keyframes, useTheme } from '@mui/material';
import { BLUE, GOLD, GOLD_SHADE, GREEN, RED, RED_SHADE } from '../palette';

const TILE = 160;
const TILES = 18;
const HEIGHT = 40;

// Bulb colours as [lit, unlit].
const BULBS = [
    [RED, RED_SHADE],
    [GREEN, '#1E7A45'],
    [GOLD, GOLD_SHADE],
    [BLUE, '#2F64C2'],
];
const BAUBLES = [RED, GOLD, GREEN];

const GLASS = 'M0 3C-3.6 3-4.6 6.8-3.8 9.9-3 13.1-1.2 15.1 0 15.7 1.2 15.1 3 13.1 3.8 9.9 4.6 6.8 3.6 3 0 3z';
const STAR = 'M0-5.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L0 2.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z';

const cordY = (x: number) => {
    const t = x / TILE;
    return 2 + 28 * t * (1 - t);
};

const blink = keyframes`
    0%, 45% { opacity: 1; }
    55%, 100% { opacity: 0.35; }
`;

const sway = keyframes`
    from { transform: rotate(-7deg); }
    to { transform: rotate(7deg); }
`;

const still = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const Bulb: React.FC<{ x: number; n: number }> = ({ x, n }) => {
    const [lit, unlit] = BULBS[n % BULBS.length];
    const tilt = ((n % 5) - 2) * 6;
    return (
        <g transform={`translate(${x} ${cordY(x) - 1}) rotate(${tilt})`}>
            <path d={GLASS} fill={unlit} />
            <Box
                component="path"
                d={GLASS}
                fill={lit}
                sx={{ animation: `${blink} ${1.6 + (n % 3) * 0.4}s steps(1) ${-(n % 4) * 0.4}s infinite alternate`, ...still }}
            />
            <rect x={-2.2} y={0} width={4.4} height={3.8} rx={0.8} fill="#7D8794" />
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
            <path d={`M0 0V${drop}`} stroke={GOLD_SHADE} strokeWidth={0.6} />
            <g transform={`translate(0 ${drop})`}>{children}</g>
        </Box>
    </g>
);

const Bauble: React.FC<{ color: string }> = ({ color }) => (
    <>
        <rect x={-1.6} y={0} width={3.2} height={2.4} rx={0.6} fill={GOLD_SHADE} />
        <circle cx={0} cy={8.4} r={6.2} fill={color} />
        <path d="M-6 9.4q3-2 6 0t6 0" fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.7} />
    </>
);

const Star = () => (
    <g transform="translate(0 7) scale(1.35)">
        <path d={STAR} fill={GOLD} stroke={GOLD_SHADE} strokeWidth={0.5} strokeLinejoin="round" />
    </g>
);

const Tile: React.FC<{ index: number; cord: string }> = ({ index, cord }) => {
    const n = index * 3;
    return (
        <Box component="svg" viewBox={`0 0 ${TILE} ${HEIGHT}`} sx={{ display: 'block', flex: 'none', width: TILE, height: HEIGHT, overflow: 'visible' }}>
            <path d={`M0 2Q${TILE / 2} 30 ${TILE} 2`} fill="none" stroke={cord} strokeWidth={1.6} />
            <Hanging x={48} n={index} drop={5}>
                <Bauble color={BAUBLES[index % BAUBLES.length]} />
            </Hanging>
            <Hanging x={112} n={index + 1} drop={4}>
                {index % 2 ? <Star /> : <Bauble color={BAUBLES[(index + 1) % BAUBLES.length]} />}
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
            {Array.from({ length: TILES }, (_, i) => (
                <Tile key={i} index={i} cord={cord} />
            ))}
        </Box>
    );
};

export default FairyLights;
