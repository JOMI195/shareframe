import { SvgIcon, type SvgIconProps } from '@mui/material';
import { ICE, SNOWFLAKE } from '../palette';

const SnowflakeIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="SnowflakeIcon" {...props}>
        <path d={SNOWFLAKE} fill="none" stroke={ICE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={12} cy={12} r={1.8} fill={ICE} />
    </SvgIcon>
);

export default SnowflakeIcon;
