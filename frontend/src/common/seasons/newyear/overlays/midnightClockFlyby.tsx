import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { AlarmClock } from '../art/midnightClockArt';
import { INK, PARTY } from '../palette';

const DURATION = 4.2;

const pop = keyframes`
    0% { transform: scale(0); }
    12% { transform: scale(1.08); }
    16%, 84% { transform: scale(1); }
    100% { transform: scale(0); }
`;

const ring = keyframes`
    0%, 42%, 66%, 100% { transform: rotate(0deg); }
    46%, 54%, 62% { transform: rotate(-8deg); }
    50%, 58% { transform: rotate(8deg); }
`;

const minute = keyframes`
    0%, 16% { transform: rotate(-90deg); }
    40%, 100% { transform: rotate(0deg); }
`;

const hour = keyframes`
    0%, 16% { transform: rotate(-8deg); }
    40%, 100% { transform: rotate(0deg); }
`;

const PIECES = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return { dx: Math.cos(a) * (130 + (i % 3) * 30), dy: Math.sin(a) * (110 + (i % 2) * 30), color: PARTY[i % PARTY.length][0] };
});

const burst = (dx: number, dy: number) => keyframes`
    0%, 42% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
    44% { opacity: 1; }
    62% { transform: translate(${dx}px, ${dy}px) rotate(220deg); opacity: 1; }
    92%, 100% { transform: translate(${dx}px, ${dy + 90}px) rotate(400deg); opacity: 0; }
`;

const BURSTS = PIECES.map(({ dx, dy }) => burst(dx, dy));

const turning = (frames: ReturnType<typeof keyframes>) => ({
    transformBox: 'view-box',
    transformOrigin: '12px 12px',
    animation: `${frames} ${DURATION}s ease-in-out forwards`,
});

const MidnightClockFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    return (
        <Box sx={{ position: 'absolute', left: '50%', top: '40%', width: 0, height: 0 }}>
            {!reducedMotion &&
                PIECES.map(({ color }, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            left: -4,
                            top: -6,
                            width: 8,
                            height: 12,
                            borderRadius: '1px',
                            bgcolor: color,
                            opacity: 0,
                            animation: `${BURSTS[i]} ${DURATION}s ease-out forwards`,
                        }}
                    />
                ))}
            <Box
                onAnimationEnd={handleEnd}
                sx={{
                    position: 'absolute',
                    width: { xs: 150, sm: 200 },
                    transform: 'translate(-50%, -50%)',
                    ...(reducedMotion && { opacity: 0, animation: `${fade} 3s ease-in-out forwards` }),
                }}
            >
                <Box sx={reducedMotion ? undefined : { transform: 'scale(0)', animation: `${pop} ${DURATION}s ease-out forwards` }}>
                    <Box sx={reducedMotion ? undefined : { animation: `${ring} ${DURATION}s linear forwards` }}>
                        <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: '100%' }}>
                            <AlarmClock
                                hands={
                                    <>
                                        <Box component="path" d="M12 12V8.2" stroke={INK} strokeWidth={1.4} strokeLinecap="round" sx={reducedMotion ? undefined : turning(hour)} />
                                        <Box component="path" d="M12 12V6" stroke={INK} strokeWidth={1} strokeLinecap="round" sx={reducedMotion ? undefined : turning(minute)} />
                                    </>
                                }
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default MidnightClockFlyby;
