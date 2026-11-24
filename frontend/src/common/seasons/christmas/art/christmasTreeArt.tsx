import { SvgIcon, type SvgIconProps } from '@mui/material';

const STAR = 'M12 1.1l.56 1.53 1.63.06-1.29 1 .45 1.57L12 4.35l-1.35.91.45-1.57-1.29-1 1.63-.06z';
const BAUBLES = [
    { x: 8.2, y: 18.4, color: '#E53935' },
    { x: 15.4, y: 18.2, color: '#1E88E5' },
    { x: 12, y: 15.9, color: '#FDD835' },
    { x: 9.5, y: 13.4, color: '#1E88E5' },
    { x: 14.6, y: 13.1, color: '#E53935' },
    { x: 12, y: 9.9, color: '#E53935' },
];

const ChristmasTreeArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="ChristmasTreeArt" {...props}>
        <ellipse cx={12} cy={22.4} rx={7.5} ry={1.3} fill="#FFFFFF" stroke="rgba(0, 0, 0, 0.1)" strokeWidth={0.3} />
        <path d="M10.7 19.6h2.6v3h-2.6z" fill="#6D4C41" />
        <path d="M3.5 20.2 12 9.5l8.5 10.7z" fill="#2E7D32" />
        <path d="M5.5 15.4 12 6.6l6.5 8.8z" fill="#388E3C" />
        <path d="M7.6 10.8 12 4.2l4.4 6.6z" fill="#43A047" />
        <path d="M6 17.3q6 2.4 12-.6M7.7 12.7q4.3 1.8 8.6-.4" fill="none" stroke="#FFD54F" strokeWidth={0.6} strokeLinecap="round" />
        {BAUBLES.map(({ x, y, color }, i) => (
            <circle key={i} cx={x} cy={y} r={0.9} fill={color} />
        ))}
        <path d={STAR} fill="#FFC107" stroke="#F9A825" strokeWidth={0.3} strokeLinejoin="round" />
    </SvgIcon>
);

export default ChristmasTreeArt;
