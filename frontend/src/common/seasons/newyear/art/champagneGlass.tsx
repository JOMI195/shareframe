import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';
import { CHAMPAGNE, GLASS, GLASS_SHADE } from '../palette';

const BOWL = 'M8.6 2.2h6.8c.4 5.6-.6 10-3.4 10.8C9.2 12.2 8.2 7.8 8.6 2.2z';
const WINE = 'M8.7 5.4h6.6c.1 3.8-1 6.8-3.3 7.5-2.3-.7-3.4-3.7-3.3-7.5z';
const BUBBLES = [
    { x: 10.8, r: 0.45, delay: 0 },
    { x: 12.6, r: 0.35, delay: 0.5 },
    { x: 11.7, r: 0.5, delay: 1 },
    { x: 13.2, r: 0.3, delay: 1.4 },
];

const rise = keyframes`
    from { transform: translateY(0); opacity: 0; }
    20% { opacity: 1; }
    to { transform: translateY(-5.5px); opacity: 0; }
`;

const ChampagneGlass: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="ChampagneGlass" {...props}>
        <ellipse cx={12} cy={21.4} rx={4.2} ry={1.2} fill={GLASS_SHADE} />
        <path d="M11.4 12.8h1.2v8.4h-1.2z" fill={GLASS_SHADE} />
        <path d={BOWL} fill={GLASS} />
        <path d={WINE} fill={CHAMPAGNE} />
        {BUBBLES.map(({ x, r, delay }) => (
            <Box
                key={x}
                component="circle"
                cx={x}
                cy={11.6}
                r={r}
                fill="#FFFFFF"
                sx={{
                    opacity: 0,
                    animation: `${rise} 1.8s ease-in ${delay}s infinite`,
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
                }}
            />
        ))}
    </SvgIcon>
);

export default ChampagneGlass;
