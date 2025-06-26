import { Box, Typography } from "@mui/material";
import { useAppSelector } from "@/store";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import Header from "./header/header";
import LoadingSkeleton from "./loading/loadingSkeleton";
import QuickAccess from "./quickAccess/quickAccess";
import StatsSection from "./stats/stats";
import { getDashboardData, getApi as getDashboardApi } from "@/store/entities/dashboard/dashboard.slice";

const Dashboard: React.FC = () => {
    const user = useAppSelector(getUser);
    const dashboardStats = useAppSelector(getDashboardData);

    const dashboardLoading = useAppSelector(getDashboardApi).loading;

    const imagesStats = dashboardStats?.images;
    const sentImagesStats = dashboardStats?.sent_images;
    const framesStats = dashboardStats?.frames;

    // images
    const imagesCount = imagesStats ? imagesStats.uploaded_images_by_me_count : 0;

    // sent images
    const toMeSentImagesCount = sentImagesStats ? sentImagesStats.active_images_to_me_count : 0;
    const latestExpiringImage = (sentImagesStats && sentImagesStats.latest_expiring_image != null) ? sentImagesStats.latest_expiring_image : undefined;
    const activityData = sentImagesStats ? sentImagesStats.weekly_activity : undefined;

    // frames
    const frames = framesStats ? framesStats : [];

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
            {dashboardLoading ? (
                <LoadingSkeleton count={1} />
            ) : (
                <StatsSection
                    toMeSentImagesCount={toMeSentImagesCount}
                    latestExpiringImage={latestExpiringImage}
                    imagesCount={imagesCount}
                    frameStats={frames}
                    activityData={activityData}
                />
            )}
        </Box>
    );
};

export default Dashboard;