export const SITE_NAME = "ShareFrame";
export const SITE_ORIGIN = "https://www.shareframe.de";
export const OG_IMAGE = "/web-app-manifest-512x512.png";

export interface PageMeta {
  path: string;
  title: string;
  description?: string;
  prerender?: boolean;
  noindex?: boolean;
  matchPrefix?: boolean;
}

export const pages: PageMeta[] = [
  {
    path: "/",
    title: "ShareFrame – Fotos auf digitale Bilderrahmen teilen",
    description:
      "Sende deine schönsten Momente direkt auf die digitalen Bilderrahmen von Freunden und Familie. Jetzt bei ShareFrame anmelden.",
    prerender: true,
  },
  {
    path: "/kontakt/",
    title: "Kontakt – ShareFrame",
    description:
      "Fragen zu ShareFrame, zu digitalen Bilderrahmen oder zu deinem Konto? Schreib uns über das Kontaktformular – wir melden uns zurück.",
    prerender: true,
  },
  {
    path: "/datenschutzerklaerung/",
    title: "Datenschutzerklärung – ShareFrame",
    description:
      "Wie ShareFrame personenbezogene Daten verarbeitet: Nutzerkonto, Bilder, Cookies, Webhosting und deine Rechte nach DSGVO.",
    prerender: true,
  },
  {
    path: "/impressum/",
    title: "Impressum – ShareFrame",
    description:
      "Anbieterkennzeichnung nach § 5 TMG: Herausgeber, Kontaktdaten und Urheberrechtshinweise zu shareframe.de.",
    prerender: true,
  },
  { path: "/auth/", title: "Anmelden – ShareFrame", noindex: true, matchPrefix: true },
  { path: "/dashboard/", title: "Start – ShareFrame", noindex: true },
  { path: "/fotos/", title: "Fotos – ShareFrame", noindex: true },
  { path: "/aktivitaeten/", title: "Aktivitäten – ShareFrame", noindex: true },
  { path: "/freunde/", title: "Freunde – ShareFrame", noindex: true },
  { path: "/bilderrahmen/", title: "Bilderrahmen – ShareFrame", noindex: true },
  { path: "/aenderungen/", title: "Änderungen – ShareFrame", noindex: true },
  { path: "/settings/", title: "Einstellungen – ShareFrame", noindex: true, matchPrefix: true },
];

export const prerenderedPages = pages.filter((page) => page.prerender);

export const canonicalUrl = (path: string) => SITE_ORIGIN + path;

const normalizePath = (pathname: string) => {
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
};

export const findPageMeta = (pathname: string): PageMeta => {
  const path = normalizePath(pathname);

  const exact = pages.find((page) => page.path === path);
  if (exact) return exact;

  const prefixed = pages
    .filter((page) => page.matchPrefix && path.startsWith(page.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (prefixed) return prefixed;

  return { ...pages[0], path, prerender: false, noindex: true };
};
