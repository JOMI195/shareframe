import { Box, keyframes } from '@mui/material';
import { PARTY } from '../palette';

const fall = keyframes`
    from { transform: translateY(-5vh); }
    to { transform: translateY(105vh); }
`;

const sway = keyframes`
    from { transform: translateX(-14px) rotate(-40deg); }
    to { transform: translateX(14px) rotate(40deg); }
`;

const flip = keyframes`
    from { transform: rotateX(0deg) rotateY(0deg); }
    to { transform: rotateX(360deg) rotateY(180deg); }
`;

const LEFTS = [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68, 73, 78, 83, 88, 93, 97];

const pieces = LEFTS.map((left, i) => ({
    left: `${left}%`,
    round: i % 4 === 3,
    width: i % 4 === 3 ? 9 : 7 + (i % 3) * 2,
    height: i % 4 === 3 ? 9 : 12 + (i % 2) * 4,
    color: PARTY[i % PARTY.length],
    duration: 14 + (i % 5) * 3,
    delay: -((i * 5) % 17),
    sway: 2.6 + (i % 3) * 0.6,
    flip: 1.4 + (i % 4) * 0.35,
}));

const Confetti = () => (
    <Box sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
        {pieces.map(({ left, round, width, height, color: [light, body, shade], duration, delay, sway: swaySeconds, flip: flipSeconds }, i) => (
            <Box
                key={i}
                sx={{ position: 'absolute', top: 0, left, opacity: 0.9, willChange: 'transform', animation: `${fall} ${duration}s linear ${delay}s infinite` }}
            >
                <Box sx={{ animation: `${sway} ${swaySeconds}s ease-in-out ${delay}s infinite alternate` }}>
                    <Box
                        sx={{
                            width,
                            height,
                            borderRadius: round ? '50%' : '1px',
                            background: `linear-gradient(135deg, ${light}, ${body} 45%, ${shade})`,
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
                            animation: `${flip} ${flipSeconds}s linear ${delay}s infinite`,
                        }}
                    />
                </Box>
            </Box>
        ))}
    </Box>
);

export default Confetti;
