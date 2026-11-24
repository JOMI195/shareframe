import { SvgIcon, type SvgIconProps } from '@mui/material';
import { BROWN_SHADE, INK, RED, RED_SHADE, SNOW, SNOW_SHADE } from '../palette';
import { SnowBase } from './snowBase';

const SnowmanArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="SnowmanArt" {...props}>
        <SnowBase />
        <path d="M7.4 15.4 4 12.6M5 13.4l-.9-.2M16.6 15.4l3.4-2.8M19 13.4l.9-.2" fill="none" stroke={BROWN_SHADE} strokeWidth={0.8} strokeLinecap="round" />
        <circle cx={12} cy={17.4} r={5} fill={SNOW} />
        <path d="M16.2 14.6a5 5 0 0 1-7.4 6.6 5 5 0 0 0 7.4-6.6z" fill={SNOW_SHADE} />
        <circle cx={12} cy={9.2} r={3.6} fill={SNOW} />
        <path d="M15 7.2a3.6 3.6 0 0 1-5.2 4.8 3.6 3.6 0 0 0 5.2-4.8z" fill={SNOW_SHADE} />
        <circle cx={12} cy={16} r={0.55} fill={INK} />
        <circle cx={12} cy={18.4} r={0.55} fill={INK} />
        <path d="M8.6 11.6q3.4 1.6 6.8 0v1.4q-3.4 1.6-6.8 0z" fill={RED} />
        <path d="M13.6 12.6l.9 3.4 1.3-.4-.8-3.3z" fill={RED_SHADE} />
        <circle cx={10.8} cy={8.6} r={0.55} fill={INK} />
        <circle cx={13.2} cy={8.6} r={0.55} fill={INK} />
        <path d="M12 9.5l3.4.8-3.4.6z" fill="#F08A24" />
        <path d="M10.6 10.7q1.4.8 2.8 0" fill="none" stroke={INK} strokeWidth={0.35} strokeLinecap="round" />
        <path d="M9.3 1.6h5.4v4H9.3zM7.8 5.3h8.4v1.1H7.8z" fill={INK} />
        <path d="M9.3 4.2h5.4v1H9.3z" fill={RED} />
    </SvgIcon>
);

export default SnowmanArt;
