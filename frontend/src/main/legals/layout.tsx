import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Outlet } from "react-router";
import Logo from "@/common/components/logo";

export default function PublicLayout() {
  return (
    <Container component="main" maxWidth="xl" disableGutters sx={{ my: 5, }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 5 }}>
        <Logo
          darkLogoSrc="/logo-dark-full-shareframe.svg"
          lightLogoSrc="/logo-light-full-shareframe.svg"
          maxWidth={220}
          marginRight={0}
        />
      </Box>
      <Outlet />
    </Container>
  );
}
