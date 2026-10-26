import { Box, keyframes, SvgIcon, type SvgIconProps } from '@mui/material';

const BODY = 'M12 7.2c-1-.6-2.3-.9-3.6-.6C5.3 7.2 3 10 3 13.7 3 17.4 5.6 21 9 21c1.1 0 2.1-.3 3-.8.9.5 1.9.8 3 .8 3.4 0 6-3.6 6-7.3 0-3.7-2.3-6.5-5.4-7.1-1.3-.3-2.6 0-3.6.6z';
const STEM = 'M11.3 6.8c0-1.7.5-3.1 1.6-4.3l1.4 1c-.8.9-1.1 2-1.1 3.3z';
const FACE = 'M6.8 12.9 9 10.3l1.3 3zM17.2 12.9 15 10.3l-1.3 3zM12 13.5l-.9 1.5h1.8zM6.9 15.4c1.2 2.4 3 3.3 5.1 3.3s3.9-.9 5.1-3.3l-1.3.6-.7 1-.9-.8-1 1.1-1.2-1-1.2 1-1-1.1-.9.8-.7-1z';

const flicker = keyframes`
    0%, 100% { opacity: 1; fill: #FFD54F; }
    12% { opacity: 0.75; }
    16% { opacity: 0.95; fill: #FFB300; }
    41% { opacity: 0.7; }
    45% { opacity: 1; fill: #FFE082; }
    72% { opacity: 0.85; fill: #FFB300; }
`;

const JackOLanternIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="JackOLanternIcon" {...props}>
        <path d={BODY} />
        <path d={STEM} />
        <Box
            component="path"
            d={FACE}
            sx={{
                fill: '#FFD54F',
                animation: `${flicker} 2.6s linear infinite`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        />
    </SvgIcon>
);

export default JackOLanternIcon;
