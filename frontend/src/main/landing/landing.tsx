import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Navigate } from "react-router";
import Logo from "@/common/components/logo";
import PublicFooter from "@/common/components/layout/bottomLayout/publicFooter";
import { landingContent } from "@/seo/landingContent";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";

const Landing = () => {
  if (localStorage.getItem("loggedIn") === "true") {
    return <Navigate to={getDashboardUrl()} replace />;
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ my: 6 }}>
      <Stack spacing={4} alignItems="center" textAlign="center">
        <Logo
          darkLogoSrc="/logo-dark-full-shareframe.svg"
          lightLogoSrc="/logo-light-full-shareframe.svg"
          maxWidth={220}
          marginRight={0}
          clickable={false}
        />
        <Logo
          darkLogoSrc="/frame-3d.svg"
          lightLogoSrc="/frame-3d.svg"
          maxWidth={280}
          marginRight={0}
          clickable={false}
        />
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            {landingContent.headline}
          </Typography>
          <Typography variant="body1">{landingContent.lead}</Typography>
        </Box>
        <Button
          component={RouterLink}
          to={getAuthenticationUrl() + getSignInUrl()}
          variant="contained"
          size="large"
        >
          {landingContent.ctaLabel}
        </Button>
        <Typography variant="body2" color="text.secondary">
          {landingContent.contactHint}
        </Typography>
        <PublicFooter />
      </Stack>
    </Container>
  );
};

export default Landing;
