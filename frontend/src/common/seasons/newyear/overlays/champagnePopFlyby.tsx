import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { BOTTLE, BOTTLE_SHADE, CHAMPAGNE, GOLD, GOLD_SHADE } from '../palette';

const DURATION = 3.8;
const GLASS = 'M12 6h6v14c0 4 7 6 7 12v28H5V32c0-6 7-8 7-12z';
const GLASS_SHADE = 'M18 6v14c0 4 7 6 7 12v28h-5V32c0-6-2-8-2-12z';
const FOIL = 'M11.4 5h7.2v11.2c0 1.2-1.4 2-3.6 2s-3.6-.8-3.6-2z';
const CORK = 'M10.6 5.4c0-3 1.8-4.6 4.4-4.6s4.4 1.6 4.4 4.6z';
const FOAM = [
    { dx: -14, dy: -70, r: 9 },
    { dx: 8, dy: -95, r: 10 },
    { dx: 24, dy: -65, r: 8 },
    { dx: -2, dy: -125, r: 8 },
    { dx: 18, dy: -115, r: 7 },
    { dx: -22, dy: -100, r: 6 },
    { dx: 4, dy: -55, r: 7 },
];

const rise = keyframes`
    0% { transform: rotate(22deg) translateY(110%); }
    18%, 82% { transform: rotate(22deg) translateY(12%); }
    100% { transform: rotate(22deg) translateY(110%); }
`;

const corkX = keyframes`
    0%, 26% { transform: translateX(0); }
    70%, 100% { transform: translateX(30vw); }
`;

const corkY = keyframes`
    0%, 26% { transform: translateY(0) rotate(0deg); opacity: 1; }
    66% { opacity: 1; }
    70%, 100% { transform: translateY(-90vh) rotate(720deg); opacity: 0; }
`;

const spray = (dx: number, dy: number) => keyframes`
    0%, 27% { transform: translate(0, 0) scale(0.3); opacity: 0; }
    32% { opacity: 1; }
    60%, 100% { transform: translate(${dx}px, ${dy}px) scale(1); opacity: 0; }
`;

const FOAM_MOTION = FOAM.map(({ dx, dy }) => spray(dx, dy));

const ChampagnePopFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    return (
        <Box
            onAnimationEnd={handleEnd}
            sx={{
                position: 'absolute',
                bottom: 0,
                left: { xs: '12%', md: '35%' },
                width: { xs: 90, sm: 120 },
                transformOrigin: '50% 100%',
                transform: 'rotate(22deg) translateY(110%)',
                animation: reducedMotion ? `${fade} 3s ease-in-out forwards` : `${rise} ${DURATION}s ease-in-out forwards`,
                ...(reducedMotion && { transform: 'rotate(22deg) translateY(12%)', opacity: 0 }),
            }}
        >
            {!reducedMotion &&
                FOAM.map(({ r }, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '4%',
                            width: r * 2,
                            height: r * 2,
                            ml: `${-r}px`,
                            borderRadius: '50%',
                            bgcolor: i % 2 ? '#FFFFFF' : CHAMPAGNE,
                            opacity: 0,
                            animation: `${FOAM_MOTION[i]} ${DURATION}s ease-out forwards`,
                        }}
                    />
                ))}
            <Box sx={{ position: 'absolute', left: 0, top: 0, width: '100%', animation: reducedMotion ? 'none' : `${corkX} ${DURATION}s linear forwards` }}>
                <Box sx={{ animation: reducedMotion ? 'none' : `${corkY} ${DURATION}s cubic-bezier(0.2, 0.9, 0.4, 1) forwards` }}>
                    <Box component="svg" viewBox="0 0 30 60" sx={{ display: 'block', width: '100%', overflow: 'visible' }}>
                        <path d={CORK} fill="#D9B48C" />
                    </Box>
                </Box>
            </Box>
            <Box component="svg" viewBox="0 0 30 60" sx={{ display: 'block', width: '100%', overflow: 'visible' }}>
                <path d={GLASS} fill={BOTTLE} />
                <path d={GLASS_SHADE} fill={BOTTLE_SHADE} />
                <path d={FOIL} fill={GOLD} />
                <path d="M15 5h3.6v11.2c0 1.2-1.4 2-3.6 2z" fill={GOLD_SHADE} />
                <path d="M10.6 17.2h8.8v2h-8.8z" fill={GOLD} />
            </Box>
        </Box>
    );
};

export default ChampagnePopFlyby;
