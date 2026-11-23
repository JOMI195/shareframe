import { Box, keyframes, useTheme } from '@mui/material';
import { SNOWFLAKE } from '../icons/snowflakeIcon';

const fall = keyframes`
    from { transform: translateY(-5vh); }
    to { transform: translateY(105vh); }
`;

const sway = keyframes`
    from { transform: translateX(-12px) rotate(-40deg); }
    to { transform: translateX(12px) rotate(40deg); }
`;

const flakes = [
    { left: '4%', size: 6, duration: 14, delay: -2, sway: 3 },
    { left: '13%', size: 4, duration: 18, delay: -11, sway: 4 },
    { left: '22%', size: 7, duration: 15, delay: -6, sway: 3.4 },
    { left: '33%', size: 5, duration: 20, delay: -15, sway: 4.4 },
    { left: '44%', size: 4, duration: 16, delay: -3, sway: 3.8 },
    { left: '53%', size: 6, duration: 19, delay: -9, sway: 3.2 },
    { left: '62%', size: 5, duration: 14, delay: -12, sway: 4.2 },
    { left: '71%', size: 7, duration: 17, delay: -1, sway: 3.6 },
    { left: '80%', size: 4, duration: 21, delay: -7, sway: 4.6 },
    { left: '89%', size: 6, duration: 15, delay: -13, sway: 3 },
    { left: '96%', size: 5, duration: 18, delay: -5, sway: 4 },
];

// White dots vanish on the light theme, so it gets small crystals instead.
const Flake: React.FC<{ size: number; dark: boolean }> = ({ size, dark }) =>
    dark ? (
        <Box sx={{ width: size, height: size, borderRadius: '50%', bgcolor: '#FFFFFF', opacity: 0.7 }} />
    ) : (
        <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size * 2.2, opacity: 0.75 }}>
            <path d={SNOWFLAKE} fill="none" stroke="#7FA9D4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Box>
    );

const Snowfall = () => {
    const dark = useTheme().palette.mode === 'dark';
    return (
        <Box sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
            {flakes.map(({ left, size, duration, delay, sway: swaySeconds }, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left,
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
