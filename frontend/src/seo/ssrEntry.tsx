import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import { CssBaseline, ThemeProvider } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import light from "@/common/themes/lightTheme";
import { ColorThemeContext, type ColorThemeContextType } from "@/context/colorTheme/colorThemeContextValue";
import Landing from "@/main/landing/landing";

const colorTheme: ColorThemeContextType = {
  theme: light,
  colorMode: "light",
  colorPreference: "light",
  season: null,
  setColorPreference: () => undefined,
  toggleColorMode: () => undefined,
  iconComponent: LightModeIcon,
};

export interface RenderedPage {
  html: string;
  styles: string;
}

const pages: Record<string, () => React.ReactElement> = {
  "/": () => <Landing />,
};

export const renderedPaths = Object.keys(pages);

export const render = (path: string): RenderedPage => {
  const page = pages[path];
  if (!page) {
    throw new Error(`[ssr] no component for ${path}`);
  }

  // Same key as the client's default cache, so it adopts these rules instead of re-inserting them.
  const cache = createCache({ key: "css" });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const html = renderToString(
    <CacheProvider value={cache}>
      <ColorThemeContext.Provider value={colorTheme}>
        <ThemeProvider theme={light}>
          <CssBaseline enableColorScheme />
          <MemoryRouter initialEntries={[path]}>{page()}</MemoryRouter>
        </ThemeProvider>
      </ColorThemeContext.Provider>
    </CacheProvider>,
  );

  return { html, styles: constructStyleTagsFromChunks(extractCriticalToChunks(html)) };
};
