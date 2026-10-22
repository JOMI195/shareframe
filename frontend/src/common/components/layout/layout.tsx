import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import TopAppbar from "./topLayout/topAppBar";
import Sidebar from "./sidebar/sidebar";
import { useChangelogs } from "@/hooks/changelogs/useChangelogs";
import { useEffect } from "react";
import Lifecycle from "../lifecycle/lifecycle";
import SeasonalDecoration from "../seasonal/seasonalDecoration";
import SeasonalFlyby from "../seasonal/seasonalFlyby";

const MainLayout: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const {
        changelogIds,
        loadChangelogs,
        loadChangelogIds,
        cleanUpdDeactivatedIds
    } = useChangelogs();

    useEffect(() => {
        loadChangelogIds();
    }, [loadChangelogIds, location]);

    // A resumed PWA keeps its route, so the effect above would not run again.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') loadChangelogIds();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [loadChangelogIds]);

    useEffect(() => {
        loadChangelogs();
        cleanUpdDeactivatedIds();
    }, [loadChangelogs, cleanUpdDeactivatedIds, changelogIds]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopAppbar />
            <Sidebar />
            <ScrollRestoration />
            <Container
                maxWidth="xl"
                disableGutters
                sx={{
                    flex: '1 1 auto',
                    display: 'flex',
                    alignItems: "center",
                    flexDirection: 'column',
                    pt: isSmallScreen ? 2 : 5,
                    pb: 10,
                }}
            >
                <Outlet />
            </Container>
            <Lifecycle />
            <SeasonalDecoration />
            <SeasonalFlyby />
        </Box>
    );
};

export default MainLayout;
