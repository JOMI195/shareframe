import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useAppDispatch } from "@/store";
import { routeChanged } from "@/store/ui/navigation/navigation.slice";
import TopAppbar from "./topLayout/topAppBar";
import Sidebar from "./sidebar/sidebar";
import { useChangelogs } from "@/hooks/changelogs/useChangelogs";
import { useEffect } from "react";
import Lifecycle from "../lifecycle/lifecycle";
import SeasonalScreen from "../seasonal/seasonalScreen";
import SeasonalFlyby from "../seasonal/seasonalFlyby";

const MainLayout: React.FC = () => {
    const theme = useTheme();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const dispatch = useAppDispatch();
    const { pathname } = useLocation();

    // On leaving a route, so it runs before the next page's mount effects can open a dialog.
    useEffect(() => () => {
        dispatch(routeChanged());
    }, [dispatch, pathname]);

    const {
        changelogIds,
        loadChangelogIds,
        refreshChangelogIds,
        loadNewestChangelog,
        cleanUpdDeactivatedIds
    } = useChangelogs();

    useEffect(() => {
        loadChangelogIds();
    }, [loadChangelogIds]);

    // A resumed PWA keeps its route, so the effect above would not run again.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') refreshChangelogIds();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshChangelogIds]);

    useEffect(() => {
        loadNewestChangelog();
        cleanUpdDeactivatedIds();
    }, [loadNewestChangelog, cleanUpdDeactivatedIds, changelogIds]);

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
            <SeasonalScreen />
            <SeasonalFlyby />
        </Box>
    );
};

export default MainLayout;
