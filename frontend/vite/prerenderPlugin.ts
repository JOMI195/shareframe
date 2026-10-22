import { constants, brotliCompress } from "node:zlib";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { build, type Plugin, type ResolvedConfig } from "vite";
import {
  OG_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  canonicalUrl,
  prerenderedPages,
  type PageMeta,
} from "../src/seo/pageMeta.ts";
import { prerenderMarkup } from "../src/seo/prerenderMarkup.ts";
import type { RenderedPage } from "../src/seo/ssrEntry.tsx";

const compress = promisify(brotliCompress);

const STRIPPED_HEAD_TAGS = [
  /[ \t]*<!--\s*(SEO Meta Tags|Social|Robots)\s*-->\r?\n?/gi,
  /[ \t]*<title>[\s\S]*?<\/title>\r?\n?/gi,
  /[ \t]*<meta\s+name="description"[^>]*>\r?\n?/gi,
  /[ \t]*<meta\s+name="robots"[^>]*>\r?\n?/gi,
  /[ \t]*<link\s+rel="canonical"[^>]*>\r?\n?/gi,
  /[ \t]*<meta\s+property="og:[^"]*"[^>]*>\r?\n?/gi,
  /[ \t]*<meta\s+name="twitter:[^"]*"[^>]*>\r?\n?/gi,
];

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const siteJsonLd = () =>
  `  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: SITE_ORIGIN + "/logo-light-full-shareframe.svg",
        email: "info@shareframe.de",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_ORIGIN}/#website`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        inLanguage: "de-DE",
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
      },
    ],
  })}</script>\n`;

const headTags = (page: PageMeta) => {
  const url = canonicalUrl(page.path);
  const image = SITE_ORIGIN + OG_IMAGE.src;
  const imageAlt = escapeAttribute(OG_IMAGE.alt);
  const title = escapeAttribute(page.title);
  const description = page.description ? escapeAttribute(page.description) : "";
  const descriptionTag = (attribute: "name" | "property", key: string) =>
    description ? [`<meta ${attribute}="${key}" content="${description}" />`] : [];

  const tags = [
    `<title>${page.title}</title>`,
    ...descriptionTag("name", "description"),
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${page.noindex ? "noindex, nofollow" : "index, follow"}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    ...descriptionTag("property", "og:description"),
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    ...descriptionTag("name", "twitter:description"),
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
  ];

  return tags.map((tag) => `  ${tag}`).join("\n") + "\n";
};

const SSR_ENTRY = "src/seo/ssrEntry.tsx";
const SSR_OUT_DIR = "dist-ssr";

interface SsrModule {
  render: (path: string) => RenderedPage;
  renderedPaths: string[];
}

// Same config file as the client build, so asset URLs in the markup match the emitted files.
const loadSsrModule = async (config: ResolvedConfig): Promise<SsrModule> => {
  const outDir = resolve(config.root, SSR_OUT_DIR);
  await build({
    configFile: config.configFile,
    mode: config.mode,
    logLevel: "warn",
    build: { ssr: SSR_ENTRY, outDir, emptyOutDir: true },
  });
  return import(pathToFileURL(join(outDir, "ssrEntry.js")).href);
};

const renderPage = (ssr: SsrModule, page: PageMeta): RenderedPage => {
  if (ssr.renderedPaths.includes(page.path)) {
    return ssr.render(page.path);
  }

  const html = prerenderMarkup[page.path];
  if (!html) {
    throw new Error(`[prerender] no markup defined for ${page.path}`);
  }
  return { html, styles: "" };
};

const buildPage = (template: string, page: PageMeta, rendered: RenderedPage) => {
  const stripped = STRIPPED_HEAD_TAGS.reduce(
    (html, pattern) => html.replace(pattern, ""),
    template,
  );

  const jsonLd = page.path === "/" ? siteJsonLd() : "";
  const withHead = stripped.replace(
    "</head>",
    `${headTags(page)}${jsonLd}${rendered.styles}</head>`,
  );

  return withHead.replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`);
};

// Image URLs carry content hashes, so the sitemap is written from the rendered pages.
const sitemap = (entries: { page: PageMeta; html: string }[]) => {
  const urls = entries
    .filter(({ page }) => !page.noindex)
    .map(({ page, html }) => {
      const images = [...new Set([...html.matchAll(/<img[^>]*\ssrc="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
        .map((src) => `\n    <image:image><image:loc>${SITE_ORIGIN}${src}</image:loc></image:image>`)
        .join("");
      return `  <url>\n    <loc>${canonicalUrl(page.path)}</loc>${images}\n  </url>`;
    });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
};

const writeWithBrotli = async (target: string, content: string) => {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf-8");
  await writeFile(
    `${target}.br`,
    await compress(Buffer.from(content), {
      params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
    }),
  );
};

const prerenderPlugin = (): Plugin => {
  let config: ResolvedConfig;

  return {
    name: "shareframe:prerender",
    apply: "build",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      if (config.build.ssr) return;

      const outDir = resolve(config.root, config.build.outDir);
      const template = readFileSync(join(outDir, "index.html"), "utf-8");
      const ssr = await loadSsrModule(config);
      const rendered: { page: PageMeta; html: string }[] = [];

      for (const page of prerenderedPages) {
        const relative = page.path === "/" ? "index.html" : `${page.path.slice(1)}index.html`;
        const html = buildPage(template, page, renderPage(ssr, page));

        await writeWithBrotli(join(outDir, relative), html);
        rendered.push({ page, html });
        config.logger.info(`prerendered ${relative}`);
      }

      await writeWithBrotli(join(outDir, "sitemap.xml"), sitemap(rendered));

      await rm(resolve(config.root, SSR_OUT_DIR), { recursive: true, force: true });
    },
  };
};

export default prerenderPlugin;
