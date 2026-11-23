import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, silhouetteColor, travel, useAllEnded } from '../../motion';

const SACK = 'M6 24c-2-5 0-10 5-11 1-2 3-2 4 0 5 1 6 6 5 11z';
const SLEIGH = 'M2 22h34l6-6h3l-6 12c-1 2-3 3-5 3H8c-3 0-5-3-6-9z';
const RUNNER = 'M1 35h38c3 0 5-1 6-4M10 31v4M32 31v4';
const SANTA = 'M21 22q0-8 6-8t6 8zM27 6.5a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 1 1 0-6.8z';
const HAT = 'M23.8 8.4 30 7.6 22.5 2.8z';
const BODY = 'M4 13c0-3 3-5 9-5s9 2 10 4l-2 4c-3 2-14 2-16-1z';
const NECK = 'M19 11l4-7 5 .3.5 2-3.6 1.2L22 14z';
const ANTLERS = 'M23 4.5 21.5-1M22 1.5 19.5.5M24.5 4.3 26.5-1M26 1.5 28.5.8';
const LEGS = 'M6 15 2.5 21M9 16l-.5 6M18 16l3.5 5M20 15l4.5 3';

const bob = keyframes`
    from { transform: translateY(-3px); }
    to { transform: translateY(3px); }
`;

const climb = keyframes`
    from { transform: translateY(0) rotate(-1deg); }
    to { transform: translateY(-25vh) rotate(-6deg); }
`;

const twinkle = keyframes`
    0%, 100% { opacity: 0; transform: scale(0.4); }
    50% { opacity: 1; transform: scale(1); }
`;

const glow = keyframes`
    from { opacity: 0.5; }
    to { opacity: 1; }
`;

const sparkles = [
    { x: -4, y: 26, delay: 0 },
    { x: -12, y: 33, delay: 0.25 },
    { x: -20, y: 24, delay: 0.5 },
    { x: -28, y: 31, delay: 0.15 },
    { x: -36, y: 27, delay: 0.4 },
];

const reindeer = [
    { x: 58, delay: 0 },
    { x: 92, delay: 0.15 },
];

const Reindeer: React.FC<{ x: number; delay: number; nose: boolean; animated: boolean }> = ({ x, delay, nose, animated }) => (
    <g transform={`translate(${x} 10)`}>
        <Box component="g" sx={{ animation: animated ? `${bob} 0.35s ease-in-out ${delay}s infinite alternate` : 'none' }}>
            <path d={BODY} />
            <path d={NECK} />
            <path d={ANTLERS} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
            <path d={LEGS} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
            {nose && (
                <Box
                    component="circle"
                    cx={28.8}
                    cy={5.6}
                    r={1.5}
                    fill="#FF3B30"
                    sx={{ filter: 'drop-shadow(0 0 2px #FF3B30)', animation: animated ? `${glow} 0.5s ease-in-out infinite alternate` : 'none' }}
                />
            )}
        </Box>
    </g>
);

const Sleigh: React.FC<{ animated: boolean }> = ({ animated }) => (
    <Box
        component="svg"
        viewBox="-40 -4 165 44"
        sx={{ display: 'block', width: { xs: 210, sm: 300 }, fill: 'currentColor', overflow: 'visible' }}
    >
        {sparkles.map(({ x, y, delay }, i) => (
            <Box
                key={i}
                component="circle"
                cx={x}
                cy={y}
                r={1.3}
                fill="#FFD54F"
                sx={{ transformBox: 'fill-box', transformOrigin: 'center', animation: animated ? `${twinkle} 0.9s ease-in-out ${delay}s infinite` : 'none' }}
            />
        ))}
        <path d="M32 18 64 22M68 22l30 0" fill="none" stroke="currentColor" strokeWidth={0.8} />
        {reindeer.map(({ x, delay }, i) => (
            <Reindeer key={i} x={x} delay={delay} nose={i === reindeer.length - 1} animated={animated} />
        ))}
        <path d={SACK} />
        <path d={SANTA} />
        <path d={HAT} />
        <circle cx={22.5} cy={2.8} r={1.4} />
        <path d={SLEIGH} />
        <path d={RUNNER} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </Box>
);

const SleighFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    if (reducedMotion) {
        return (
            <Box
                onAnimationEnd={handleEnd}
                sx={{ position: 'absolute', left: '30%', top: '30%', opacity: 0, color: silhouetteColor, animation: `${fade} 3s ease-in-out forwards` }}
            >
                <Sleigh animated={false} />
            </Box>
        );
    }

    return (
        <Box
            onAnimationEnd={handleEnd}
            sx={{
                position: 'absolute',
                left: 0,
                top: '55%',
                color: silhouetteColor,
                transform: 'translateX(-20vw)',
                animation: `${travel} 7s linear forwards`,
            }}
        >
            <Box sx={{ animation: `${climb} 7s ease-in forwards` }}>
                <Sleigh animated />
            </Box>
        </Box>
    );
};

export default SleighFlyby;
