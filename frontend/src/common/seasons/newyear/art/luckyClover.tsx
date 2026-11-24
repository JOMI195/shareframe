import { SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../../svgIds';

export const CLOVER_LEAF = 'M12 10.5C9.4 8.6 7.7 6.4 8.2 4.5c.5-1.9 2.9-2.2 3.8-.4.9-1.8 3.3-1.5 3.8.4.5 1.9-1.2 4.1-3.8 6z';

const LuckyClover: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('leaf', 'halo');
    return (
        <SvgIcon data-testid="LuckyClover" {...props}>
            <defs>
                <radialGradient id={ids.leaf} cx="0.4" cy="0.3" r="0.8">
                    <stop offset="0%" stopColor="#B4F5C9" />
                    <stop offset="45%" stopColor="#34B864" />
                    <stop offset="100%" stopColor="#146B35" />
                </radialGradient>
                <radialGradient id={ids.halo}>
                    <stop offset="0%" stopColor="#7FE0A2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7FE0A2" stopOpacity={0} />
                </radialGradient>
            </defs>
            <circle cx={12} cy={10.5} r={11} fill={url(ids.halo)} />
            <path d="M12 10.5c.4 4.2 2 7.8 4.8 11" fill="none" stroke="#1F7A3E" strokeWidth={1.1} strokeLinecap="round" />
            {[0, 90, 180, 270].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 12 10.5)`}>
                    <path d={CLOVER_LEAF} fill={url(ids.leaf)} />
                    <path d="M12 10.3V5" stroke="#0F5A2B" strokeWidth={0.35} strokeLinecap="round" opacity={0.6} />
                    <path d="M10.3 5.3c-.6-.8-1.2-.9-1.5-.4" fill="none" stroke="#FFFFFF" strokeWidth={0.6} strokeLinecap="round" opacity={0.7} />
                </g>
            ))}
            <circle cx={12} cy={10.5} r={0.8} fill="#1F7A3E" />
        </SvgIcon>
    );
};

export default LuckyClover;
