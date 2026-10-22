import { useState } from "react";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";
import { landingContent, type ScreenshotId } from "@/seo/landingContent";
import ResponsivePicture from "./responsivePicture";
import { screenshots } from "./landingImages";
import { sectionHeadingSx } from "./typography";

const ScreenshotShowcase = () => {
  const { colorMode } = useColorThemeContext();
  const [selected, setSelected] = useState<ScreenshotId>("dashboard");
  const shot = landingContent.screenshots.find((s) => s.id === selected)!;
  const pictures = screenshots[selected][colorMode];
  const alt = `Screenshot der ShareFrame-App: ${shot.label}`;

  return (
    <Container component="section" maxWidth="lg" aria-labelledby="landing-screenshots" sx={{ py: { xs: 8, md: 12 } }}>
      <Typography id="landing-screenshots" variant="h2" sx={{ ...sectionHeadingSx, mb: { xs: 2, md: 3 } }}>
        {landingContent.screenshotsHeading}
      </Typography>
      <Tabs
        value={selected}
        onChange={(_, value: ScreenshotId) => setSelected(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={landingContent.screenshotsHeading}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        {landingContent.screenshots.map((s) => (
          <Tab
            key={s.id}
            value={s.id}
            label={s.label}
            id={`screenshot-tab-${s.id}`}
            aria-controls="screenshot-panel"
            sx={{ textTransform: "none", fontSize: "1rem", minWidth: 0, px: { xs: 1.5, md: 2.5 } }}
          />
        ))}
      </Tabs>

      <Box role="tabpanel" id="screenshot-panel" aria-labelledby={`screenshot-tab-${selected}`}>
        <Box component="figure" sx={{ m: 0, position: "relative", pb: { md: 6 } }}>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "82%",
              borderRadius: 2,
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
            }}
          >
            <ResponsivePicture picture={pictures.desktop} alt={alt} sizes="(min-width: 1200px) 960px, 80vw" />
          </Box>
          <Box
            sx={{
              width: { xs: "min(78%, 320px)", md: "24%" },
              mx: { xs: "auto", md: 0 },
              position: { md: "absolute" },
              right: { md: 0 },
              bottom: { md: 0 },
              border: "8px solid",
              borderColor: "grey.900",
              borderRadius: "28px",
              overflow: "hidden",
              bgcolor: "grey.900",
              outline: (theme) => (theme.palette.mode === "dark" ? `1px solid ${theme.palette.divider}` : "none"),
            }}
          >
            <ResponsivePicture picture={pictures.mobile} alt={`${alt} auf dem Smartphone`} sizes="(min-width: 900px) 280px, 78vw" />
          </Box>
          <Typography
            component="figcaption"
            aria-live="polite"
            sx={{ mt: { xs: 3, md: 4 }, fontSize: { xs: "1.1rem", md: "1.25rem" }, lineHeight: 1.5, maxWidth: { md: "60%" }, textAlign: { xs: "center", md: "left" }, color: "text.secondary" }}
          >
            {shot.caption}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ScreenshotShowcase;
