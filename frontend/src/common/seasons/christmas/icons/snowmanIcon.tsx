import { createSvgIcon } from '@mui/material';

const SnowmanIcon = createSvgIcon(
    <>
        <path d="M10 1.8h4v3.6h-4zM8.6 5.1h6.8v1.1H8.6z" />
        <path
            fillRule="evenodd"
            d="M8.8 8.9a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 1 0-6.4 0zm1.4-.6a.6.6 0 1 0 1.2 0 .6.6 0 1 0-1.2 0zm2.4 0a.6.6 0 1 0 1.2 0 .6.6 0 1 0-1.2 0z"
        />
        <path
            fillRule="evenodd"
            d="M6.5 16.5a5.5 5.5 0 1 0 11 0 5.5 5.5 0 1 0-11 0zm4.8-2a.7.7 0 1 0 1.4 0 .7.7 0 1 0-1.4 0zm0 3a.7.7 0 1 0 1.4 0 .7.7 0 1 0-1.4 0z"
        />
        <path d="M7.2 14 3.6 11.4M16.8 14l3.6-2.6" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </>,
    'Snowman',
);

export default SnowmanIcon;
