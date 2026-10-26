import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Outlet } from "react-router";
import Logo from "@/common/components/logo";
import PublicFooter from "@/common/components/layout/bottomLayout/publicFooter";

export default function Layout() {
  return (
    <Container component="main" maxWidth="xs" disableGutters sx={{ my: 2, }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          mb: 5
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", my: 1, width: "100%" }}>
          <Logo
            darkLogoSrc="/frame-3d.svg"
            lightLogoSrc="/frame-3d.svg"
            clickable={false}
            maxWidth={230}
          />
        </Box>
        <Outlet />
      </Box>
      <PublicFooter />
    </Container>
  );
}
