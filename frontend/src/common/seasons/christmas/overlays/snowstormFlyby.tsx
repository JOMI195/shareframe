import { Box, keyframes, useTheme } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { SNOWFLAKE } from '../palette';

const fall = keyframes`
    from { transform: translateY(-15vh); }
    to { transform: translateY(115vh); }
`;

const drift = keyframes`
    from { transform: translateX(-7vw); }
    to { transform: translateX(7vw); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const flakes = [
    { left: '5%', top: '20%', size: 30, delay: 0, duration: 5.5, drift: 1.4, spin: 4 },
    { left: '16%', top: '60%', size: 22, delay: 0.7, duration: 6.5, drift: 1.8, spin: 5 },
    { left: '27%', top: '35%', size: 38, delay: 0.2, duration: 5, drift: 1.3, spin: 3.4 },
    { left: '39%', top: '70%', size: 26, delay: 1.1, duration: 6, drift: 1.6, spin: 4.6 },
    { left: '50%', top: '25%', size: 34, delay: 0.4, duration: 5.8, drift: 1.5, spin: 3.8 },
    { left: '61%', top: '55%', size: 20, delay: 1.4, duration: 6.8, drift: 2, spin: 5.4 },
    { left: '72%', top: '30%', size: 32, delay: 0.6, duration: 5.4, drift: 1.4, spin: 4.2 },
    { left: '83%', top: '65%', size: 24, delay: 1, duration: 6.2, drift: 1.9, spin: 4.8 },
    { left: '93%', top: '40%', size: 28, delay: 0.3, duration: 5.6, drift: 1.7, spin: 3.6 },
];

const Flake: React.FC<{ size: number; color: string }> = ({ size, color }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size, filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' }}>
        <path d={SNOWFLAKE} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Box>
);

const SnowstormFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(flakes.length, onDone);
    const colors = useTheme().palette.mode === 'dark' ? ['#FFFFFF', '#CFE8FF'] : ['#7FB2E0', '#5B95CC'];

    return (
        <>
            {flakes.map(({ left, top, size, delay, duration, drift: driftSeconds, spin: spinSeconds }, i) =>
                reducedMotion ? (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{ position: 'absolute', left, top, opacity: 0, animation: `${fade} 3s ease-in-out ${delay / 2}s forwards` }}
                    >
                        <Flake size={size} color={colors[i % colors.length]} />
                    </Box>
                ) : (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{
                            position: 'absolute',
                            left,
                            top: 0,
                            transform: 'translateY(-15vh)',
                            animation: `${fall} ${duration}s linear ${delay}s forwards`,
                        }}
                    >
                        <Box sx={{ animation: `${drift} ${driftSeconds}s ease-in-out infinite alternate` }}>
                            <Box sx={{ animation: `${spin} ${spinSeconds}s linear infinite` }}>
                                <Flake size={size} color={colors[i % colors.length]} />
                            </Box>
                        </Box>
                    </Box>
                ),
            )}
        </>
    );
};

export default SnowstormFlyby;
