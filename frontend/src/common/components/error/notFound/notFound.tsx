import { Button, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Link } from "react-router";
import Logo from "../../logo";

const NotFound = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Stack
            spacing={2}
            sx={{
                minHeight: '100vh',
                width: '100%',
                px: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <Logo
                darkLogoSrc="/frame-3d-no-data.svg"
                lightLogoSrc="/frame-3d-no-data.svg"
                clickable={false}
                marginRight={0}
                maxWidth={isSmallScreen ? 150 : 300}
            />
            <Typography variant="h2">404</Typography>
            <Typography variant="h6" color="text.secondary">
                Seite nicht gefunden
            </Typography>
            <Button
                component={Link}
                to="/"
                variant="contained"
                sx={{ mt: 1, borderRadius: '10px' }}
            >
                Zur Startseite
            </Button>
        </Stack>
    );
};

export default NotFound;
