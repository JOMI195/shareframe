import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';

const HAT = 'M4.5 16.5C5 10.5 8.5 5 14 5c3 0 5 1.6 5.6 4.6l-2.1.6c-.4-1.4-1.2-2.2-2.4-2.3 1.8 2.4 3.2 5.4 3.9 8.6z';
const BRIM = 'M5.2 15.2h13.6a2.3 2.3 0 0 1 0 4.6H5.2a2.3 2.3 0 0 1 0-4.6z';

const dangle = keyframes`
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
`;

const SantaHatIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="SantaHatIcon" {...props}>
        <path d={HAT} />
        <path d={BRIM} fill="#FFFFFF" stroke="rgba(0, 0, 0, 0.18)" strokeWidth={0.5} />
        <Box
            component="circle"
            cx={18.8}
            cy={11.4}
            r={2}
            fill="#FFFFFF"
            stroke="rgba(0, 0, 0, 0.18)"
            strokeWidth={0.5}
            sx={{
                transformBox: 'view-box',
                transformOrigin: '18.5px 9.5px',
                animation: `${dangle} 1.6s ease-in-out infinite alternate`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        />
    </SvgIcon>
);

export default SantaHatIcon;
