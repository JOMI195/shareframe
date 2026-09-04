import { landingContent } from "./landingContent.ts";

const FONT_STACK =
  "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const shell = (inner: string, align: "center" | "left") =>
  `<div style="max-width:760px;margin:0 auto;padding:48px 24px;font-family:${FONT_STACK};text-align:${align}">${inner}</div>`;

const wordmark =
  `<a href="/"><img src="/logo-light-full-shareframe.svg" alt="ShareFrame" width="220" style="max-width:100%;height:auto" /></a>`;

const stub = (heading: string, body: string) =>
  shell(
    [
      `<div style="text-align:center;margin:0 0 40px">${wordmark}</div>`,
      `<h1 style="font-size:1.75rem;margin:0 0 12px">${heading}</h1>`,
      `<p style="margin:0">${body}</p>`,
    ].join(""),
    "left",
  );

export const prerenderMarkup: Record<string, string> = {
  "/": shell(
    [
      `<img src="/logo-light-full-shareframe.svg" alt="ShareFrame" width="220" style="max-width:100%;height:auto" />`,
      `<img src="/frame-3d.svg" alt="Digitaler Bilderrahmen von ShareFrame" width="280" style="max-width:100%;height:auto;margin-top:24px" />`,
      `<h1 style="font-size:2rem;margin:32px 0 16px">${landingContent.headline}</h1>`,
      `<p style="font-size:1.05rem;line-height:1.6;margin:0 0 32px">${landingContent.lead}</p>`,
      `<p style="margin:0 0 24px"><a href="/auth/sign-in/" style="display:inline-block;padding:12px 32px;border-radius:10px;background:#8b5cf6;color:#fff;text-decoration:none">${landingContent.ctaLabel}</a></p>`,
      `<p style="margin:0 0 32px;font-size:0.9rem">${landingContent.contactHint}</p>`,
      `<p style="font-size:0.8rem"><a href="/kontakt/">Kontakt</a> · <a href="/datenschutzerklaerung/">Datenschutzerklärung</a> · <a href="/impressum/">Impressum</a></p>`,
    ].join(""),
    "center",
  ),
  "/kontakt/": stub(
    "Kontakt",
    "Schreib uns über das Kontaktformular – bei Fragen zu ShareFrame, zu digitalen Bilderrahmen oder zu deinem Konto.",
  ),
  "/datenschutzerklaerung/": stub(
    "Datenschutzerklärung",
    "Informationen darüber, welche personenbezogenen Daten ShareFrame zu welchen Zwecken verarbeitet und welche Rechte dir nach DSGVO zustehen.",
  ),
  "/impressum/": stub(
    "Impressum",
    "Anbieterkennzeichnung nach § 5 TMG mit Herausgeber, Kontaktdaten und Urheberrechtshinweisen zu shareframe.de.",
  ),
};
