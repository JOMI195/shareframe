import { createSvgIcon } from '@mui/material';

export const SNOWFLAKE = 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.4 10.2l3.4-.9-.9-3.4M20.6 13.8l-3.4.9.9 3.4M5.9 18.1l.9-3.4-3.4-.9M18.1 5.9l-.9 3.4 3.4.9';

const SnowflakeIcon = createSvgIcon(
    <path d={SNOWFLAKE} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />,
    'Snowflake',
);

export default SnowflakeIcon;
