import { Box, Container } from "@mui/material";
import { Navigate } from "react-router";
import SeasonalDecoration from "@/common/components/seasonal/seasonalDecoration";
import SeasonalFlyby from "@/common/components/seasonal/seasonalFlyby";
import PublicFooter from "@/common/components/layout/bottomLayout/publicFooter";
import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";
import PublicHeader from "@/common/components/layout/topLayout/publicHeader";
import HeroSection from "./heroSection";
import FeaturesSection from "./featuresSection";
import ScreenshotShowcase from "./screenshotShowcase";

const Landing = () => {
  if (typeof window !== "undefined" && localStorage.getItem("loggedIn") === "true") {
    return <Navigate to={getDashboardUrl()} replace />;
  }

  return (
    <Box sx={{ position: "relative", overflowX: "clip" }}>
      <PublicHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ScreenshotShowcase />
      </main>
      <Container component="footer" maxWidth="lg" sx={{ py: 5 }}>
        <PublicFooter sx={{ display: "block" }} />
      </Container>
      <SeasonalDecoration top={0} />
      <SeasonalFlyby />
    </Box>
  );
};

export default Landing;
