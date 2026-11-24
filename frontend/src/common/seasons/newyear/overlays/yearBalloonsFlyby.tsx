import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { BLUE, GOLD, GOLD_SHADE, GREEN, PURPLE, RED } from '../palette';
import { newYearNumber } from '../year';

const rise = keyframes`
    from { transform: translateY(0); }
    to { transform: translateY(-135vh); }
`;

const sway = keyframes`
    from { transform: rotate(-6deg); }
    to { transform: rotate(6deg); }
`;

const DIGITS = [
    { left: '22%', delay: 0.2, duration: 6.5 },
    { left: '38%', delay: 0, duration: 6.2 },
    { left: '54%', delay: 0.3, duration: 6.6 },
    { left: '70%', delay: 0.1, duration: 6.3 },
];

const ROUND = [
    { left: '8%', color: RED, delay: 0.6, duration: 7 },
    { left: '30%', color: BLUE, delay: 1.2, duration: 7.4 },
    { left: '62%', color: GREEN, delay: 0.9, duration: 7.2 },
    { left: '86%', color: PURPLE, delay: 0.4, duration: 6.8 },
];

const Digit: React.FC<{ digit: string }> = ({ digit }) => (
    <Box component="svg" viewBox="0 0 30 56" sx={{ display: 'block', width: { xs: 54, sm: 80 }, overflow: 'visible' }}>
        <path d="M15 32q-3 8 0 12t0 12" fill="none" stroke={GOLD_SHADE} strokeWidth={0.6} />
        <text x={15} y={30} textAnchor="middle" fontSize={34} fontWeight={900} fontFamily="inherit" fill={GOLD} stroke={GOLD_SHADE} strokeWidth={2} strokeLinejoin="round" paintOrder="stroke">
            {digit}
        </text>
    </Box>
);

const Round: React.FC<{ color: string }> = ({ color }) => (
    <Box component="svg" viewBox="0 0 30 56" sx={{ display: 'block', width: { xs: 40, sm: 56 }, overflow: 'visible' }}>
        <path d="M15 30q-3 8 0 13t0 13" fill="none" stroke={color} strokeWidth={0.6} />
        <path d="M13.2 30.6h3.6L15 27.4z" fill={color} />
        <ellipse cx={15} cy={15} rx={11} ry={13} fill={color} />
    </Box>
);

const YearBalloonsFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const digits = String(newYearNumber(new Date())).split('');
    const pieces = [
        ...DIGITS.map((spot, i) => ({ ...spot, child: <Digit digit={digits[i]} /> })),
        ...ROUND.map(({ color, ...spot }) => ({ ...spot, child: <Round color={color} /> })),
    ];
    const handleEnd = useAllEnded(pieces.length, onDone);

    return (
        <>
            {pieces.map(({ left, delay, duration, child }, i) => (
                <Box
                    key={i}
                    onAnimationEnd={handleEnd}
                    sx={
                        reducedMotion
                            ? { position: 'absolute', left, top: '35%', opacity: 0, animation: `${fade} 3s ease-in-out ${delay / 2}s forwards` }
                            : { position: 'absolute', left, top: '100%', animation: `${rise} ${duration}s ease-in ${delay}s forwards` }
                    }
                >
                    <Box sx={{ transformOrigin: '50% 100%', animation: reducedMotion ? 'none' : `${sway} ${1.6 + (i % 3) * 0.3}s ease-in-out infinite alternate` }}>
                        {child}
                    </Box>
                </Box>
            ))}
        </>
    );
};

export default YearBalloonsFlyby;
