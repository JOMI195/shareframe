import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import TopAppbar from "./topLayout/topAppBar";
import Sidebar from "./sidebar/sidebar";
import NewChangelogDialog from "@/main/changelogs/dialogs/newChangelogDialog";
import { useChangelogs } from "@/hooks/changelogs/useChangelogs";
import { useEffect } from "react";

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
    }, [location]);

    useEffect(() => {
        loadChangelogs();
        cleanUpdDeactivatedIds();
    }, [changelogIds]);

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
            <NewChangelogDialog />
        </Box>
    );
};

export default MainLayout;
