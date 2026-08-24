import { useEffect } from "react";
import { useLocation } from "react-router";
import { OG_IMAGE, SITE_NAME, SITE_ORIGIN, canonicalUrl, findPageMeta } from "./pageMeta";

const upsertMeta = (attribute: "name" | "property", key: string, content?: string) => {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!content) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.content = content;
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = content;
  document.head.appendChild(meta);
};

const upsertCanonical = (href: string) => {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (existing) {
    existing.href = href;
    return;
  }

  const link = document.createElement("link");
  link.rel = "canonical";
  link.href = href;
  document.head.appendChild(link);
};

const useSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = findPageMeta(pathname);
    const url = canonicalUrl(page.path);
    const image = SITE_ORIGIN + OG_IMAGE;

    document.title = page.title;
    upsertCanonical(url);
    upsertMeta("name", "description", page.description);
    upsertMeta("name", "robots", page.noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "de_DE");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", page.title);
    upsertMeta("property", "og:description", page.description);
    upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", page.title);
    upsertMeta("name", "twitter:description", page.description);
    upsertMeta("name", "twitter:image", image);
  }, [pathname]);
};

export default useSeo;
