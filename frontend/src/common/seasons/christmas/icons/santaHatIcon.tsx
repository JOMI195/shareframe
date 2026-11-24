import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../svgIds';

const HAT = 'M4.5 16.5C5 10.5 8.5 5 14 5c3 0 5 1.6 5.6 4.6l-2.1.6c-.4-1.4-1.2-2.2-2.4-2.3 1.8 2.4 3.2 5.4 3.9 8.6z';
const FOLD = 'M14 5c-2.6.6-4.6 4-5.2 8.8 1.5-3.6 3.4-6 6.4-6.1z';
const FUR = [5.4, 8.1, 10.8, 13.5, 16.2, 18.8];

const dangle = keyframes`
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
`;

const SantaHatIcon: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('velvet', 'fur', 'pompom');
    return (
        <SvgIcon data-testid="SantaHatIcon" {...props}>
            <defs>
                <linearGradient id={ids.velvet} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B7F" />
                    <stop offset="50%" stopColor="#D6304A" />
                    <stop offset="100%" stopColor="#8E1230" />
                </linearGradient>
                <linearGradient id={ids.fur} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#DCE3EC" />
                </linearGradient>
                <radialGradient id={ids.pompom} cx="0.4" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#D5DCE6" />
                </radialGradient>
            </defs>
            <path d={HAT} fill={url(ids.velvet)} />
            <path d={FOLD} fill="#FFFFFF" opacity={0.18} />
            <g fill={url(ids.fur)}>
                <rect x={5.2} y={15.4} width={13.6} height={4.2} rx={2.1} />
                {FUR.map((x) => (
                    <circle key={x} cx={x} cy={17.5} r={2.2} />
                ))}
            </g>
            <Box
                component="g"
                sx={{
                    transformBox: 'view-box',
                    transformOrigin: '18.5px 9.5px',
                    animation: `${dangle} 1.6s ease-in-out infinite alternate`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            >
                <circle cx={18.8} cy={11.4} r={3} fill="#FFFFFF" opacity={0.25} />
                <circle cx={18.8} cy={11.4} r={2.1} fill={url(ids.pompom)} />
            </Box>
        </SvgIcon>
    );
};

export default SantaHatIcon;
