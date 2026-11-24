import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';
import { url, useSvgIds } from '../svgIds';

const drop = keyframes`
    from { transform: translateY(-20vh); }
    to { transform: translateY(120vh); }
`;

const wobble = keyframes`
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
`;

const gifts = [
    { left: '10%', top: '30%', size: 52, box: ['#F0506E', '#8E1230'], ribbon: ['#FFF0B8', '#C9971E'], delay: 0, duration: 3.6 },
    { left: '30%', top: '50%', size: 40, box: ['#3FCB8A', '#0F4A36'], ribbon: ['#FFC2CC', '#C2253F'], delay: 0.5, duration: 4.2 },
    { left: '52%', top: '25%', size: 60, box: ['#6FA8FF', '#1F56B8'], ribbon: ['#FFFFFF', '#C9D6E4'], delay: 0.2, duration: 3.4 },
    { left: '72%', top: '45%', size: 44, box: ['#B58CFF', '#5B2DB3'], ribbon: ['#FFF0B8', '#C9971E'], delay: 0.8, duration: 4 },
    { left: '88%', top: '35%', size: 36, box: ['#FFD36B', '#C2810F'], ribbon: ['#FFC2CC', '#C2253F'], delay: 0.4, duration: 3.8 },
];

const Present: React.FC<{ size: number; box: string[]; ribbon: string[] }> = ({ size, box, ribbon }) => {
    const ids = useSvgIds('box', 'lid', 'ribbon');
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size, filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3))' }}>
            <defs>
                <linearGradient id={ids.box} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={box[0]} />
                    <stop offset="100%" stopColor={box[1]} />
                </linearGradient>
                <linearGradient id={ids.lid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={ids.ribbon} x1="0" x2="1">
                    <stop offset="0%" stopColor={ribbon[1]} />
                    <stop offset="50%" stopColor={ribbon[0]} />
                    <stop offset="100%" stopColor={ribbon[1]} />
                </linearGradient>
            </defs>
            <path d="M4 11h16v10H4z" fill={url(ids.box)} />
            <path d="M3 7.5h18V11H3z" fill={url(ids.box)} />
            <path d="M3 7.5h18V11H3z" fill={url(ids.lid)} />
            <path d="M3 10.6h18v.8H3z" fill="#000000" opacity={0.18} />
            <path d="M10.8 7.5h2.4V21h-2.4z" fill={url(ids.ribbon)} />
            <path d="M12 7.5C10.5 4 7.5 3.2 7 5c-.4 1.5 2 2.5 5 2.5zM12 7.5c1.5-3.5 4.5-4.3 5-2.5.4 1.5-2 2.5-5 2.5z" fill={url(ids.ribbon)} />
            <path d="M5 12.2l2.6-1v8.8L5 21z" fill="#FFFFFF" opacity={0.16} />
        </Box>
    );
};

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
