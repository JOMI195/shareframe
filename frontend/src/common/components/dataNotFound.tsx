import { Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import Logo from "./logo";
import SeasonalEmptyState from "./seasonal/seasonalEmptyState";

interface DataNotFoundProps {
    notFoundMessage: string;
}
const DataNotFound: React.FC<DataNotFoundProps> = ({ notFoundMessage }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const imageWidth = isSmallScreen ? 150 : 300;

    return (
        <Stack
            spacing={1}
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
            }}
        >
            <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Logo
                    darkLogoSrc="/frame-3d-no-data.svg"
                    lightLogoSrc="/frame-3d-no-data.svg"
                    clickable={false}
                    maxWidth={imageWidth}
                />
                <SeasonalEmptyState size={imageWidth / 4} />
            </Box>
            <Typography variant="h6">{notFoundMessage}</Typography>
        </Stack>
    );
}

export default DataNotFound;