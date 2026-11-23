import { createSvgIcon } from '@mui/material';

const OrnamentIcon = createSvgIcon(
    <>
        <path
            fillRule="evenodd"
            d="M12 1a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 1 0 0-2.6zm0 .7a.6.6 0 1 1 0 1.2.6.6 0 1 1 0-1.2z"
        />
        <path d="M10 4.2h4V7h-4z" />
        <path
            fillRule="evenodd"
            d="M5 14a7 7 0 1 0 14 0 7 7 0 1 0-14 0zm.6-.8L7.5 12l2 1.4 2.5-1.4 2.5 1.4 2-1.4 1.9 1.2v1.6l-1.9-1.2-2 1.4-2.5-1.4-2.5 1.4-2-1.4-1.9 1.2z"
        />
    </>,
    'Ornament',
);

export default OrnamentIcon;
