import { Box, keyframes, useTheme } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, travel, useAllEnded } from '../../motion';
import { BROWN, GOLD, RED, RED_SHADE, TAN } from '../palette';

const VIEW = '-40 -4 165 44';
const REINDEER = [58, 92];

const SLEIGH = 'M2 22h34l6-6h3l-6 12c-1 2-3 3-5 3H8c-3 0-5-3-6-9z';
const RUNNER = 'M1 35h38c3 0 5-1 6-4M10 31v4M32 31v4';
const SACK = 'M6 24c-2-5 0-10 5-11 1-2 3-2 4 0 5 1 6 6 5 11z';
const COAT = 'M21 22q0-8 6-8t6 8z';
const BEARD = 'M23.8 10.5c0 3.5 1.5 5.6 3.2 5.6s3.2-2.1 3.2-5.6c-1 1-2 1.4-3.2 1.4s-2.2-.4-3.2-1.4z';
const HAT = 'M23.8 8.4 30 7.6 22.5 2.8z';
const BODY = 'M4 13c0-3 3-5 9-5s9 2 10 4l-2 4c-3 2-14 2-16-1z';
const NECK = 'M19 11l4-7 5 .3.5 2-3.6 1.2L22 14z';
const ANTLERS = 'M23 4.5 21.5-1M22 1.5 19.5.5M24.5 4.3 26.5-1M26 1.5 28.5.8';
const LEGS = [
    [6, 15, 2.5, 21],
    [9, 16, 8.5, 22],
    [18, 16, 21.5, 21],
    [20, 15, 24.5, 18],
];

const bob = keyframes`
    from { transform: translateY(-4px) rotate(-1deg); }
    to { transform: translateY(4px) rotate(1deg); }
`;

const climb = keyframes`
    from { transform: translateY(0) rotate(-1deg); }
    to { transform: translateY(-25vh) rotate(-6deg); }
`;

const dust = keyframes`
    0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
    20% { opacity: 1; transform: translate(-2px, 1px) scale(1); }
    100% { opacity: 0; transform: translate(-10px, 9px) scale(0.3); }
`;

const DUST = Array.from({ length: 14 }, (_, i) => ({
    x: -2 - i * 2.8,
    y: 24 + ((i * 7) % 11) - 4,
    r: 0.6 + ((i * 3) % 4) * 0.25,
    delay: (i * 0.11) % 0.9,
}));

const Reindeer: React.FC<{ x: number; rudolph: boolean }> = ({ x, rudolph }) => (
    <g transform={`translate(${x} 10)`}>
        <path d="M4 12.5c-1.5-.8-2.6-.4-3 .4 1 .6 2 .6 3-.4z" fill="#FFFFFF" />
        {LEGS.map(([x1, y1, x2, y2]) => (
            <g key={`${x1}-${y1}`}>
                <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#6E4126" strokeWidth={1.6} strokeLinecap="round" />
                <circle cx={x2} cy={y2} r={0.9} fill="#2B1F1A" />
            </g>
        ))}
        <path d={BODY} fill={BROWN} />
        <path d="M7 14.6c3 1.4 9.5 1.4 12.5 0-3 .3-9.5.3-12.5 0z" fill="#E8CFA8" />
        <path d={NECK} fill={BROWN} />
        <path d={ANTLERS} fill="none" stroke={TAN} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M24 4.6l-2.6-1.2 1.2 2.2z" fill="#8D5A3B" />
        <circle cx={26.6} cy={6} r={1.4} fill="#D9B48C" />
        <circle cx={25.4} cy={4.9} r={0.45} fill="#1E1418" />
        <path d="M8 8.4h11M18.2 9.4c1 2 1 4.4 0 6.4" fill="none" stroke="#C62828" strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={18.9} cy={15.4} r={0.95} fill="#F5C042" stroke="#A8740E" strokeWidth={0.2} />
        <circle cx={13.5} cy={8.4} r={0.8} fill="#F5C042" stroke="#A8740E" strokeWidth={0.2} />
        {rudolph ? (
            <circle cx={28.8} cy={5.6} r={1.5} fill="#FF2D4B" />
        ) : (
            <circle cx={28.6} cy={5.6} r={0.9} fill="#2B1F1A" />
        )}
    </g>
);

const Sleigh: React.FC<{ animated: boolean }> = ({ animated }) => {
    const dark = useTheme().palette.mode === 'dark';

    return (
        <Box sx={{ position: 'relative', width: { xs: 250, sm: 340 } }}>
            <Box
                component="svg"
                viewBox={VIEW}
                sx={{ display: 'block', width: '100%', overflow: 'visible' }}
            >
                <path d="M34.5 18.6 62 18.4M76 18.4h20" fill="none" stroke="#8E1230" strokeWidth={0.6} />
                {REINDEER.map((x, i) => (
                    <Reindeer key={x} x={x} rudolph={i === REINDEER.length - 1} />
                ))}
                <path d={SACK} fill="#C9A06E" />
                <path d="M9.6 13.4h4.4" stroke="#6E4E30" strokeWidth={0.8} strokeLinecap="round" />
                <path d="M10.4 9.6h3.4v3.4h-3.4z" fill="#2FBF71" />
                <path d="M11.8 9.6h.6v3.4h-.6z" fill="#F5C042" />
                <path d={COAT} fill={RED} />
                <path d="M21.4 20.6h11.2v1.4H21.4z" fill="#FFFFFF" />
                <path d="M21.9 18.6h10.2v1.1H21.9z" fill="#1E1418" />
                <path d="M26.2 18.4h1.6v1.5h-1.6z" fill="none" stroke="#F5C042" strokeWidth={0.4} />
                <path d="M30 16.8l4 1.6" stroke="#C62828" strokeWidth={1.6} strokeLinecap="round" />
                <circle cx={34.4} cy={18.6} r={0.9} fill="#1E1418" />
                <circle cx={27} cy={9.9} r={3.4} fill="#F5C9A8" />
                <path d={BEARD} fill="#FFFFFF" />
                <circle cx={28.6} cy={9.2} r={0.35} fill="#1E1418" />
                <circle cx={29.7} cy={10.3} r={0.7} fill="#F28C8C" />
                <path d={HAT} fill={RED} />
                <path d="M23.4 8.3h6.8" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
                <circle cx={22.5} cy={2.8} r={1.4} fill="#FFFFFF" />
                <path d={SLEIGH} fill={RED_SHADE} />
                <path d="M2 22h34l6-6h3" fill="none" stroke={GOLD} strokeWidth={1.2} strokeLinejoin="round" />
                <path d="M9 26.5c2-2 5-2 6 0s4 2 6 0 4-2 6 0" fill="none" stroke={GOLD} strokeWidth={0.7} strokeLinecap="round" />
                <path d={RUNNER} fill="none" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" />
            </Box>
            {animated && (
                <Box component="svg" viewBox={VIEW} sx={{ position: 'absolute', inset: 0, width: '100%', overflow: 'visible' }}>
                    {DUST.map(({ x, y, r, delay }, i) => (
                        <Box
                            key={i}
                            component="circle"
                            cx={x}
                            cy={y}
                            r={r}
                            fill={dark ? '#FFF1C9' : '#E9A93A'}
                            sx={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center', animation: `${dust} 0.9s ease-out ${delay}s infinite` }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

const SleighFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    if (reducedMotion) {
        return (
            <Box onAnimationEnd={handleEnd} sx={{ position: 'absolute', left: '25%', top: '30%', opacity: 0, animation: `${fade} 3s ease-in-out forwards` }}>
                <Sleigh animated={false} />
            </Box>
        );
    }

    return (
        <Box
            onAnimationEnd={handleEnd}
            sx={{ position: 'absolute', left: 0, top: '55%', transform: 'translateX(-20vw)', animation: `${travel} 7.5s linear forwards` }}
        >
            <Box sx={{ animation: `${climb} 7.5s ease-in forwards` }}>
                <Box sx={{ animation: `${bob} 0.9s ease-in-out infinite alternate` }}>
                    <Sleigh animated />
                </Box>
            </Box>
        </Box>
    );
};

export default SleighFlyby;
