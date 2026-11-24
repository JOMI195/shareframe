import { useId } from 'react';
import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';

// Fireworks are light, so unlike the flat pieces they glow.
const COLORS = ['#FF4D6D', '#FFD166', '#3BF0A0', '#5AB0FF', '#C77DFF', '#FFFFFF'];
const DURATION = 3.4;

const launch = keyframes`
    0% { transform: translateY(75vh); opacity: 1; }
    34% { transform: translateY(0); opacity: 1; }
    36%, 100% { transform: translateY(0); opacity: 0; }
`;

const flash = keyframes`
    0%, 34% { transform: scale(0); opacity: 0; }
    37% { transform: scale(0.6); opacity: 1; }
    48%, 100% { transform: scale(1.2); opacity: 0; }
`;

const streaks = keyframes`
    0%, 34% { transform: scale(0.05); opacity: 0; }
    36% { opacity: 1; }
    55% { transform: scale(1); opacity: 1; }
    72%, 100% { transform: scale(1.05); opacity: 0; }
`;

const sparks = keyframes`
    0%, 34% { transform: scale(0.05) translateY(0); opacity: 0; }
    36% { opacity: 1; }
    55% { transform: scale(1) translateY(0); opacity: 1; }
    80% { opacity: 0.8; }
    100% { transform: scale(1.08) translateY(14%); opacity: 0; }
`;

const twinkle = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
`;

const SHOTS = [
    { left: { xs: '25%', md: '34%' }, top: '22%', size: 220, color: 0, inner: 1, delay: 0 },
    { left: { xs: '72%', md: '78%' }, top: '16%', size: 250, color: 3, inner: 5, delay: 0.7 },
    { left: { xs: '50%', md: '56%' }, top: '40%', size: 190, color: 4, inner: 1, delay: 1.3 },
    { left: { xs: '30%', md: '88%' }, top: '55%', size: 210, color: 2, inner: 5, delay: 2 },
    { left: { xs: '68%', md: '46%' }, top: '12%', size: 230, color: 1, inner: 0, delay: 2.6 },
];

const ring = (count: number, from: number, to: number, offset = 0) =>
    Array.from({ length: count }, (_, i) => {
        const a = ((i + offset) / count) * Math.PI * 2;
        const [cos, sin] = [Math.cos(a), Math.sin(a)];
        const w = 0.9;
        return {
            streak: `M${cos * from} ${sin * from}L${cos * to - sin * w} ${sin * to + cos * w}L${cos * to + sin * w} ${sin * to - cos * w}z`,
            x: cos * to,
            y: sin * to,
        };
    });

const OUTER = ring(18, 3, 27);
const INNER = ring(10, 2, 15, 0.5);

const glow = (color: string, strong = false) =>
    `drop-shadow(0 0 ${strong ? 3 : 2}px ${color}) drop-shadow(0 0 ${strong ? 9 : 6}px ${color})`;

const Burst: React.FC<{ color: string; inner: string; timing: string; reducedMotion: boolean; onEnd?: React.AnimationEventHandler }> = ({
    color,
    inner,
    timing,
    reducedMotion,
    onEnd,
}) => {
    const id = `fw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const svg = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' } as const;
    const motion = (frames: ReturnType<typeof keyframes>) => (reducedMotion ? 'none' : `${frames} ${timing}`);
    return (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
            <Box
                sx={{
                    position: 'absolute',
                    inset: '30%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, #FFFFFF 0%, ${color} 35%, transparent 70%)`,
                    opacity: 0,
                    animation: motion(flash),
                }}
            />
            <Box component="svg" viewBox="-30 -30 60 60" sx={{ ...svg, filter: glow(color), opacity: reducedMotion ? 1 : 0, animation: motion(streaks) }}>
                <defs>
                    {[
                        [`${id}a`, color],
                        [`${id}b`, inner],
                    ].map(([gid, c]) => (
                        <radialGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={28}>
                            <stop offset="0%" stopColor={c} stopOpacity={0} />
                            <stop offset="45%" stopColor={c} stopOpacity={0.25} />
                            <stop offset="92%" stopColor={c} />
                            <stop offset="100%" stopColor="#FFFFFF" />
                        </radialGradient>
                    ))}
                </defs>
                {OUTER.map(({ streak }) => (
                    <path key={streak} d={streak} fill={`url(#${id}a)`} />
                ))}
                {INNER.map(({ streak }) => (
                    <path key={streak} d={streak} fill={`url(#${id}b)`} />
                ))}
            </Box>
            <Box
                component="svg"
                viewBox="-30 -30 60 60"
                onAnimationEnd={onEnd}
                sx={{ ...svg, filter: glow(color, true), opacity: reducedMotion ? 1 : 0, animation: motion(sparks) }}
            >
                <Box component="g" sx={{ animation: reducedMotion ? 'none' : `${twinkle} 0.25s steps(2) infinite` }}>
                    {OUTER.map(({ x, y }) => (
                        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill="#FFFFFF" />
                    ))}
                </Box>
                {INNER.map(({ x, y }) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill={inner} />
                ))}
            </Box>
        </Box>
    );
};

const Rocket = () => (
    <Box
        sx={{
            position: 'absolute',
            left: -2,
            top: -2,
            width: 4,
            height: 70,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFD166 8%, rgba(255, 140, 50, 0.5) 40%, transparent 100%)',
            filter: 'drop-shadow(0 0 4px #FFD166)',
        }}
    />
);

const FireworksFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(SHOTS.length, onDone);

    return (
        <>
            {SHOTS.map(({ left, top, size, color, inner, delay }) => (
                <Box key={top} sx={{ position: 'absolute', left, top, width: 0, height: 0 }}>
                    {!reducedMotion && (
                        <Box sx={{ position: 'absolute', inset: 0, opacity: 0, animation: `${launch} ${DURATION}s ease-out ${delay}s forwards` }}>
                            <Rocket />
                        </Box>
                    )}
                    <Box
                        sx={{
                            position: 'absolute',
                            width: { xs: size * 0.65, sm: size },
                            transform: 'translate(-50%, -50%)',
                            ...(reducedMotion && { opacity: 0, animation: `${fade} 3s ease-in-out ${delay / 2}s forwards` }),
                        }}
                        onAnimationEnd={reducedMotion ? handleEnd : undefined}
                    >
                        <Burst
                            color={COLORS[color]}
                            inner={COLORS[inner]}
                            timing={`${DURATION}s cubic-bezier(0.2, 0.7, 0.3, 1) ${delay}s forwards`}
                            reducedMotion={reducedMotion}
                            onEnd={reducedMotion ? undefined : handleEnd}
                        />
                    </Box>
                </Box>
            ))}
        </>
    );
};

export default FireworksFlyby;
