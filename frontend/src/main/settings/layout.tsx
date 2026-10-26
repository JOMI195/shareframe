import { Outlet } from "react-router";
import { Box, Container } from "@mui/material";
import Contact from "../contact/contact";
import BuildVersionInfo from "@/common/components/buildVersionInfo";

const Layout = () => {
  return (
    <Container
      sx={{
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        px: { xs: 0, sm: 3 },
        pb: { xs: 4, sm: 10 }
      }}
      maxWidth="md"
    >
      <Outlet />
      <Box sx={{ mt: { xs: 5, sm: 10 } }}>
        <Contact />
      </Box>
      <Box
        sx={{ mt: 5 }}
      >
        <BuildVersionInfo />
      </Box>
    </Container>
  );
}

export default Layout;