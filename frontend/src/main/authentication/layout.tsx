import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Logo from "@/common/components/logo";

function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link component={RouterLink} to={"/"} color="inherit">
        {"shareframe.de"}
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

export default function Layout() {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%"
        }}
      >
        <Box sx={{ my: 2, width: "100%" }}>
          <Logo
            darkLogoSrc="/logo-dark-full-shareframe.svg"
            lightLogoSrc="/logo-light-full-shareframe.svg"
            marginRight={16}
            clickable={false}
          />
        </Box>
        <Outlet />
      </Box>
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
