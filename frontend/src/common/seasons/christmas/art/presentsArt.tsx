import { SvgIcon, type SvgIconProps } from '@mui/material';
import { GOLD, GREEN, GREEN_SHADE, RED, RED_SHADE } from '../palette';
import { SnowBase } from './snowBase';

const PresentsArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="PresentsArt" {...props}>
        <SnowBase rx={10} />
        <path d="M3 12h11v9.6H3z" fill={RED} />
        <path d="M10.5 12H14v9.6h-3.5z" fill={RED_SHADE} />
        <path d="M2.4 10h12.2v2.6H2.4z" fill={RED} />
        <path d="M3 12.6h11v.7H3z" fill={RED_SHADE} />
        <path d="M7.8 10h1.4v11.6H7.8z" fill={GOLD} />
        <path d="M8.5 10c-1-2.2-3.4-2.8-3.7-1.5-.3 1.1 1.6 1.5 3.7 1.5zM8.5 10c1-2.2 3.4-2.8 3.7-1.5.3 1.1-1.6 1.5-3.7 1.5z" fill={GOLD} />
        <path d="M14.6 15.5h6.6v6.1h-6.6z" fill={GREEN} />
        <path d="M19.2 15.5h2v6.1h-2z" fill={GREEN_SHADE} />
        <path d="M14.2 14.2h7.4V16h-7.4z" fill={GREEN} />
        <path d="M14.6 16h6.6v.6h-6.6z" fill={GREEN_SHADE} />
        <path d="M17.3 14.2h1.2v7.4h-1.2z" fill={RED} />
        <path d="M17.9 14.2c-.6-1.4-2.1-1.8-2.3-1-.2.7 1 1 2.3 1zM17.9 14.2c.6-1.4 2.1-1.8 2.3-1 .2.7-1 1-2.3 1z" fill={RED} />
    </SvgIcon>
);

export default PresentsArt;
