
import { FC } from 'react';
import { Grid } from "@mui/material";
import ImageIcon from '@mui/icons-material/Image';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import WifiIcon from '@mui/icons-material/Wifi';
import { Chip, Stack, } from "@mui/material";
import { isFrameActive } from "@/common/utils/frame";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { IFrame, ISentImage } from "@/types";
import StatCard from './card/statCard';
import { DayActivity } from './weeklyActivity/useWeeklyActivityData';
import WeeklyActivity from './weeklyActivity/weeklyActivity';

interface StatsSectionProps {
    toMeSentImagesCount: number;
    latestExpiringImage: ISentImage | undefined;
    imagesCount: number;
    frames: IFrame[];
    activityData: DayActivity[];
}

const StatsSection: FC<StatsSectionProps> = ({ toMeSentImagesCount, latestExpiringImage, imagesCount, frames, activityData }) => {
    return (
        <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={5} sx={{ display: "flex" }}>
                <StatCard
                    icon={<ImageIcon color="success" />}
                    title="Aktive Fotos"
                    value={toMeSentImagesCount}
                />
            </Grid>

            <Grid item xs={7} sx={{ display: "flex" }}>
                <StatCard
                    icon={<AccessAlarmIcon color="primary" />}
                    title="Letztes Foto läuft aus am:"
                    value={latestExpiringImage
                        ? formatGermanDateTime(new Date(latestExpiringImage.expires_at))
                        : "Keine aktiven Fotos"}
                />
            </Grid>

            <Grid item xs={6} sx={{ display: "flex" }}>
                <StatCard
                    icon={<AddPhotoAlternateIcon />}
                    title="Hochgeladene Fotos"
                    value={imagesCount}
                />
            </Grid>

            <Grid item xs={6} sx={{ display: "flex" }}>
                <StatCard
                    icon={<FilterFramesIcon />}
                    title="Bilderrahmen"
                    customContent={
                        <Stack spacing={1}>
                            {frames.map((frame, index) => {
                                const hasConnection = isFrameActive(frame);
                                return (
                                    <Chip
                                        key={index}
                                        icon={<WifiIcon />}
                                        label={hasConnection ? "Online" : "Offline"}
                                        color={hasConnection ? "success" : "error"}
                                        size="small"
                                        sx={{
                                            height: "28px"
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    }
                />
            </Grid>

            <Grid item xs={12}>
                <WeeklyActivity activityData={activityData} />
            </Grid>
        </Grid>
    );
};

export default StatsSection;