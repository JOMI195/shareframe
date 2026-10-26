import { Box, keyframes } from '@mui/material';
import type { FlybyProps } from '../../seasons';
import { fade, travel, useAllEnded } from '../../motion';

const BODY = 'M12 2C7.6 2 5 5.3 5 9.5V21l2.3-1.6L9.7 21l2.3-1.6 2.3 1.6 2.4-1.6L19 21V9.5C19 5.3 16.4 2 12 2z';

const wave = keyframes`
    from { transform: translateY(-4vh) rotate(-8deg); }
    to { transform: translateY(4vh) rotate(8deg); }
`;

// Fades in and out as if passing through walls.
const phase = keyframes`
    from { opacity: 0.3; }
    to { opacity: 0.9; }
`;

const Ghost = () => (
    <Box
        component="svg"
        viewBox="0 0 24 24"
        sx={{ display: 'block', width: { xs: 90, sm: 130 }, filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))' }}
    >
        <path d={BODY} fill="#FFFFFF" />
        <g fill="#2B1F36">
            <ellipse cx={9.5} cy={9.8} rx={1.3} ry={1.6} />
            <ellipse cx={14.5} cy={9.8} rx={1.3} ry={1.6} />
            <ellipse cx={12} cy={14.5} rx={1.4} ry={1.9} />
        </g>
    </Box>
);

const GhostFlyby: React.FC<FlybyProps> = ({ onDone, reducedMotion }) => {
    const handleEnd = useAllEnded(1, onDone);

    if (reducedMotion) {
        return (
            <Box
                onAnimationEnd={handleEnd}
                sx={{ position: 'absolute', left: '45%', top: '35%', opacity: 0, animation: `${fade} 3s ease-in-out forwards` }}
            >
                <Ghost />
            </Box>
        );
    }

    return (
        <Box
            onAnimationEnd={handleEnd}
            sx={{
                position: 'absolute',
                left: 0,
                top: '35%',
                transform: 'translateX(120vw)',
                animation: `${travel} 7s linear reverse forwards`,
            }}
        >
            <Box sx={{ animation: `${wave} 1.2s ease-in-out infinite alternate` }}>
                <Box sx={{ animation: `${phase} 0.9s ease-in-out infinite alternate` }}>
                    <Ghost />
                </Box>
            </Box>
        </Box>
    );
};

export default GhostFlyby;
