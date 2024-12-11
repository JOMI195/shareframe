import { Outlet } from "react-router-dom";
import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import Contact from "../contact/contact";
import BuildVersionInfo from "@/common/components/buildVersionInfo";

const Layout = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Container
      sx={{
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        pb: 10
      }}
      maxWidth="md"
    >
      <Outlet />
      {!isSmallScreen && (
        <Box
          sx={{ mt: 10 }}
        >
          <Contact />
        </Box>
      )}
      <Box
        sx={{ mt: 5 }}
      >
        <BuildVersionInfo />
      </Box>
    </Container>
  );
}

export default Layout;