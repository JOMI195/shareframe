import { SvgIcon, type SvgIconProps } from '@mui/material';

const INK = '#263238';
const SCARF = '#C62828';

const SnowmanArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="SnowmanArt" {...props}>
        <ellipse cx={12} cy={22.4} rx={7.5} ry={1.3} fill="#FFFFFF" stroke="rgba(0, 0, 0, 0.1)" strokeWidth={0.3} />
        <path d="M7.4 15.4 4 12.6M5 13.4l-.9-.2M16.6 15.4l3.4-2.8M19 13.4l.9-.2" fill="none" stroke="#6D4C41" strokeWidth={0.6} strokeLinecap="round" />
        <circle cx={12} cy={17.5} r={5} fill="#FFFFFF" stroke="#B0BEC5" strokeWidth={0.4} />
        <circle cx={12} cy={9.2} r={3.6} fill="#FFFFFF" stroke="#B0BEC5" strokeWidth={0.4} />
        <circle cx={12} cy={16} r={0.5} fill={INK} />
        <circle cx={12} cy={18.4} r={0.5} fill={INK} />
        <path d="M8.6 11.6q3.4 1.6 6.8 0v1.4q-3.4 1.6-6.8 0zM13.6 12.6l.9 3.4 1.3-.4-.8-3.3z" fill={SCARF} />
        <circle cx={10.8} cy={8.6} r={0.45} fill={INK} />
        <circle cx={13.2} cy={8.6} r={0.45} fill={INK} />
        <path d="M12 9.6l3.2.7-3.2.6z" fill="#FB8C00" />
        <path d="M9.3 1.6h5.4v4H9.3zM7.8 5.3h8.4v1.1H7.8z" fill={INK} />
        <path d="M9.3 4.3h5.4v.9H9.3z" fill={SCARF} />
    </SvgIcon>
);

export default SnowmanArt;
