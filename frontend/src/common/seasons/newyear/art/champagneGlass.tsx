import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { url, useSvgIds } from '../../svgIds';

const BOWL = 'M8.6 2.2h6.8c.4 5.6-.6 10-3.4 10.8C9.2 12.2 8.2 7.8 8.6 2.2z';
const BUBBLES = [
    { x: 10.8, r: 0.45, delay: 0 },
    { x: 12.6, r: 0.35, delay: 0.5 },
    { x: 11.7, r: 0.55, delay: 1 },
    { x: 13.4, r: 0.3, delay: 1.4 },
];

const rise = keyframes`
    from { transform: translateY(0); opacity: 0; }
    20% { opacity: 1; }
    to { transform: translateY(-6.5px); opacity: 0; }
`;

const ChampagneGlass: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('glass', 'wine', 'clip');
    return (
        <SvgIcon data-testid="ChampagneGlass" {...props}>
            <defs>
                <linearGradient id={ids.glass} x1="0" x2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
                    <stop offset="50%" stopColor="#E6EEF7" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id={ids.wine} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF0B8" />
                    <stop offset="45%" stopColor="#F2C14E" />
                    <stop offset="100%" stopColor="#C98A12" />
                </linearGradient>
                <clipPath id={ids.clip}>
                    <path d={BOWL} />
                </clipPath>
            </defs>
            <ellipse cx={12} cy={21.4} rx={4.2} ry={1.1} fill="#C9D6E4" />
            <ellipse cx={12} cy={21.1} rx={3.6} ry={0.7} fill="#FFFFFF" opacity={0.7} />
            <path d="M11.5 12.8h1v8.2h-1z" fill="#D5DFEA" />
            <path d={BOWL} fill={url(ids.glass)} />
            <g clipPath={url(ids.clip)}>
                <rect x={8} y={5} width={8} height={9} fill={url(ids.wine)} />
                <path d="M8 5.2q1 -.8 2 0t2 0 2 0 2 0" fill="#FFF8E1" stroke="#FFF8E1" strokeWidth={0.6} />
                {BUBBLES.map(({ x, r, delay }) => (
                    <Box
                        key={x}
                        component="circle"
                        cx={x}
                        cy={12}
                        r={r}
                        fill="#FFFFFF"
                        sx={{
                            opacity: 0,
                            animation: `${rise} 1.8s ease-in ${delay}s infinite`,
                            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.7 },
                        }}
                    />
                ))}
            </g>
            <path d={BOWL} fill="none" stroke="#B7C4D3" strokeWidth={0.5} />
            <path d="M9.6 3.2c-.2 3.2.2 6 1.2 7.8" fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeLinecap="round" opacity={0.85} />
        </SvgIcon>
    );
};

export default ChampagneGlass;
