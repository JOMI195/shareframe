import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, travel, useAllEnded } from '../../motion';

const STAR = 'M12 0l1.8 9.4L24 12l-10.2 2.6L12 24l-1.8-9.4L0 12l10.2-2.6z';
const GOLD = '#FFD54F';
const DURATION = 4.5;

const dive = keyframes`
    from { transform: translateY(0); }
    to { transform: translateY(40vh); }
`;

const spin = keyframes`
    from { transform: rotate(0deg) scale(0.85); }
    50% { transform: rotate(180deg) scale(1.15); }
    to { transform: rotate(360deg) scale(0.85); }
`;

const flicker = keyframes`
    0%, 100% { transform: rotate(-16deg) scaleX(1); opacity: 1; }
    30% { transform: rotate(-16deg) scaleX(0.8); opacity: 0.75; }
    60% { transform: rotate(-16deg) scaleX(1.15); opacity: 0.95; }
`;

const twinkle = keyframes`
    0%, 100% { opacity: 0; transform: translateY(0) scale(0.3); }
    40% { opacity: 1; transform: translateY(4px) scale(1); }
    80% { opacity: 0.4; transform: translateY(12px) scale(0.6); }
`;

const sparkles = [
    { x: -28, y: -8, size: 10, delay: 0 },
    { x: -52, y: -15, size: 8, delay: 0.2 },
    { x: -74, y: -20, size: 11, delay: 0.45 },
    { x: -98, y: -28, size: 7, delay: 0.1 },
    { x: -120, y: -34, size: 9, delay: 0.35 },
    { x: -146, y: -40, size: 6, delay: 0.55 },
];

const Sparkle: React.FC<{ size: number }> = ({ size }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size }}>
        <path d={STAR} fill="#FFF3C4" stroke="#F9A825" strokeWidth={1} />
    </Box>
);

const Star: React.FC<{ animated: boolean }> = ({ animated }) => (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Box
            sx={{
                position: 'absolute',
                right: '50%',
                width: { xs: 160, sm: 240 },
                height: 5,
                borderRadius: 3,
                background: `linear-gradient(90deg, transparent, ${GOLD} 70%, #FFB300)`,
                boxShadow: `0 0 8px ${GOLD}`,
                transform: 'rotate(-16deg)',
                transformOrigin: '100% 50%',
                animation: animated ? `${flicker} 0.5s ease-in-out infinite` : 'none',
            }}
        />
        {animated &&
            sparkles.map(({ x, y, size, delay }, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        opacity: 0,
                        animation: `${twinkle} 0.8s ease-out ${delay}s infinite`,
                    }}
                >
                    <Sparkle size={size} />
                </Box>
            ))}
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{
                display: 'block',
                width: { xs: 48, sm: 64 },
                filter: `drop-shadow(0 0 8px ${GOLD}) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))`,
                animation: animated ? `${spin} 1.4s linear infinite` : 'none',
            }}
        >
            <path d={STAR} fill={GOLD} stroke="#F57F17" strokeWidth={0.6} strokeLinejoin="round" />
            <circle cx={12} cy={12} r={2.4} fill="#FFFFFF" />
        </Box>
    </Box>
);

const ShootingStarFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    if (reducedMotion) {
        return (
            <Box
                onAnimationEnd={handleEnd}
                sx={{ position: 'absolute', left: '50%', top: '25%', opacity: 0, animation: `${fade} 3s ease-in-out forwards` }}
            >
                <Star animated={false} />
            </Box>
        );
    }

    return (
        <Box
            onAnimationEnd={handleEnd}
            sx={{
                position: 'absolute',
                left: 0,
                top: '8%',
                transform: 'translateX(-20vw)',
                animation: `${travel} ${DURATION}s cubic-bezier(0.25, 0, 0.75, 1) forwards`,
            }}
        >
            <Box sx={{ animation: `${dive} ${DURATION}s ease-in forwards` }}>
                <Star animated />
            </Box>
        </Box>
    );
};

export default ShootingStarFlyby;
