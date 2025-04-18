import { Box, CircularProgress } from "@mui/material";
import Logo from "./logo";

const LoadingFallback = () => {
    return (
        <Box
            display="flex"
            flexDirection={"column"}
            justifyContent="center"
            alignItems="center"
            height={"100vh"}
        >
            <Logo
                darkLogoSrc="/logo-dark-full-shareframe.svg"
                lightLogoSrc="/logo-light-full-shareframe.svg"
                maxWidth={200}
                marginRight={0}
                clickable={false}
            />
            <CircularProgress size={"50px"} />
        </Box>
    );
};

export default LoadingFallback;