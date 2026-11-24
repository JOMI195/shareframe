import { Box, keyframes, useTheme } from '@mui/material';
import { PARTY } from '../palette';

const TILE = 160;
const TILES = 18;
const HEIGHT = 56;
const SWAG = `M0 2Q${TILE / 2} 30 ${TILE} 2`;

const cordY = (x: number) => {
    const t = x / TILE;
    return 2 + 28 * t * (1 - t);
};

const STREAMERS = [
    { x: 30, color: 0, turns: 7 },
    { x: 80, color: 1, turns: 8 },
    { x: 130, color: 2, turns: 6 },
];

const shimmer = keyframes`
    0%, 100% { opacity: 0.25; }
    50% { opacity: 0.9; }
`;

const sway = keyframes`
    from { transform: rotate(-8deg); }
    to { transform: rotate(8deg); }
`;

const still = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const Defs = () => (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <defs>
            <linearGradient id="ny-tinsel" gradientUnits="userSpaceOnUse" x1="0" x2={TILE / 4} spreadMethod="reflect">
                <stop offset="0%" stopColor="#B57F12" />
                <stop offset="50%" stopColor="#FFE7A6" />
                <stop offset="100%" stopColor="#D9A21E" />
            </linearGradient>
            <linearGradient id="ny-silver" gradientUnits="userSpaceOnUse" x1="0" x2={TILE / 5} spreadMethod="reflect">
                <stop offset="0%" stopColor="#8E9BAD" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#B9C4D2" />
            </linearGradient>
        </defs>
    </svg>
);

// A coil seen from the side: bright front arcs, darker back arcs.
const Streamer: React.FC<{ turns: number; colors: string[] }> = ({ turns, colors }) => {
    const [light, body, shade] = colors;
    const pitch = 3.4;
    return (
        <>
            {Array.from({ length: turns }, (_, i) => {
                const y = i * pitch;
                const w = 3 - i * 0.12;
                return (
                    <g key={i}>
                        <path d={`M${w} ${y + pitch / 2}Q0 ${y + pitch * 1.1} ${-w} ${y + pitch}`} fill="none" stroke={shade} strokeWidth={1.1} strokeLinecap="round" />
                        <path d={`M${-w} ${y}Q0 ${y + pitch * 0.6} ${w} ${y + pitch / 2}`} fill="none" stroke={body} strokeWidth={1.5} strokeLinecap="round" />
                        <path d={`M${-w * 0.6} ${y + 0.4}Q0 ${y + pitch * 0.5} ${w * 0.4} ${y + pitch / 2}`} fill="none" stroke={light} strokeWidth={0.5} strokeLinecap="round" opacity={0.8} />
                    </g>
                );
            })}
        </>
    );
};

const Tile: React.FC<{ index: number }> = ({ index }) => (
    <Box component="svg" viewBox={`0 0 ${TILE} ${HEIGHT}`} sx={{ display: 'block', flex: 'none', width: TILE, height: HEIGHT, overflow: 'visible' }}>
        {STREAMERS.map(({ x, color, turns }, i) => (
            <g key={x} transform={`translate(${x} ${cordY(x) + 1})`}>
                <Box
                    component="g"
                    sx={{
                        transformBox: 'fill-box',
                        transformOrigin: '50% 0%',
                        animation: `${sway} ${2.4 + ((index + i) % 3) * 0.5}s ease-in-out ${-((index + i) % 4) * 0.6}s infinite alternate`,
                        ...still,
                    }}
                >
                    <Streamer turns={turns + ((index + i) % 2)} colors={PARTY[(color + index) % PARTY.length]} />
                </Box>
            </g>
        ))}
        <path d={SWAG} fill="none" stroke="url(#ny-tinsel)" strokeWidth={6} strokeDasharray="0.6 0.5" />
        <path d={SWAG} fill="none" stroke="url(#ny-silver)" strokeWidth={4.4} strokeDasharray="0.5 0.9" strokeDashoffset={0.3} opacity={0.8} />
        <path d={SWAG} fill="none" stroke="#C9971E" strokeWidth={1.2} />
        <Box
            component="path"
            d={SWAG}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={5}
            strokeDasharray="0.4 4.6"
            sx={{ animation: `${shimmer} ${2.2 + (index % 3) * 0.4}s ease-in-out ${-(index % 5) * 0.4}s infinite`, ...still }}
        />
    </Box>
);

const PartyGarland = () => {
    const dark = useTheme().palette.mode === 'dark';
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 'calc(100% - 4px)',
                left: 0,
                right: 0,
                height: HEIGHT,
                display: 'flex',
                overflow: 'hidden',
                filter: dark ? 'drop-shadow(0 0 3px rgba(255, 224, 138, 0.35))' : 'drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.25))',
            }}
        >
            <Defs />
            {Array.from({ length: TILES }, (_, i) => (
                <Tile key={i} index={i} />
            ))}
        </Box>
    );
};

export default PartyGarland;
