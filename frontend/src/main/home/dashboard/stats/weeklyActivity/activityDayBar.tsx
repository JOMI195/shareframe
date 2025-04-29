import { FC } from 'react';
import { Box, Typography, Stack, useTheme } from "@mui/material";

interface ActivityDayBarProps {
    day: string;
    sentCount: number;
    receivedCount: number;
}

const ActivityDayBar: FC<ActivityDayBarProps> = ({ day, sentCount, receivedCount }) => {
    const theme = useTheme();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Stack direction="column" spacing={0} alignItems="center">
                {/* Number for sent count */}
                <Typography variant="caption" fontWeight="medium" color={theme.palette.success.dark}>
                    {sentCount > 0 ? sentCount : ''}
                </Typography>

                {/* Bar for sent */}
                <Box
                    sx={{
                        width: "20px",
                        bgcolor: theme.palette.success.main, // Green for sent
                        height: `${sentCount * 5}px`,
                        minHeight: sentCount > 0 ? "5px" : "0px",
                        maxHeight: "35px",
                        borderRadius: "2px 2px 0 0",
                        position: "relative"
                    }}
                />

                {/* Bar for received */}
                <Box
                    sx={{
                        width: "20px",
                        bgcolor: theme.palette.info.main, // Blue for received
                        height: `${receivedCount * 5}px`,
                        minHeight: receivedCount > 0 ? "5px" : "0px",
                        maxHeight: "35px",
                        borderRadius: "0 0 2px 2px",
                        position: "relative"
                    }}
                />

                {/* Number for received count */}
                <Typography variant="caption" fontWeight="medium" color={theme.palette.info.dark}>
                    {receivedCount > 0 ? receivedCount : ''}
                </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {day}
            </Typography>
        </Box>
    );
};

export default ActivityDayBar;