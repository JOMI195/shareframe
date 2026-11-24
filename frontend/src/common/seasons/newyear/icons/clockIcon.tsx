import { SvgIcon, type SvgIconProps } from '@mui/material';
import { ClockFace } from '../art/clockFace';
import { RED } from '../palette';

const ClockIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon data-testid="ClockIcon" {...props}>
        <ClockFace rim={RED} hour={-5} spinning />
    </SvgIcon>
);

export default ClockIcon;
