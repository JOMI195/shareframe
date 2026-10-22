import { Box, Container, Typography } from "@mui/material";
import { landingContent } from "@/seo/landingContent";
import ResponsivePicture from "./responsivePicture";
import { heroPhoto } from "./landingImages";

const HeroSection = () => (
  <Container component="section" maxWidth="lg" aria-labelledby="landing-headline" sx={{ pt: { xs: 3, md: 6 }, pb: { xs: 8, md: 12 } }}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
        gap: { xs: 5, md: 8 },
        alignItems: "center",
      }}
    >
      <Box>
        <Typography
          id="landing-headline"
          variant="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "2.75rem" },
            lineHeight: 1.15,
            mb: 3,
          }}
        >
          {landingContent.headline}
        </Typography>
        <Typography sx={{ fontSize: { xs: "1.05rem", md: "1.15rem" }, lineHeight: 1.65, maxWidth: "34em", mb: 3 }}>
          {landingContent.lead}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", opacity: 0.8, maxWidth: "34em" }}>
          {landingContent.accessNote}
        </Typography>
      </Box>
      <Box>
        <ResponsivePicture
          picture={heroPhoto}
          alt={landingContent.heroPhotoAlt}
          sizes="(min-width: 1200px) 680px, (min-width: 900px) 56vw, 100vw"
          priority
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </Box>
  </Container>
);

export default HeroSection;
