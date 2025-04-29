import { Box, Typography } from "@mui/material";
import { useAppSelector } from "@/store";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { getFrames, getApi as getFramesApi } from "@/store/entities/frames/frames.slice";
import { getApi as getImagesApi, getImagesPaginated, getSentImages } from "@/store/entities/images/images.slice";
import Header from "./header/header";
import LoadingSkeleton from "./loading/loadingSkeleton";
import QuickAccess from "./quickAccess/quickAccess";
import { useWeeklyActivityData } from "./stats/weeklyActivity/useWeeklyActivityData";
import StatsSection from "./stats/stats";
import { ISentImage } from "@/types";

const Dashboard: React.FC = () => {
    const user = useAppSelector(getUser);
    const imagesCount = useAppSelector(getImagesPaginated).count;
    const sentImages = useAppSelector(getSentImages);
    const frames = useAppSelector(getFrames);

    const imagesLoading = useAppSelector(getImagesApi).loading;
    const framesLoading = useAppSelector(getFramesApi).loading;

    const toMeSentImagesCount = sentImages.filter(
        (image: ISentImage) =>
            new Date(image.expires_at) > new Date() &&
            image.reciever === user.me.username
    ).length;

    const latestExpiringImage = sentImages
        .filter((image: ISentImage) =>
            new Date(image.expires_at) > new Date() &&
            image.reciever === user.me.username
        )
        .sort((a: ISentImage, b: ISentImage) =>
            new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
        )[0];

    const activityData = useWeeklyActivityData(sentImages, user.me.username);

    return (
        <Box sx={{
            height: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Header Welcome Section */}
            <Header username={user.me.username} />

            {/* Quick Access Cards */}
            <Typography mb={1} variant="subtitle1">
                Schnellzugriff
            </Typography>
            <QuickAccess />

            {/* Quick Stats Row */}
            <Typography mb={1} variant="subtitle1">
                Statistiken
            </Typography>
            {imagesLoading || framesLoading ? (
                <LoadingSkeleton count={1} />
            ) : (
                <StatsSection
                    toMeSentImagesCount={toMeSentImagesCount}
                    latestExpiringImage={latestExpiringImage}
                    imagesCount={imagesCount}
                    frames={frames}
                    activityData={activityData}
                />
            )}
        </Box>
    );
};

export default Dashboard;