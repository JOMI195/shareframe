import { SvgIcon, type SvgIconProps } from '@mui/material';
import { SNOWFLAKE } from '../palette';
import { url, useSvgIds } from '../svgIds';

const GlowSnowflake: React.FC<SvgIconProps> = (props) => {
    const ids = useSvgIds('ice', 'halo');
    return (
        <SvgIcon data-testid="GlowSnowflake" {...props}>
            <defs>
                <linearGradient id={ids.ice} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D6EBFF" />
                    <stop offset="100%" stopColor="#4D8EF7" />
                </linearGradient>
                <radialGradient id={ids.halo}>
                    <stop offset="0%" stopColor="#9CC8FF" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#9CC8FF" stopOpacity={0} />
                </radialGradient>
            </defs>
            <circle cx={12} cy={12} r={11.5} fill={url(ids.halo)} />
            <path d={SNOWFLAKE} fill="none" stroke={url(ids.ice)} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
    );
};

export default GlowSnowflake;
