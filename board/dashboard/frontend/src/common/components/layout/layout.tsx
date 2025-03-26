import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import TopAppbar from "./topLayout/topAppBar";
import { ReactNode } from "react";

interface MainLayoutProps {
    children: ReactNode;
    onLogout: () => Promise<void>;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopAppbar onLogout={onLogout} />
            <Container
                maxWidth="md"
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
                {children}
            </Container>
        </Box>
    );
};

export default MainLayout;
