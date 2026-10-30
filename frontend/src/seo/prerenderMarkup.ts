const FONT_STACK =
  "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const shell = (inner: string) =>
  `<div style="max-width:760px;margin:0 auto;padding:48px 24px;font-family:${FONT_STACK}">${inner}</div>`;

const wordmark =
  `<a href="/"><img src="/logo-light-full-shareframe.svg" alt="ShareFrame" width="220" style="max-width:100%;height:auto" /></a>`;

const stub = (heading: string, body: string) =>
  shell(
    [
      `<div style="text-align:center;margin:0 0 40px">${wordmark}</div>`,
      `<h1 style="font-size:1.75rem;margin:0 0 12px">${heading}</h1>`,
      `<p style="margin:0">${body}</p>`,
    ].join(""),
  );

export const prerenderMarkup: Record<string, string> = {
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
    "Anbieterkennzeichnung nach § 5 DDG mit Herausgeber, Kontaktdaten und Urheberrechtshinweisen zu shareframe.de.",
  ),
};
