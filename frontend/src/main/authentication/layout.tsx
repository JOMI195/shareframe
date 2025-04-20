import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Logo from "@/common/components/logo";
import { getImprintUrl, getPrivacyPolicyUrl } from "@/assets/endpoints/app/legalEndpoints";
import { getContactUrl, getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import Stack from "@mui/material/Stack";

function Copyright(props: any) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      align="center"
      {...props}
    >
      <Box>
        <Link component={RouterLink} to={"/" + getContactUrl()} color="inherit">
          {"Kontakt"}
        </Link>{" "}
        <Link component={RouterLink} to={"/" + getPrivacyPolicyUrl()} color="inherit">
          {"Datenschutzerklärung"}
        </Link>{" "}
        <Link component={RouterLink} to={"/" + getImprintUrl()} color="inherit">
          {"Impressum"}
        </Link>
      </Box>
      <Box>
        {"Copyright © "}
        <Link component={RouterLink} to={getHomeUrl()} color="inherit">
          {"shareframe.de"}
        </Link>{" "}
        {new Date().getFullYear()}
        {"."}
      </Box>
    </Typography>
  );
}

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
        <Stack spacing={0} display={"flex"} alignItems={"center"} sx={{ my: 1, width: "100%" }}>
          <Logo
            darkLogoSrc="/logo-dark-full-shareframe.svg"
            lightLogoSrc="/logo-light-full-shareframe.svg"
            marginRight={16}
            clickable={false}
            maxWidth={100}
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
      <Copyright />
    </Container>
  );
}
