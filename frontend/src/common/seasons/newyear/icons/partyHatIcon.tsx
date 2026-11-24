import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../../svgIds';

const CONE = 'M4.8 19.6 12 4.2l7.2 15.4c-2.2 1.3-4.6 1.8-7.2 1.8s-5-.5-7.2-1.8z';
const STRIPES = [-6, -1.6, 2.8, 7.2, 11.6];
const FRINGE = Array.from({ length: 13 }, (_, i) => 5.2 + i * 1.13);
const TUFT = [
    [0, -1.6], [1.5, -0.6], [1, 1.2], [-1, 1.2], [-1.5, -0.6],
];

const bounce = keyframes`
    from { transform: rotate(-12deg); }
    to { transform: rotate(12deg); }
`;

const PartyHatIcon: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('paper', 'stripe', 'shine', 'fringe', 'pompom', 'clip');
    return (
        <SvgIcon data-testid="PartyHatIcon" {...props}>
            <defs>
                <linearGradient id={ids.paper} x1="0" y1="0" x2="1" y2="0.3">
                    <stop offset="0%" stopColor="#7FA8FF" />
                    <stop offset="55%" stopColor="#2E5FD6" />
                    <stop offset="100%" stopColor="#173A94" />
                </linearGradient>
                <linearGradient id={ids.stripe} x1="0" y1="0" x2="1" y2="0.3">
                    <stop offset="0%" stopColor="#FFB0C4" />
                    <stop offset="55%" stopColor="#EC407A" />
                    <stop offset="100%" stopColor="#A3174F" />
                </linearGradient>
                <linearGradient id={ids.shine} x1="0" x2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={ids.fringe} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF0B8" />
                    <stop offset="60%" stopColor="#F5B83D" />
                    <stop offset="100%" stopColor="#B57F12" />
                </linearGradient>
                <radialGradient id={ids.pompom} cx="0.4" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#FFF3C4" />
                    <stop offset="55%" stopColor="#F5C042" />
                    <stop offset="100%" stopColor="#C2810F" />
                </radialGradient>
                <clipPath id={ids.clip}>
                    <path d={CONE} />
                </clipPath>
            </defs>
            <path d={CONE} fill={url(ids.paper)} />
            <g clipPath={url(ids.clip)}>
                {STRIPES.map((x) => (
                    <rect key={x} x={x} y={-2} width={2.2} height={30} fill={url(ids.stripe)} transform={`rotate(-32 ${x} 12)`} />
                ))}
                <path d="M12 4.2 6.6 16.2c1 .3 2 .5 3 .6z" fill={url(ids.shine)} />
            </g>
            {FRINGE.map((x, i) => (
                <path key={x} d={`M${x} ${19.4 + Math.sin((x - 5.2) / 4.6) * 1.3}v2.6`} stroke={url(ids.fringe)} strokeWidth={0.8} strokeLinecap="round" transform={`rotate(${(i % 3) - 1} ${x} 20)`} />
            ))}
            <path d="M4.8 19.6c2.2 1.3 4.6 1.8 7.2 1.8s5-.5 7.2-1.8" fill="none" stroke={url(ids.fringe)} strokeWidth={1.2} strokeLinecap="round" />
            <Box
                component="g"
                sx={{
                    transformBox: 'view-box',
                    transformOrigin: '12px 4.4px',
                    animation: `${bounce} 1.4s ease-in-out infinite alternate`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            >
                <circle cx={12} cy={3} r={3.2} fill="#FFE08A" opacity={0.3} />
                {TUFT.map(([dx, dy]) => (
                    <circle key={`${dx}-${dy}`} cx={12 + dx} cy={3 + dy} r={1.25} fill={url(ids.pompom)} />
                ))}
                <circle cx={12} cy={3} r={1.4} fill={url(ids.pompom)} />
                <circle cx={11.4} cy={2.4} r={0.45} fill="#FFFFFF" opacity={0.8} />
            </Box>
        </SvgIcon>
    );
};

export default PartyHatIcon;
