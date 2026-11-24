import { SvgIcon, type SvgIconProps } from '@mui/material';
import { ClockFace } from './clockFace';
import { GOLD, GOLD_SHADE, RED, RED_SHADE } from '../palette';

const BELL = 'M-2.8 0a2.8 2.8 0 0 1 5.6 0z';

// Hands drawn by the caller go in clock coordinates: centre (12, 12), radius 9.
export const AlarmClock: React.FC<{ hands?: React.ReactNode }> = ({ hands }) => (
    <>
        <path d="M7 19.6 5.2 22.6M17 19.6l1.8 3" stroke={RED_SHADE} strokeWidth={1.4} strokeLinecap="round" />
        <path d={BELL} fill={GOLD} transform="translate(6.6 6.4) rotate(-38)" />
        <path d={BELL} fill={GOLD} transform="translate(17.4 6.4) rotate(38)" />
        <rect x={11.2} y={3.2} width={1.6} height={2.4} rx={0.4} fill={GOLD_SHADE} />
        <g transform="translate(12 13.6) scale(0.8) translate(-12 -12)">
            <ClockFace rim={RED} hands={!hands} />
            {hands}
        </g>
    </>
);

const MidnightClockArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="MidnightClockArt" {...props}>
        <AlarmClock />
        <path d="M20.4 9.6l2-1M21 12.4h2.2M3.6 9.6l-2-1M3 12.4H.8" stroke={GOLD} strokeWidth={0.8} strokeLinecap="round" />
    </SvgIcon>
);

export default MidnightClockArt;
