import { Box, keyframes, useTheme } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, silhouetteColor, travel, useAllEnded } from '../../motion';

const BRISTLES = 'M14 35.5L2 31 0 38l2 7 12-4.5z';
const ROBE = 'M34 34Q36 22 42 18Q48 22 50 33z';
const HAT = 'M35 12.5Q44 9 53 12.5V14Q44 11 35 14zM38 12l9-.5L36 1z';
const NOSE = 'M46.5 14.5l3.5 1.5-3.5 1z';
const CAPE = 'M39 19Q28 19 19 25Q27 27 33 31z';

const climb = keyframes`
    from { transform: translateY(0) rotate(-2deg); }
    to { transform: translateY(-30vh) rotate(-8deg); }
`;

const bob = keyframes`
    from { transform: translateY(-5px); }
    to { transform: translateY(5px); }
`;

const flutter = keyframes`
    from { transform: skewY(-8deg) scaleX(1); }
    to { transform: skewY(6deg) scaleX(0.85); }
`;

const twinkle = keyframes`
    0%, 100% { opacity: 0; transform: scale(0.4); }
    50% { opacity: 1; transform: scale(1); }
`;

const sparkles = [
    { x: 6, y: 26, delay: 0 },
    { x: -6, y: 34, delay: 0.3 },
    { x: -16, y: 24, delay: 0.6 },
    { x: -26, y: 38, delay: 0.15 },
];

const Witch: React.FC<{ animated: boolean }> = ({ animated }) => {
    const theme = useTheme();
    const motion = (frames: ReturnType<typeof keyframes>, seconds: number, delay = 0) =>
        animated ? `${frames} ${seconds}s ease-in-out ${delay}s infinite alternate` : 'none';

    return (
        <Box
            component="svg"
            viewBox="-30 0 110 50"
            sx={{ display: 'block', width: { xs: 120, sm: 170 }, fill: 'currentColor', overflow: 'visible' }}
        >
            {sparkles.map(({ x, y, delay }, i) => (
                <Box
                    key={i}
                    component="circle"
                    cx={x}
                    cy={y}
                    r={1.4}
                    fill={theme.palette.accent.main}
                    sx={{ transformBox: 'fill-box', transformOrigin: 'center', animation: animated ? `${twinkle} 0.9s ease-in-out ${delay}s infinite` : 'none' }}
                />
            ))}
            <Box component="path" d={CAPE} sx={{ transformBox: 'view-box', transformOrigin: '39px 19px', animation: motion(flutter, 0.25) }} />
            <path d="M6 38L74 30" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
            <path d={BRISTLES} />
            <path d={ROBE} />
            <path d="M45 22l7 9M42 33l7 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            <circle cx={43} cy={15} r={3.5} />
            <path d={NOSE} />
            <path d={HAT} />
        </Box>
    );
};

const WitchFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    if (reducedMotion) {
        return (
            <Box
                onAnimationEnd={handleEnd}
                sx={{ position: 'absolute', left: '40%', top: '30%', opacity: 0, color: silhouetteColor, animation: `${fade} 3s ease-in-out forwards` }}
            >
                <Witch animated={false} />
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
                animation: `${travel} 6.5s linear forwards`,
            }}
        >
            <Box sx={{ animation: `${climb} 6.5s ease-in forwards` }}>
                <Box sx={{ animation: `${bob} 0.8s ease-in-out infinite alternate` }}>
                    <Witch animated />
                </Box>
            </Box>
        </Box>
    );
};

export default WitchFlyby;
