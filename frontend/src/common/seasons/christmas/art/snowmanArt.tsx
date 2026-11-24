import { SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../svgIds';
import { SnowBase, SnowBaseGradient } from './snowBase';

const INK = '#1E2630';

const SnowmanArt: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('ball', 'scarf', 'hat', 'carrot', 'snow');
    return (
        <SvgIcon data-testid="SnowmanArt" {...props}>
            <defs>
                <radialGradient id={ids.ball} cx="0.38" cy="0.32" r="0.75" fx="0.32" fy="0.26">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="70%" stopColor="#EEF3F8" />
                    <stop offset="100%" stopColor="#C9D6E4" />
                </radialGradient>
                <linearGradient id={ids.scarf} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B7F" />
                    <stop offset="100%" stopColor="#A3172B" />
                </linearGradient>
                <linearGradient id={ids.hat} x1="0" x2="1">
                    <stop offset="0%" stopColor="#0F151C" />
                    <stop offset="35%" stopColor="#3A4654" />
                    <stop offset="100%" stopColor="#141B23" />
                </linearGradient>
                <linearGradient id={ids.carrot} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#E0700A" />
                    <stop offset="100%" stopColor="#FFB35C" />
                </linearGradient>
                <SnowBaseGradient id={ids.snow} />
            </defs>
            <SnowBase id={ids.snow} />
            <path d="M7.4 15.4 4 12.6M5 13.4l-.9-.2M16.6 15.4l3.4-2.8M19 13.4l.9-.2" fill="none" stroke="#6D4C41" strokeWidth={0.6} strokeLinecap="round" />
            <circle cx={12} cy={17.4} r={5} fill={url(ids.ball)} />
            <circle cx={12} cy={9.2} r={3.6} fill={url(ids.ball)} />
            <circle cx={12} cy={16} r={0.5} fill={INK} />
            <circle cx={12} cy={18.4} r={0.5} fill={INK} />
            <path d="M8.6 11.6q3.4 1.6 6.8 0v1.4q-3.4 1.6-6.8 0zM13.6 12.6l.9 3.4 1.3-.4-.8-3.3z" fill={url(ids.scarf)} />
            <path d="M9.6 12.1v1.3M11 12.5v1.3M12.4 12.6v1.3M13.8 12.4v1.3" stroke="#FFFFFF" strokeWidth={0.25} opacity={0.45} />
            <circle cx={10.8} cy={8.6} r={0.5} fill={INK} />
            <circle cx={13.2} cy={8.6} r={0.5} fill={INK} />
            <circle cx={10.95} cy={8.45} r={0.15} fill="#FFFFFF" />
            <circle cx={13.35} cy={8.45} r={0.15} fill="#FFFFFF" />
            <path d="M12 9.6l3.2.7-3.2.6z" fill={url(ids.carrot)} />
            <circle cx={10} cy={10.2} r={0.6} fill="#FF8FA0" opacity={0.45} />
            <circle cx={14} cy={10.2} r={0.6} fill="#FF8FA0" opacity={0.45} />
            <path d="M9.3 1.6h5.4v4H9.3zM7.8 5.3h8.4v1.1H7.8z" fill={url(ids.hat)} />
            <path d="M9.3 4.3h5.4v.9H9.3z" fill="#D6304A" />
        </SvgIcon>
    );
};

export default SnowmanArt;
