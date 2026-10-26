import { Box, keyframes, useTheme } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, silhouetteColor, travel, useAllEnded } from '../../motion';

const LEFT_WING = 'M29 17C22 10 12 8 2 12C6 14 7 18 6 22C10 19 14 20 16 24C19 20 23 21 26 25C27 22 28 21 29 22Z';
const RIGHT_WING = 'M35 17C42 10 52 8 62 12C58 14 57 18 58 22C54 19 50 20 48 24C45 20 41 21 38 25C37 22 36 21 35 22Z';
const HEAD = 'M29.2 13.5L28.6 6.5 31 10C31.6 9.8 32.4 9.8 33 10L35.4 6.5 34.8 13.5A3.6 3.6 0 1 1 29.2 13.5Z';

const arc = keyframes`
    0% { transform: translateY(0); }
    50% { transform: translateY(var(--arc)); }
    100% { transform: translateY(calc(var(--arc) / 3)); }
`;

const bob = keyframes`
    from { transform: translateY(-6px) rotate(-4deg); }
    to { transform: translateY(6px) rotate(4deg); }
`;

const flapLeft = keyframes`
    from { transform: rotate(22deg) scaleY(1); }
    to { transform: rotate(-28deg) scaleY(0.7); }
`;

const flapRight = keyframes`
    from { transform: rotate(-22deg) scaleY(1); }
    to { transform: rotate(28deg) scaleY(0.7); }
`;

const bats = [
    { top: '22%', left: '18%', width: 84, delay: 0, duration: 5, arc: '-12vh', flap: 0.2 },
    { top: '34%', left: '55%', width: 64, delay: 0.6, duration: 5.6, arc: '-18vh', flap: 0.17 },
    { top: '16%', left: '78%', width: 52, delay: 1.1, duration: 4.6, arc: '-6vh', flap: 0.15 },
];

const wing = (flap: string, origin: string, seconds: number | null) => ({
    transformBox: 'view-box',
    transformOrigin: origin,
    animation: seconds ? `${flap} ${seconds}s ease-in-out infinite alternate` : 'none',
});

const Bat: React.FC<{ width: number; flap: number | null }> = ({ width, flap }) => {
    const theme = useTheme();
    return (
        <Box
            component="svg"
            viewBox="0 0 64 40"
            sx={{ display: 'block', width: { xs: width * 0.75, sm: width }, fill: 'currentColor' }}
        >
            <Box component="path" d={LEFT_WING} sx={wing(flapLeft, '29px 19px', flap)} />
            <Box component="path" d={RIGHT_WING} sx={wing(flapRight, '35px 19px', flap)} />
            <ellipse cx={32} cy={21} rx={4} ry={7} />
            <path d={HEAD} />
            <circle cx={30.7} cy={13} r={0.8} fill={theme.palette.accent.main} />
            <circle cx={33.3} cy={13} r={0.8} fill={theme.palette.accent.main} />
        </Box>
    );
};

const BatsFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(bats.length, onDone);

    return (
        <Box sx={{ color: silhouetteColor }}>
            {bats.map(({ top, left, width, delay, duration, arc: arcHeight, flap }, i) =>
                reducedMotion ? (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{ position: 'absolute', left, top, opacity: 0, animation: `${fade} 3s ease-in-out ${delay}s forwards` }}
                    >
                        <Bat width={width} flap={null} />
                    </Box>
                ) : (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            top,
                            transform: 'translateX(-20vw)',
                            animation: `${travel} ${duration}s linear ${delay}s forwards`,
                        }}
                    >
                        <Box sx={{ '--arc': arcHeight, animation: `${arc} ${duration}s ease-in-out ${delay}s forwards` }}>
                            <Box sx={{ animation: `${bob} ${duration / 4}s ease-in-out infinite alternate` }}>
                                <Bat width={width} flap={flap} />
                            </Box>
                        </Box>
                    </Box>
                ),
            )}
        </Box>
    );
};

export default BatsFlyby;
