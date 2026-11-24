import { SvgIcon, type SvgIconProps } from '@mui/material';
import { BLUE, BLUE_SHADE, GOLD, RED, RED_SHADE } from '../palette';

const RocketIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="RocketIcon" {...props}>
        <path d="M12 1.5 15.2 6H8.8z" fill={BLUE} />
        <path d="M12 1.5 15.2 6H12z" fill={BLUE_SHADE} />
        <rect x={8.8} y={6} width={6.4} height={9.5} fill={RED} />
        <rect x={12.6} y={6} width={2.6} height={9.5} fill={RED_SHADE} />
        <path d="M8.8 9h6.4v1.6H8.8zM8.8 12.2h6.4v1.6H8.8z" fill={GOLD} />
        <path d="M11.4 15.5h1.2v7h-1.2z" fill="#9A6340" />
        <path d="M12 15.5 9 18.5M12 15.5l3 3" stroke={GOLD} strokeWidth={1.2} strokeLinecap="round" />
    </SvgIcon>
);

export default RocketIcon;
