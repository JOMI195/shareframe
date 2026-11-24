import { SvgIcon, type SvgIconProps } from '@mui/material';
import { GOLD, GOLD_SHADE, RED, RED_SHADE } from '../palette';

const OrnamentIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="OrnamentIcon" {...props}>
        <circle cx={12} cy={2.4} r={1.2} fill="none" stroke={GOLD_SHADE} strokeWidth={0.8} />
        <rect x={9.6} y={3.4} width={4.8} height={3.4} rx={0.8} fill={GOLD} />
        <circle cx={12} cy={14.4} r={8} fill={RED} />
        <path d="M18.2 9.4A8 8 0 0 1 9 21.8a8 8 0 0 0 9.2-12.4z" fill={RED_SHADE} />
        <path d="M4.2 13.4q3.9-2.6 7.8 0t7.8 0v2q-3.9 2.6-7.8 0t-7.8 0z" fill={GOLD} />
    </SvgIcon>
);

export default OrnamentIcon;
