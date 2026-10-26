import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, useAllEnded } from '../../motion';

const LEAF = 'M12 2l1.6 3.4 3-1.2-.6 3.6 3.6-.4-1.8 3.2 3.2 1.4-3.4 1.6 1 3.4-3.6-1-1.2 3.4L12 16.6 10.2 19.4 9 16l-3.6 1 1-3.4L3 12l3.2-1.4L4.4 7.4 8 7.8 7.4 4.2l3 1.2z';

const fall = keyframes`
    from { transform: translateY(-15vh); }
    to { transform: translateY(115vh); }
`;

const sway = keyframes`
    from { transform: translateX(-6vw); }
    to { transform: translateX(6vw); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const leaves = [
    { left: '8%', top: '20%', size: 34, color: '#D35400', delay: 0, duration: 6, sway: 1.6, spin: 3 },
    { left: '22%', top: '55%', size: 26, color: '#C0392B', delay: 0.8, duration: 7, sway: 2, spin: 4 },
    { left: '38%', top: '30%', size: 40, color: '#E67E22', delay: 0.3, duration: 5.5, sway: 1.4, spin: 2.6 },
    { left: '54%', top: '65%', size: 30, color: '#B7950B', delay: 1.2, duration: 6.5, sway: 1.8, spin: 3.4 },
    { left: '70%', top: '25%', size: 36, color: '#D35400', delay: 0.5, duration: 6, sway: 1.5, spin: 2.8 },
    { left: '86%', top: '50%', size: 28, color: '#C0392B', delay: 1.5, duration: 5.8, sway: 2.2, spin: 3.6 },
];

const Leaf: React.FC<{ size: number; color: string }> = ({ size, color }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ display: 'block', width: size }}>
        <path d={LEAF} fill={color} />
        <path d="M12 8v14" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Box>
);

const LeavesFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(leaves.length, onDone);

    return (
        <>
            {leaves.map(({ left, top, size, color, delay, duration, sway: swaySeconds, spin: spinSeconds }, i) =>
                reducedMotion ? (
                    <Box
                        key={i}
                        onAnimationEnd={handleEnd}
                        sx={{ position: 'absolute', left, top, opacity: 0, animation: `${fade} 3s ease-in-out ${delay / 2}s forwards` }}
                    >
                        <Leaf size={size} color={color} />
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
                        <Box sx={{ animation: `${sway} ${swaySeconds}s ease-in-out infinite alternate` }}>
                            <Box sx={{ animation: `${spin} ${spinSeconds}s linear infinite` }}>
                                <Leaf size={size} color={color} />
                            </Box>
                        </Box>
                    </Box>
                ),
            )}
        </>
    );
};

export default LeavesFlyby;
