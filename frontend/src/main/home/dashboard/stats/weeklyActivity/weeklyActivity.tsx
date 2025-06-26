import { FC } from 'react';
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import ActivityDayBar from './activityDayBar';
import { IDayActivity } from '@/types';

interface WeeklyActivityProps {
    activityData: IDayActivity[];
}

const WeeklyActivity: FC<WeeklyActivityProps> = ({ activityData }) => {
    const theme = useTheme();

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                }}>
                    <Typography variant="subtitle1">
                        Wöchentliche Aktivität
                    </Typography>
                </Box>

                <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    my: 1,
                    height: "130px",
                    alignItems: "flex-end"
                }}>
                    {activityData.map((day, index) => (
                        <ActivityDayBar
                            key={index}
                            day={day.day}
                            sentCount={day.sent_count}
                            receivedCount={day.received_count}
                        />
                    ))}
                </Box>

                {/* Legend for the bars */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
                        <Box sx={{
                            width: 12,
                            height: 12,
                            bgcolor: theme.palette.success.main,
                            mr: 1,
                            borderRadius: 1
                        }} />
                        <Typography variant="caption" color="text.secondary">Gesendet</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{
                            width: 12,
                            height: 12,
                            bgcolor: theme.palette.info.main,
                            mr: 1,
                            borderRadius: 1
                        }} />
                        <Typography variant="caption" color="text.secondary">Erhalten</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WeeklyActivity;