import type { ColorMode } from "@/context/colorTheme/colorThemeContextValue";
import type { ScreenshotId } from "@/seo/landingContent";
import heroPhoto from "@/assets/landing/photos/bilderrahmen-vorderseite.jpeg?w=640;960;1440;2000&format=avif;webp&as=picture";
import insidePhoto from "@/assets/landing/photos/bilderrahmen-rueckseite.jpeg?w=640;960;1440&format=avif;webp&as=picture";
import dashboardLight from "@/assets/landing/screenshots/dashboard-light.png?w=960;1440;2160&format=avif;webp&as=picture";
import dashboardDark from "@/assets/landing/screenshots/dashboard-dark.png?w=960;1440;2160&format=avif;webp&as=picture";
import fotosLight from "@/assets/landing/screenshots/fotos-light.png?w=960;1440;2160&format=avif;webp&as=picture";
import fotosDark from "@/assets/landing/screenshots/fotos-dark.png?w=960;1440;2160&format=avif;webp&as=picture";
import aktivitaetenLight from "@/assets/landing/screenshots/aktivitaeten-light.png?w=960;1440;2160&format=avif;webp&as=picture";
import aktivitaetenDark from "@/assets/landing/screenshots/aktivitaeten-dark.png?w=960;1440;2160&format=avif;webp&as=picture";
import bilderrahmenLight from "@/assets/landing/screenshots/bilderrahmen-light.png?w=960;1440;2160&format=avif;webp&as=picture";
import bilderrahmenDark from "@/assets/landing/screenshots/bilderrahmen-dark.png?w=960;1440;2160&format=avif;webp&as=picture";
import freundeLight from "@/assets/landing/screenshots/freunde-light.png?w=960;1440;2160&format=avif;webp&as=picture";
import freundeDark from "@/assets/landing/screenshots/freunde-dark.png?w=960;1440;2160&format=avif;webp&as=picture";
import dashboardMobileLight from "@/assets/landing/screenshots/dashboard-mobil-light.png?w=390;780&format=avif;webp&as=picture";
import dashboardMobileDark from "@/assets/landing/screenshots/dashboard-mobil-dark.png?w=390;780&format=avif;webp&as=picture";
import fotosMobileLight from "@/assets/landing/screenshots/fotos-mobil-light.png?w=390;780&format=avif;webp&as=picture";
import fotosMobileDark from "@/assets/landing/screenshots/fotos-mobil-dark.png?w=390;780&format=avif;webp&as=picture";
import aktivitaetenMobileLight from "@/assets/landing/screenshots/aktivitaeten-mobil-light.png?w=390;780&format=avif;webp&as=picture";
import aktivitaetenMobileDark from "@/assets/landing/screenshots/aktivitaeten-mobil-dark.png?w=390;780&format=avif;webp&as=picture";
import bilderrahmenMobileLight from "@/assets/landing/screenshots/bilderrahmen-mobil-light.png?w=390;780&format=avif;webp&as=picture";
import bilderrahmenMobileDark from "@/assets/landing/screenshots/bilderrahmen-mobil-dark.png?w=390;780&format=avif;webp&as=picture";
import freundeMobileLight from "@/assets/landing/screenshots/freunde-mobil-light.png?w=390;780&format=avif;webp&as=picture";
import freundeMobileDark from "@/assets/landing/screenshots/freunde-mobil-dark.png?w=390;780&format=avif;webp&as=picture";

export type Picture = typeof heroPhoto;

export { heroPhoto, insidePhoto };

export const screenshots: Record<ScreenshotId, Record<ColorMode, { desktop: Picture; mobile: Picture }>> = {
  dashboard: {
    light: { desktop: dashboardLight, mobile: dashboardMobileLight },
    dark: { desktop: dashboardDark, mobile: dashboardMobileDark },
  },
  fotos: {
    light: { desktop: fotosLight, mobile: fotosMobileLight },
    dark: { desktop: fotosDark, mobile: fotosMobileDark },
  },
  aktivitaeten: {
    light: { desktop: aktivitaetenLight, mobile: aktivitaetenMobileLight },
    dark: { desktop: aktivitaetenDark, mobile: aktivitaetenMobileDark },
  },
  bilderrahmen: {
    light: { desktop: bilderrahmenLight, mobile: bilderrahmenMobileLight },
    dark: { desktop: bilderrahmenDark, mobile: bilderrahmenMobileDark },
  },
  freunde: {
    light: { desktop: freundeLight, mobile: freundeMobileLight },
    dark: { desktop: freundeDark, mobile: freundeMobileDark },
  },
};
