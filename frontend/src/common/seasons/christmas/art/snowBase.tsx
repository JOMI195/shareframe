import { SNOW, SNOW_SHADE } from '../palette';

export const SnowBase: React.FC<{ rx?: number }> = ({ rx = 8 }) => (
    <>
        <ellipse cx={12} cy={22.6} rx={rx} ry={1.5} fill={SNOW_SHADE} />
        <ellipse cx={12} cy={22.1} rx={rx - 0.6} ry={1.1} fill={SNOW} />
    </>
);
