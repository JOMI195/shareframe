import { SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../svgIds';
import { SnowBase, SnowBaseGradient } from './snowBase';

const STAR = 'M12 .8l.62 1.7 1.8.07-1.42 1.1.5 1.74L12 4.4l-1.5 1.01.5-1.74-1.42-1.1 1.8-.07z';
const TIERS = [
    { d: 'M3.5 20.2 12 9.3l8.5 10.9z', light: '#3FCB8A', dark: '#0F4A36' },
    { d: 'M5.4 15.5 12 6.5l6.6 9z', light: '#4FD99A', dark: '#14573F' },
    { d: 'M7.6 11 12 4.3l4.4 6.7z', light: '#63E6AA', dark: '#1A6649' },
];
const LIGHTS = [
    [7.6, 17.9], [10.6, 18.7], [13.8, 18.5], [16.6, 17.5],
    [8.9, 13.6], [12, 14.2], [15.1, 13.3],
    [10.7, 9.9], [13.3, 9.7],
];

const ChristmasTreeArt: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('tier0', 'tier1', 'tier2', 'bark', 'star', 'halo', 'light', 'snow');
    const tiers = [ids.tier0, ids.tier1, ids.tier2];
    return (
        <SvgIcon data-testid="ChristmasTreeArt" {...props}>
            <defs>
                {TIERS.map(({ light, dark }, i) => (
                    <linearGradient key={i} id={tiers[i]} x1="0.2" y1="0" x2="0.8" y2="1">
                        <stop offset="0%" stopColor={light} />
                        <stop offset="100%" stopColor={dark} />
                    </linearGradient>
                ))}
                <linearGradient id={ids.bark} x1="0" x2="1">
                    <stop offset="0%" stopColor="#8D6142" />
                    <stop offset="100%" stopColor="#4E3322" />
                </linearGradient>
                <linearGradient id={ids.star} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF3C4" />
                    <stop offset="55%" stopColor="#F5C042" />
                    <stop offset="100%" stopColor="#B57F12" />
                </linearGradient>
                <radialGradient id={ids.halo}>
                    <stop offset="0%" stopColor="#FFE08A" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#FFE08A" stopOpacity={0} />
                </radialGradient>
                <radialGradient id={ids.light}>
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="35%" stopColor="#FFE08A" />
                    <stop offset="100%" stopColor="#FFE08A" stopOpacity={0} />
                </radialGradient>
                <SnowBaseGradient id={ids.snow} />
            </defs>
            <SnowBase id={ids.snow} />
            <path d="M10.8 19.8h2.4v2.6h-2.4z" fill={url(ids.bark)} />
            {TIERS.map(({ d }, i) => (
                <path key={i} d={d} fill={url(tiers[i])} />
            ))}
            <path d="M6.2 17.4q5.8 2.6 11.6-.4M8.1 13q3.9 1.8 7.8-.2" fill="none" stroke="#F5C042" strokeWidth={0.35} opacity={0.8} />
            {LIGHTS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill={url(ids.light)} />
            ))}
            <circle cx={12} cy={3.3} r={3.6} fill={url(ids.halo)} />
            <path d={STAR} fill={url(ids.star)} stroke="#A8740E" strokeWidth={0.2} strokeLinejoin="round" />
        </SvgIcon>
    );
};

export default ChristmasTreeArt;
