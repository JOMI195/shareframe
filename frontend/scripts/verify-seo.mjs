import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "build");

const meta = readFileSync(join(root, "src/seo/pageMeta.ts"), "utf-8");
const paths = [...meta.matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
const prerendered = paths.filter((path) =>
  new RegExp(`path:\\s*"${path}"[\\s\\S]{0,600}?prerender:\\s*true`).test(meta),
);

const failures = [];
const seen = { title: new Map(), description: new Map() };

const readTag = (html, pattern, label, file) => {
  const match = html.match(pattern);
  if (!match || !match[1].trim()) {
    failures.push(`${file}: missing ${label}`);
    return null;
  }
  return match[1].trim();
};

if (!prerendered.length) {
  failures.push("pageMeta.ts declares no prerendered pages");
}

for (const path of prerendered) {
  const relative = path === "/" ? "index.html" : `${path.slice(1)}index.html`;
  const file = join(outDir, relative);

  if (!existsSync(file)) {
    failures.push(`${relative}: not generated`);
    continue;
  }
  if (!existsSync(`${file}.br`)) {
    failures.push(`${relative}: missing brotli sibling`);
  }

  const html = readFileSync(file, "utf-8");

  const title = readTag(html, /<title>([\s\S]*?)<\/title>/i, "<title>", relative);
  const description = readTag(
    html,
    /<meta\s+name="description"\s+content="([^"]*)"/i,
    "description",
    relative,
  );
  const canonical = readTag(
    html,
    /<link\s+rel="canonical"\s+href="([^"]*)"/i,
    "canonical",
    relative,
  );

  for (const [label, value] of [["title", title], ["description", description]]) {
    if (!value) continue;
    const previous = seen[label].get(value);
    if (previous) {
      failures.push(`${relative}: ${label} duplicated from ${previous}`);
    } else {
      seen[label].set(value, relative);
    }
  }

  if (canonical && !canonical.endsWith(path)) {
    failures.push(`${relative}: canonical "${canonical}" does not match ${path}`);
  }
  if (!/<div id="root">\s*<\w/.test(html)) {
    failures.push(`${relative}: no markup injected into #root`);
  }
  const headings = html.match(/<h1[\s>]/g) ?? [];
  if (headings.length !== 1) {
    failures.push(`${relative}: expected one <h1>, found ${headings.length}`);
  }
  const root = html.slice(html.indexOf('<div id="root">'));
  for (const img of root.match(/<img[^>]*>/g) ?? []) {
    const src = img.match(/\ssrc="([^"]*)"/)?.[1] ?? "?";
    if (!/\salt="[^"]+"/.test(img)) failures.push(`${relative}: <img> ${src} has no alt text`);
    if (src.startsWith("/assets/") && !(/\swidth="\d+"/.test(img) && /\sheight="\d+"/.test(img))) {
      failures.push(`${relative}: <img> ${src} has no width/height`);
    }
  }

  const ogImage = readTag(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i, "og:image", relative);
  if (ogImage && !existsSync(join(outDir, new URL(ogImage).pathname))) {
    failures.push(`${relative}: og:image ${ogImage} is not in the build`);
  }

  if (path === "/") {
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    try {
      const types = JSON.parse(jsonLd ?? "")["@graph"].map((node) => node["@type"]);
      for (const type of ["Organization", "WebSite"]) {
        if (!types.includes(type)) failures.push(`${relative}: JSON-LD has no ${type}`);
      }
    } catch {
      failures.push(`${relative}: JSON-LD missing or invalid`);
    }
  }

  if (path === "/" && !/<style data-emotion="css /.test(html)) {
    failures.push(`${relative}: server-rendered styles missing`);
  }
  if (/Deine Vorteile mit ShareFrame/.test(html)) {
    failures.push(`${relative}: old duplicated <noscript> block still present`);
  }
}

const sitemapFile = join(outDir, "sitemap.xml");
if (!existsSync(sitemapFile) || !existsSync(`${sitemapFile}.br`)) {
  failures.push("sitemap.xml: not generated");
} else {
  const sitemap = readFileSync(sitemapFile, "utf-8");
  for (const path of prerendered) {
    if (!sitemap.includes(`<loc>https://www.shareframe.de${path}</loc>`)) {
      failures.push(`sitemap.xml: ${path} missing`);
    }
  }
  for (const [, image] of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    if (!existsSync(join(outDir, new URL(image).pathname))) {
      failures.push(`sitemap.xml: image ${image} is not in the build`);
    }
  }
}

const appRoutes = paths.filter((path) => !prerendered.includes(path));
for (const path of appRoutes) {
  if (!new RegExp(`path:\\s*"${path}"[\\s\\S]{0,600}?noindex:\\s*true`).test(meta)) {
    failures.push(`pageMeta.ts: ${path} is neither prerendered nor noindex`);
  }
}

if (failures.length) {
  console.error("SEO verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`SEO verification passed (${prerendered.length} prerendered pages).`);
