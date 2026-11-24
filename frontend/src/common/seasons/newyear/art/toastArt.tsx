import { SvgIcon, type SvgIconProps } from '@mui/material';
import { CHAMPAGNE, GLASS, GLASS_SHADE, GOLD } from '../palette';

const BOWL = 'M-2.6 0h5.2c.3 4.4-.5 7.6-2.6 8.4C-2.1 7.6-2.9 4.4-2.6 0z';
const WINE = 'M-2.55 2.2h5.1c.1 3.2-.8 5.6-2.55 6.2-1.75-.6-2.65-3-2.55-6.2z';
const SPARKLE = 'M0-1.6.4-.4 1.6 0 .4.4 0 1.6-.4.4-1.6 0-.4-.4z';

const Flute: React.FC<{ x: number; tilt: number }> = ({ x, tilt }) => (
    <g transform={`translate(${x} 5.4) rotate(${tilt})`}>
        <path d={BOWL} fill={GLASS} stroke={GLASS_SHADE} strokeWidth={0.5} />
        <path d={WINE} fill={CHAMPAGNE} />
        <rect x={-0.4} y={8.3} width={0.8} height={6} fill={GLASS_SHADE} />
        <ellipse cx={0} cy={14.5} rx={2.6} ry={0.7} fill={GLASS_SHADE} />
    </g>
);

const ToastArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="ToastArt" {...props}>
        <Flute x={9.6} tilt={18} />
        <Flute x={14.4} tilt={-18} />
        <circle cx={10.9} cy={2.8} r={0.6} fill={CHAMPAGNE} />
        <circle cx={13.2} cy={2.3} r={0.5} fill={CHAMPAGNE} />
        <circle cx={12} cy={1.2} r={0.45} fill={CHAMPAGNE} />
        <path d={SPARKLE} fill={GOLD} transform="translate(4.6 4.2) scale(1.2)" />
        <path d={SPARKLE} fill={GOLD} transform="translate(19.6 3.4)" />
    </SvgIcon>
);

export default ToastArt;
