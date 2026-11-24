import { SvgIcon, type SvgIconProps } from '@mui/material';
import { GOLD, GOLD_SHADE } from '../palette';
import { newYearNumber } from '../year';

const SPOTS = [
    [5.4, 11.2], [9.8, 9.4], [14.2, 9.4], [18.6, 11.2],
];

const YearBalloonsArt: React.FC<SvgIconProps> = (props) => {
    const digits = String(newYearNumber(new Date())).split('');
    return (
        <SvgIcon data-testid="YearBalloonsArt" {...props}>
            {SPOTS.map(([x, y]) => (
                <path key={x} d={`M${x} ${y + 1.2}Q${(x + 12) / 2} ${y + 6} 12 22.6`} fill="none" stroke={GOLD_SHADE} strokeWidth={0.35} />
            ))}
            {digits.map((digit, i) => (
                <text
                    key={i}
                    x={SPOTS[i][0]}
                    y={SPOTS[i][1]}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={900}
                    fontFamily="inherit"
                    fill={GOLD}
                    stroke={GOLD_SHADE}
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    transform={`rotate(${(i - 1.5) * 8} ${SPOTS[i][0]} ${SPOTS[i][1]})`}
                >
                    {digit}
                </text>
            ))}
        </SvgIcon>
    );
};

export default YearBalloonsArt;
