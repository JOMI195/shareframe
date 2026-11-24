import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { BLUE, BLUE_SHADE, GOLD, GOLD_SHADE, RED, RED_SHADE } from '../palette';

const CONE = 'M4.8 19.6 12 4.2l7.2 15.4c-2.2 1.3-4.6 1.8-7.2 1.8s-5-.5-7.2-1.8z';
const SHADE = 'M12 4.2l7.2 15.4c-1.6 1-3.4 1.5-5.2 1.7z';
const RIM = 'M4.3 19.1c2.4 1.6 4.9 2.3 7.7 2.3s5.3-.7 7.7-2.3l.5 1.6c-2.5 1.7-5.2 2.5-8.2 2.5s-5.7-.8-8.2-2.5z';
const DOTS = [
    [11.4, 10.6, GOLD], [9.4, 15.6, RED], [13.6, 16.4, GOLD],
] as const;
const TUFT = [
    [0, -1.6], [1.5, -0.6], [1, 1.2], [-1, 1.2], [-1.5, -0.6],
];

const bounce = keyframes`
    from { transform: rotate(-12deg); }
    to { transform: rotate(12deg); }
`;

const PartyHatIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="PartyHatIcon" {...props}>
        <path d={CONE} fill={BLUE} />
        <path d={SHADE} fill={BLUE_SHADE} />
        {DOTS.map(([x, y, color]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill={color} />
        ))}
        <path d={RIM} fill={GOLD} />
        <path d="M14 21.6c2.2-.3 4.2-1 6.2-2.3l.2.7c-1.9 1.3-4 2.1-6.4 2.4z" fill={GOLD_SHADE} />
        <Box
            component="g"
            sx={{
                transformBox: 'view-box',
                transformOrigin: '12px 4.4px',
                animation: `${bounce} 1.4s ease-in-out infinite alternate`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            {TUFT.map(([dx, dy]) => (
                <circle key={`${dx}-${dy}`} cx={12 + dx} cy={3 + dy} r={1.3} fill={RED} />
            ))}
            <circle cx={12} cy={3} r={1.5} fill={RED_SHADE} />
        </Box>
    </SvgIcon>
);

export default PartyHatIcon;
