import { SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../svgIds';
import { SnowBase, SnowBaseGradient } from './snowBase';

const PresentsArt: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('red', 'redLid', 'green', 'greenLid', 'gold', 'rose', 'snow');
    const box = (id: string, light: string, dark: string) => (
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
        </linearGradient>
    );
    const satin = (id: string, light: string, mid: string, dark: string) => (
        <linearGradient id={id} x1="0" x2="1">
            <stop offset="0%" stopColor={dark} />
            <stop offset="50%" stopColor={light} />
            <stop offset="100%" stopColor={mid} />
        </linearGradient>
    );
    return (
        <SvgIcon data-testid="PresentsArt" {...props}>
            <defs>
                {box(ids.red, '#F0506E', '#8E1230')}
                {box(ids.redLid, '#FF7A8F', '#C2253F')}
                {box(ids.green, '#3FCB8A', '#0F4A36')}
                {box(ids.greenLid, '#63E6AA', '#1F7A5A')}
                {satin(ids.gold, '#FFF0B8', '#E2A825', '#A9812C')}
                {satin(ids.rose, '#FFC2CC', '#E8384F', '#A3172B')}
                <SnowBaseGradient id={ids.snow} />
            </defs>
            <SnowBase id={ids.snow} rx={10} />
            <path d="M3 12h11v9.6H3z" fill={url(ids.red)} />
            <path d="M2.4 10h12.2v2.6H2.4z" fill={url(ids.redLid)} />
            <path d="M7.8 10h1.4v11.6H7.8z" fill={url(ids.gold)} />
            <path d="M8.5 10c-1-2.2-3.4-2.8-3.7-1.5-.3 1.1 1.6 1.5 3.7 1.5zM8.5 10c1-2.2 3.4-2.8 3.7-1.5.3 1.1-1.6 1.5-3.7 1.5z" fill={url(ids.gold)} />
            <path d="M4 13.2l2.6-1.2v8.2L4 21z" fill="#FFFFFF" opacity={0.14} />
            <path d="M14.6 15.5h6.6v6.1h-6.6z" fill={url(ids.green)} />
            <path d="M14.2 14.2h7.4V16h-7.4z" fill={url(ids.greenLid)} />
            <path d="M17.3 14.2h1.2v7.4h-1.2z" fill={url(ids.rose)} />
            <path d="M17.9 14.2c-.6-1.4-2.1-1.8-2.3-1-.2.7 1 1 2.3 1zM17.9 14.2c.6-1.4 2.1-1.8 2.3-1 .2.7-1 1-2.3 1z" fill={url(ids.rose)} />
            <path d="M15.3 16.4l1.4-.6v5.2l-1.4.6z" fill="#FFFFFF" opacity={0.14} />
        </SvgIcon>
    );
};

export default PresentsArt;
