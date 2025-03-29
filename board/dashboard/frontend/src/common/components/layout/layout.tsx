import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import TopAppbar from "./topLayout/topAppBar";
import { ReactNode } from "react";

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopAppbar />
            <Container
                maxWidth="md"
                disableGutters
                sx={{
                    flex: '1 1 auto',
                    display: 'flex',
                    alignItems: "center",
                    flexDirection: 'column',
                    pt: isSmallScreen ? 1 : 5,
                    pb: isSmallScreen ? 1 : 5,
                }}
            >
                {children}
            </Container>
        </Box>
    );
};

export default MainLayout;
