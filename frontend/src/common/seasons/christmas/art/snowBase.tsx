import { url } from '../svgIds';

export const SnowBaseGradient: React.FC<{ id: string }> = ({ id }) => (
    <radialGradient id={id} cx="0.5" cy="0.3" r="0.7">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#D9E4EF" />
    </radialGradient>
);

export const SnowBase: React.FC<{ id: string; rx?: number }> = ({ id, rx = 8 }) => (
    <>
        <ellipse cx={12} cy={22.9} rx={rx} ry={0.9} fill="#000000" opacity={0.12} />
        <ellipse cx={12} cy={22.3} rx={rx} ry={1.4} fill={url(id)} />
    </>
);
