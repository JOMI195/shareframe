import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../svgIds';

const sheen = keyframes`
    0%, 30% { transform: translateX(-14px) skewX(-20deg); }
    70%, 100% { transform: translateX(14px) skewX(-20deg); }
`;

const GlassOrnament: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('glass', 'gold', 'clip');
    return (
        <SvgIcon data-testid="GlassOrnament" {...props}>
            <defs>
                <radialGradient id={ids.glass} cx="0.38" cy="0.32" r="0.8" fx="0.3" fy="0.25">
                    <stop offset="0%" stopColor="#FFB0BD" />
                    <stop offset="35%" stopColor="#E8384F" />
                    <stop offset="100%" stopColor="#6E0B1D" />
                </radialGradient>
                <linearGradient id={ids.gold} x1="0" x2="1">
                    <stop offset="0%" stopColor="#9C7A2E" />
                    <stop offset="50%" stopColor="#FFE7A6" />
                    <stop offset="100%" stopColor="#A9812C" />
                </linearGradient>
                <clipPath id={ids.clip}>
                    <circle cx={12} cy={14.5} r={7.8} />
                </clipPath>
            </defs>
            <circle cx={12} cy={2.4} r={1.2} fill="none" stroke={url(ids.gold)} strokeWidth={0.7} />
            <rect x={9.8} y={3.6} width={4.4} height={3.3} rx={0.6} fill={url(ids.gold)} />
            <circle cx={12} cy={14.5} r={7.8} fill={url(ids.glass)} />
            <path d="M4.6 15.2q3.7-2.4 7.4 0t7.4 0" fill="none" stroke="#FFE7A6" strokeWidth={0.6} opacity={0.85} />
            <g clipPath={url(ids.clip)}>
                <Box
                    component="rect"
                    x={10}
                    y={5}
                    width={3}
                    height={20}
                    fill="#FFFFFF"
                    opacity={0.35}
                    sx={{
                        animation: `${sheen} 2.4s ease-in-out infinite`,
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0 },
                    }}
                />
            </g>
            <path d="M7.4 11.6c.8-1.9 2.4-3.1 4.2-3.4" fill="none" stroke="#FFFFFF" strokeWidth={1.1} strokeLinecap="round" opacity={0.8} />
        </SvgIcon>
    );
};

export default GlassOrnament;
