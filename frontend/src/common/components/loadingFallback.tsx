import { Box } from "@mui/material";
import Logo from "./logo";
import SeasonalSpinner from "./seasonal/seasonalSpinner";

const LoadingFallback = () => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh"
            }}>
            <Logo
                darkLogoSrc="/logo-dark-full-shareframe.svg"
                lightLogoSrc="/logo-light-full-shareframe.svg"
                maxWidth={200}
                marginRight={0}
                clickable={false}
            />
            <SeasonalSpinner size={50} />
        </Box>
    );
};

export default LoadingFallback;