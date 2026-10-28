import { Box, Button, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store";
import { uploadRequested } from "@/store/ui/images/images.slice";
import { getImageUrl } from "@/assets/endpoints/app/appEndpoints";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import Header from "./header/header";
import LoadingSkeleton from "./loading/loadingSkeleton";
import QuickAccess from "./quickAccess/quickAccess";
import StatsSection from "./stats/stats";
import { getDashboardData, getApi as getDashboardApi } from "@/store/entities/dashboard/dashboard.slice";
import { useMinimumLoading } from "@/hooks/loading/useMinimumLoading";

const Dashboard: React.FC = () => {
    const user = useAppSelector(getUser);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const dashboardStats = useAppSelector(getDashboardData);

    const dashboardLoading = useAppSelector(getDashboardApi).loading;
    const showSkeleton = useMinimumLoading(dashboardLoading);

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

            {/* The app's main task, one tap from the start page */}
            <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={() => {
                    dispatch(uploadRequested());
                    navigate("/" + getImageUrl());
                }}
                sx={{ mb: 3, py: 1.5 }}
            >
                Foto senden
            </Button>

            {/* Quick Access Cards */}
            <Typography variant="subtitle1" sx={{
                mb: 1
            }}>
                Schnellzugriff
            </Typography>
            <QuickAccess />

            {/* Quick Stats Row */}
            <Typography variant="subtitle1" sx={{
                mb: 1
            }}>
                Statistiken
            </Typography>
            {showSkeleton ? (
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