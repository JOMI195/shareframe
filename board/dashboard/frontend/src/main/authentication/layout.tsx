import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Logo from "@/common/components/logo";
import Stack from "@mui/material/Stack";
import { Outlet } from "react-router";

function Copyright(props: any) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      align="center"
      {...props}
    >
      <Box>
        {"Copyright © "}
        {"shareframe.de"}
        {" "}
        {new Date().getFullYear()}
        {"."}
      </Box>
    </Typography>
  );
}

const AuthenticationLayout = () => {
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
        <Stack spacing={0} display={"flex"} alignItems={"center"} sx={{ mt: 5, mb: 10, width: "100%" }}>
          <Logo
            darkLogoSrc="/logo-dark-full-shareframe.svg"
            lightLogoSrc="/logo-light-full-shareframe.svg"
            clickable={false}
            maxWidth={280}
          />
        </Stack>
        <Outlet />
      </Box>
      <Copyright />
    </Container>
  );
}

export default AuthenticationLayout;