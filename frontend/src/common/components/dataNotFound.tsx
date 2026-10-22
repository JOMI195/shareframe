import { Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import Logo from "./logo";
import { useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";

interface DataNotFoundProps {
    notFoundMessage: string;
}
const DataNotFound: React.FC<DataNotFoundProps> = ({ notFoundMessage }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const { season } = useColorThemeContext();
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
                {season && (
                    <season.EmptyStateIcon
                        aria-hidden
                        sx={{ position: "absolute", right: 0, bottom: 0, fontSize: imageWidth / 4, color: "text.secondary", opacity: 0.8 }}
                    />
                )}
            </Box>
            <Typography variant="h6">{notFoundMessage}</Typography>
        </Stack>
    );
}

export default DataNotFound;