import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router-dom";
import TopAppbar from "./topLayout/topAppBar";
import Sidebar from "./sidebar/sidebar";

const MainLayout: React.FC = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

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
        </Box>
    );
};

export default MainLayout;
