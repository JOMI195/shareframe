import { constants, brotliCompress } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { Plugin, ResolvedConfig } from "vite";
import {
  OG_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  canonicalUrl,
  prerenderedPages,
  type PageMeta,
} from "../src/seo/pageMeta";
import { prerenderMarkup } from "../src/seo/prerenderMarkup";

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

const organizationJsonLd = () =>
  `  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: SITE_ORIGIN + "/logo-light-full-shareframe.svg",
    email: "info@shareframe.de",
  })}</script>\n`;

const headTags = (page: PageMeta) => {
  const url = canonicalUrl(page.path);
  const image = SITE_ORIGIN + OG_IMAGE;
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
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    ...descriptionTag("name", "twitter:description"),
    `<meta name="twitter:image" content="${image}" />`,
  ];

  return tags.map((tag) => `  ${tag}`).join("\n") + "\n";
};

const buildPage = (template: string, page: PageMeta) => {
  const stripped = STRIPPED_HEAD_TAGS.reduce(
    (html, pattern) => html.replace(pattern, ""),
    template,
  );

  const jsonLd = page.path === "/" ? organizationJsonLd() : "";
  const withHead = stripped.replace("</head>", `${headTags(page)}${jsonLd}</head>`);

  const markup = prerenderMarkup[page.path];
  if (!markup) {
    throw new Error(`[prerender] no markup defined for ${page.path}`);
  }

  return withHead.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
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
      const outDir = resolve(config.root, config.build.outDir);
      const template = readFileSync(join(outDir, "index.html"), "utf-8");

      for (const page of prerenderedPages) {
        const relative = page.path === "/" ? "index.html" : `${page.path.slice(1)}index.html`;
        const target = join(outDir, relative);
        const html = buildPage(template, page);

        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, html, "utf-8");
        await writeFile(
          `${target}.br`,
          await compress(Buffer.from(html), {
            params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
          }),
        );

        config.logger.info(`prerendered ${relative}`);
      }
    },
  };
};

export default prerenderPlugin;
