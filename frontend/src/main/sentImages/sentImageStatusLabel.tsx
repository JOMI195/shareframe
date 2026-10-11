import { Box, Typography, TypographyProps, useTheme } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { SENT_IMAGE_STATE_LABELS, SentImageState } from "./sentImageStatus";

interface SentImageStatusLabelProps {
    state: SentImageState;
    variant?: TypographyProps['variant'];
}

const SentImageStatusLabel = ({ state, variant }: SentImageStatusLabelProps) => {
    const theme = useTheme();
    const iconSx = { fontSize: '1rem' };

    const icon = {
        scheduled: <ScheduleIcon sx={{ ...iconSx, color: theme.palette.info.main }} />,
        active: <VisibilityIcon sx={{ ...iconSx, color: theme.palette.success.main }} />,
        expired: <VisibilityOffIcon sx={{ ...iconSx, color: theme.palette.error.main }} />,
    }[state];

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant={variant}>{SENT_IMAGE_STATE_LABELS[state]}</Typography>
        </Box>
    );
};

export default SentImageStatusLabel;
