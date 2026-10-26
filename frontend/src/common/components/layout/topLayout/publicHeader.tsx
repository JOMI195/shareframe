import { Box, Button, Container, IconButton, Tooltip } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router";
import Logo from "@/common/components/logo";
import SeasonalLogoBadge from "@/common/components/seasonal/seasonalLogoBadge";
import { useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";
import { landingContent } from "@/seo/landingContent";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";

const PublicHeader = () => {
  const { colorMode, toggleColorMode, iconComponent: IconComponent } = useColorThemeContext();
  const onAuthPage = useLocation().pathname.startsWith(getAuthenticationUrl());

  return (
    <Container component="header" maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <SeasonalLogoBadge size={22}>
          <Box sx={{ display: "flex", width: 160 }}>
            <Logo
              darkLogoSrc="/logo-dark-full-shareframe.svg"
              lightLogoSrc="/logo-light-full-shareframe.svg"
              alt="ShareFrame"
              width={240}
              height={62}
              marginRight={0}
            />
          </Box>
        </SeasonalLogoBadge>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={colorMode === "dark" ? "Wechsel in den hellen Modus" : "Wechsel in den dunklen Modus"}>
            <IconButton onClick={toggleColorMode}>
              <IconComponent />
            </IconButton>
          </Tooltip>
          {!onAuthPage && (
            <Button component={RouterLink} to={getAuthenticationUrl() + getSignInUrl()} variant="contained">
              {landingContent.signInLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default PublicHeader;
