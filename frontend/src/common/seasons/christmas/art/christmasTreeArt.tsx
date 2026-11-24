import { SvgIcon, type SvgIconProps } from '@mui/material';
import { BLUE, BROWN, GOLD, GOLD_SHADE, GREEN, GREEN_SHADE, RED } from '../palette';
import { SnowBase } from './snowBase';

const STAR = 'M12 .6l.9 2 2.2.2-1.7 1.4.5 2.1L12 5.2l-1.9 1.1.5-2.1-1.7-1.4 2.2-.2z';
const TIERS = [
    ['M3.5 20.2 12 9.3l8.5 10.9z', 'M12 9.3l8.5 10.9H12z'],
    ['M5.4 15.5 12 6.5l6.6 9z', 'M12 6.5l6.6 9H12z'],
    ['M7.6 11 12 4.3l4.4 6.7z', 'M12 4.3l4.4 6.7H12z'],
];
const BAUBLES = [
    [7.6, 18.2, RED], [11.2, 18.9, GOLD], [14.6, 18.6, BLUE], [17, 17.6, RED],
    [8.9, 13.8, BLUE], [12.4, 14.4, RED], [15.2, 13.4, GOLD],
    [10.8, 9.9, GOLD], [13.3, 9.6, RED],
];

const ChristmasTreeArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="ChristmasTreeArt" {...props}>
        <SnowBase />
        <path d="M10.6 19.6h2.8v2.8h-2.8z" fill={BROWN} />
        {TIERS.map(([tier, shade]) => (
            <g key={tier}>
                <path d={tier} fill={GREEN} />
                <path d={shade} fill={GREEN_SHADE} />
            </g>
        ))}
        <path d="M6.2 17.4q5.8 2.6 11.6-.4M8.1 13q3.9 1.8 7.8-.2" fill="none" stroke={GOLD} strokeWidth={0.5} strokeLinecap="round" />
        {BAUBLES.map(([x, y, color]) => (
            <circle key={`${x}-${y}`} cx={x as number} cy={y as number} r={0.95} fill={color as string} />
        ))}
        <path d={STAR} fill={GOLD} stroke={GOLD_SHADE} strokeWidth={0.3} strokeLinejoin="round" />
    </SvgIcon>
);

export default ChristmasTreeArt;
