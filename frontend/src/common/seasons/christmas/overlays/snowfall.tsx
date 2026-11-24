import { Box, keyframes, useTheme } from '@mui/material';
import { SNOWFLAKE } from '../icons/snowflakeIcon';
import { ICE } from '../palette';

const fall = keyframes`
    from { transform: translateY(-5vh); }
    to { transform: translateY(105vh); }
`;

const sway = keyframes`
    from { transform: translateX(-10px) rotate(-35deg); }
    to { transform: translateX(10px) rotate(35deg); }
`;

// Far flakes are small, faint and slow, near ones bigger and faster, which gives depth.
const LAYERS = [
    { size: 3, opacity: 0.4, duration: 30, lefts: [3, 15, 27, 39, 51, 63, 75, 87, 96] },
    { size: 5, opacity: 0.65, duration: 20, lefts: [9, 22, 36, 57, 70, 83, 92] },
    { size: 8, opacity: 0.85, duration: 13, lefts: [18, 46, 66, 88] },
];

const flakes = LAYERS.flatMap(({ size, opacity, duration, lefts }, layer) =>
    lefts.map((left, i) => ({
        left: `${left}%`,
        size,
        opacity,
        duration: duration + (i % 3) * 2,
        delay: -((i * 7 + layer * 5) % duration),
        sway: 3 + ((i + layer) % 3) * 0.7,
    })),
);

const Flake: React.FC<{ size: number; dark: boolean }> = ({ size, dark }) =>
    dark ? (
        <Box
            sx={{
                width: size * 2,
                height: size * 2,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0 30%, rgba(255, 255, 255, 0.35) 45%, transparent 70%)',
            }}
        />
    ) : (
        <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size * 2.4, overflow: 'visible' }}>
            <circle cx={12} cy={12} r={9} fill="rgba(141, 182, 224, 0.12)" />
            <path d={SNOWFLAKE} fill="none" stroke={ICE} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </Box>
    );

const Snowfall = () => {
    const dark = useTheme().palette.mode === 'dark';
    return (
        <Box sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
            {flakes.map(({ left, size, opacity, duration, delay, sway: swaySeconds }, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left,
                        opacity,
                        willChange: 'transform',
                        animation: `${fall} ${duration}s linear ${delay}s infinite`,
                    }}
                >
                    <Box sx={{ animation: `${sway} ${swaySeconds}s ease-in-out ${delay}s infinite alternate` }}>
                        <Flake size={size} dark={dark} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default Snowfall;
