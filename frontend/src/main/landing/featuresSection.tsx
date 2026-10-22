import { Box, Container, Typography } from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import ContrastIcon from "@mui/icons-material/Contrast";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import BlockIcon from "@mui/icons-material/Block";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { landingContent } from "@/seo/landingContent";
import ResponsivePicture from "./responsivePicture";
import { insidePhoto } from "./landingImages";
import { sectionHeadingSx } from "./typography";

const icons = [SendOutlinedIcon, PeopleOutlineIcon, ContrastIcon, TimerOutlinedIcon, BlockIcon, AutorenewIcon];

const FeaturesSection = () => (
  <Box component="section" aria-labelledby="landing-features" sx={{ bgcolor: "background.paper", py: { xs: 8, md: 12 } }}>
    <Container maxWidth="lg">
      <Typography id="landing-features" variant="h2" sx={sectionHeadingSx}>
        {landingContent.featuresHeading}
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          columnGap: 6,
          rowGap: { xs: 4, md: 6 },
        }}
      >
        {landingContent.features.map((feature, index) => {
          const Icon = icons[index];
          return (
            <Box component="li" key={feature.title} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Icon aria-hidden sx={{ color: "primary.main", fontSize: 28, mt: 0.25 }} />
              <Box>
                <Typography component="h3" variant="subtitle1" sx={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.35, mb: 0.75 }}>
                  {feature.title}
                </Typography>
                <Typography sx={{ lineHeight: 1.6, color: "text.secondary" }}>{feature.text}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "6fr 5fr" },
          gap: { xs: 4, md: 8 },
          alignItems: "center",
          mt: { xs: 10, md: 14 },
        }}
      >
        <Box>
          <ResponsivePicture
            picture={insidePhoto}
            alt={landingContent.insidePhotoAlt}
            sizes="(min-width: 1200px) 600px, (min-width: 900px) 52vw, 100vw"
            sx={{ borderRadius: 1 }}
          />
        </Box>
        <Box>
          <Typography component="h3" sx={{ fontWeight: 600, fontSize: { xs: "1.25rem", md: "1.5rem" }, mb: 2 }}>
            {landingContent.insideHeading}
          </Typography>
          <Typography sx={{ lineHeight: 1.7, maxWidth: "32em" }}>{landingContent.insideText}</Typography>
        </Box>
      </Box>
    </Container>
  </Box>
);

export default FeaturesSection;
