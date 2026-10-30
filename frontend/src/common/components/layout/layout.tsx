import { Box, Container, LinearProgress, Link, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation, useNavigation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store";
import { getSidebar, routeChanged } from "@/store/ui/navigation/navigation.slice";
import TopAppbar from "./topLayout/topAppBar";
import Sidebar from "./sidebar/sidebar";
import { useChangelogs } from "@/hooks/changelogs/useChangelogs";
import { useEffect, useRef } from "react";
import Lifecycle from "../lifecycle/lifecycle";
import SeasonalScreen from "../seasonal/seasonalScreen";
import SeasonalFlyby from "../seasonal/seasonalFlyby";
import { SIDEBAR_ICON_WIDTH, SIDEBAR_WIDTH } from "./sidebar/sidebarWidth";

// Own component, so a navigation state change doesn't re-render the whole shell.
const NavigationProgress: React.FC = () => {
    const navigation = useNavigation();
    if (navigation.state !== 'loading') return null;
    return (
        <LinearProgress
            aria-label="Seite lädt"
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.tooltip }}
        />
    );
};

const MainLayout: React.FC = () => {
    const theme = useTheme();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const isDesktop = useMediaQuery(theme.breakpoints.up("lg"), { noSsr: true });
    const dispatch = useAppDispatch();
    const { pathname } = useLocation();

    const sidebarOpen = useAppSelector(getSidebar).open;
    const mainRef = useRef<HTMLElement>(null);
    const focusedPathname = useRef(pathname);

    // Screen readers otherwise stay on the link that was activated. Waits for the phone menu,
    // which hands focus back to its button when it closes.
    useEffect(() => {
        if (focusedPathname.current === pathname || (sidebarOpen && !isDesktop)) return;
        focusedPathname.current = pathname;
        mainRef.current?.focus({ preventScroll: true });
    }, [pathname, sidebarOpen, isDesktop]);

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
            <Link
                href="#main"
                sx={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: -48,
                    zIndex: (theme) => theme.zIndex.tooltip,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    '&:focus': { top: 8 },
                }}
            >
                Zum Inhalt springen
            </Link>
            <NavigationProgress />
            <TopAppbar />
            <Sidebar />
            <ScrollRestoration />
            <Container
                component="main"
                id="main"
                ref={mainRef}
                tabIndex={-1}
                maxWidth="xl"
                disableGutters
                sx={{
                    outline: 'none',
                    // The desktop sidebar is fixed, so the page has to make room for it itself.
                    pl: isDesktop ? `${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_ICON_WIDTH}px` : 0,
                    transition: theme.transitions.create('padding-left', { duration: theme.transitions.duration.standard }),
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
