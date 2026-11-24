import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { BLUE, GOLD, GREEN, GREEN_SHADE, RED, RED_SHADE } from '../palette';

const drop = keyframes`
    from { transform: translateY(-20vh); }
    to { transform: translateY(120vh); }
`;

const wobble = keyframes`
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
`;

const gifts = [
    { left: '10%', top: '30%', size: 52, box: [RED, RED_SHADE], ribbon: GOLD, delay: 0, duration: 3.6 },
    { left: '30%', top: '50%', size: 40, box: [GREEN, GREEN_SHADE], ribbon: RED, delay: 0.5, duration: 4.2 },
    { left: '52%', top: '25%', size: 60, box: [BLUE, '#2F64C2'], ribbon: '#FFFFFF', delay: 0.2, duration: 3.4 },
    { left: '72%', top: '45%', size: 44, box: ['#A35CF0', '#7438C2'], ribbon: GOLD, delay: 0.8, duration: 4 },
    { left: '88%', top: '35%', size: 36, box: [GOLD, '#D99A1C'], ribbon: RED, delay: 0.4, duration: 3.8 },
];

const Present: React.FC<{ size: number; box: string[]; ribbon: string }> = ({ size, box: [body, shade], ribbon }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size }}>
        <path d="M4 11h16v10H4z" fill={body} />
        <path d="M15 11h5v10h-5z" fill={shade} />
        <path d="M3 7.5h18V11H3z" fill={body} />
        <path d="M4 11h16v.8H4z" fill={shade} />
        <path d="M10.8 7.5h2.4V21h-2.4z" fill={ribbon} />
        <path d="M12 7.5C10.5 4 7.5 3.2 7 5c-.4 1.5 2 2.5 5 2.5zM12 7.5c1.5-3.5 4.5-4.3 5-2.5.4 1.5-2 2.5-5 2.5z" fill={ribbon} />
    </Box>
);

const GiftDropFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(gifts.length, onDone);

    return (
        <>
            {gifts.map(({ left, top, size, box, ribbon, delay, duration }, i) =>
                reducedMotion ? (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{ position: 'absolute', left, top, opacity: 0, animation: `${fade} 3s ease-in-out ${delay / 2}s forwards` }}
                    >
                        <Present size={size} box={box} ribbon={ribbon} />
                    </Box>
                ) : (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{
                            position: 'absolute',
                            left,
                            top: 0,
                            transform: 'translateY(-20vh)',
                            animation: `${drop} ${duration}s cubic-bezier(0.5, 0, 0.9, 0.6) ${delay}s forwards`,
                        }}
                    >
                        <Box sx={{ animation: `${wobble} 0.45s ease-in-out infinite alternate` }}>
                            <Present size={size} box={box} ribbon={ribbon} />
                        </Box>
                    </Box>
                ),
            )}
        </>
    );
};

export default GiftDropFlyby;
