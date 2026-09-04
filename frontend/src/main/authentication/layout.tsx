import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Outlet } from "react-router";
import Logo from "@/common/components/logo";
import PublicFooter from "@/common/components/layout/bottomLayout/publicFooter";
import Stack from "@mui/material/Stack";

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
        <Stack
          spacing={0}
          sx={{
            display: "flex",
            alignItems: "center",
            my: 1,
            width: "100%"
          }}>
          <Logo
            darkLogoSrc="/logo-dark-full-shareframe.svg"
            lightLogoSrc="/logo-light-full-shareframe.svg"
            marginRight={0}
            clickable={false}
            maxWidth={220}
          />
          <Logo
            darkLogoSrc="/frame-3d.svg"
            lightLogoSrc="/frame-3d.svg"
            clickable={false}
            maxWidth={230}
          />
        </Stack>
        <Outlet />
      </Box>
      <PublicFooter />
    </Container>
  );
}
