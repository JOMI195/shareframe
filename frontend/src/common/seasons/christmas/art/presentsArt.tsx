import { SvgIcon, type SvgIconProps } from '@mui/material';

const PresentsArt: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="PresentsArt" {...props}>
        <ellipse cx={12} cy={21.6} rx={10} ry={1.2} fill="#FFFFFF" stroke="rgba(0, 0, 0, 0.1)" strokeWidth={0.3} />
        <path d="M3 12h11v9H3z" fill="#C62828" />
        <path d="M2.4 10h12.2v2.6H2.4z" fill="#E53935" />
        <path d="M7.8 10h1.4v11H7.8z" fill="#FFD54F" />
        <path d="M8.5 10c-1-2.2-3.4-2.8-3.7-1.5-.3 1.1 1.6 1.5 3.7 1.5zM8.5 10c1-2.2 3.4-2.8 3.7-1.5.3 1.1-1.6 1.5-3.7 1.5z" fill="#FFD54F" />
        <path d="M14.6 15.5h6.6V21h-6.6z" fill="#2E7D32" />
        <path d="M14.2 14.2h7.4V16h-7.4z" fill="#43A047" />
        <path d="M17.3 14.2h1.2V21h-1.2z" fill="#E53935" />
        <path d="M17.9 14.2c-.6-1.4-2.1-1.8-2.3-1-.2.7 1 1 2.3 1zM17.9 14.2c.6-1.4 2.1-1.8 2.3-1 .2.7-1 1-2.3 1z" fill="#E53935" />
    </SvgIcon>
);

export default PresentsArt;
