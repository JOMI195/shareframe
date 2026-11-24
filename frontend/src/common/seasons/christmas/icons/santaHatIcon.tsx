import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { RED, RED_SHADE, SNOW, SNOW_SHADE } from '../palette';

const HAT = 'M4.5 16.5C5 10.5 8.5 5 14 5c3 0 5 1.6 5.6 4.6l-2.1.6c-.4-1.4-1.2-2.2-2.4-2.3 1.8 2.4 3.2 5.4 3.9 8.6z';
const SHADE = 'M15.1 7.9c1.8 2.4 3.2 5.4 3.9 8.6h-3.2c-.4-3.4-1.4-6.4-3-8.6z';

const dangle = keyframes`
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
`;

const SantaHatIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="SantaHatIcon" {...props}>
        <path d={HAT} fill={RED} />
        <path d={SHADE} fill={RED_SHADE} />
        <rect x={3.8} y={15.2} width={16.4} height={4.6} rx={2.3} fill={SNOW} />
        <path d="M4.2 18.4c.5.9 1.4 1.4 2.4 1.4h10.8c1 0 1.9-.5 2.4-1.4z" fill={SNOW_SHADE} />
        <Box
            component="g"
            sx={{
                transformBox: 'view-box',
                transformOrigin: '18.5px 9.5px',
                animation: `${dangle} 1.6s ease-in-out infinite alternate`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            <circle cx={18.8} cy={11.4} r={2.3} fill={SNOW} />
            <path d="M16.6 12c.3 1 1.2 1.7 2.2 1.7s1.9-.7 2.2-1.7z" fill={SNOW_SHADE} />
        </Box>
    </SvgIcon>
);

export default SantaHatIcon;
