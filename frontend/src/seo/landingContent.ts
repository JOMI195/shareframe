export type ScreenshotId = "dashboard" | "fotos" | "aktivitaeten" | "freunde" | "bilderrahmen";

export const landingContent = {
  headline: "Fotos auf digitale Bilderrahmen senden",
  lead: "ShareFrame besteht aus einem digitalen Bilderrahmen mit E-Paper-Display und einer Web-App. In der Web-App werden Fotos hochgeladen und an den eigenen Rahmen oder an die Rahmen von Freunden gesendet. Der Rahmen zeigt die Fotos als Diashow.",
  accessNote: "ShareFrame ist ein privates Projekt. Eine Registrierung ist derzeit nicht möglich.",
  signInLabel: "Anmelden",
  heroPhotoAlt: "ShareFrame-Bilderrahmen mit E-Paper-Display",

  featuresHeading: "Funktionen",
  features: [
    {
      title: "Fotos senden",
      text: "Foto hochladen, Rahmen auswählen und senden. Optional mit Text im Bild.",
    },
    {
      title: "Freunde",
      text: "Freunde werden über einen Freundescode hinzugefügt. Danach können Fotos auch an ihre Rahmen gesendet werden.",
    },
    {
      title: "E-Paper-Display",
      text: "Das Display leuchtet nicht und benötigt nur beim Bildwechsel Strom. Fotos werden in Schwarz-Weiß dargestellt.",
    },
    {
      title: "Anzeigedauer",
      text: "Für jedes Foto wird festgelegt, wie lange es in der Diashow bleibt. Gesendete Fotos lassen sich jederzeit wieder entfernen.",
    },
    {
      title: "Keine Werbung",
      text: "Es gibt keinen Feed und keine Werbung. Ein Foto sehen nur Absender und Empfänger.",
    },
    {
      title: "Automatische Updates",
      text: "Die Rahmen installieren Updates automatisch. Änderungen werden in der App angezeigt.",
    },
  ],

  insideHeading: "Hardware",
  insideText: "Im Rahmen arbeitet ein Raspberry Pi Zero. Er ist per WLAN mit dem Server verbunden, empfängt neue Fotos und steuert das 7,5-Zoll-E-Paper-Display mit 800 × 480 Pixeln.",
  insidePhotoAlt: "Rückseite des Bilderrahmens mit Raspberry Pi Zero",

  screenshotsHeading: "Screenshots",
  screenshots: [
    { id: "dashboard", label: "Start", caption: "Übersicht über Fotos, Rahmen und letzte Aktivitäten." },
    { id: "fotos", label: "Fotos", caption: "Fotobibliothek zum Hochladen und Senden von Fotos." },
    { id: "aktivitaeten", label: "Aktivitäten", caption: "Verlauf gesendeter und empfangener Fotos mit Status und Filtern." },
    { id: "freunde", label: "Freunde", caption: "Freunde hinzufügen und Anfragen verwalten." },
    { id: "bilderrahmen", label: "Bilderrahmen", caption: "Verbinden und Verwalten der eigenen Rahmen." },
  ] satisfies { id: ScreenshotId; label: string; caption: string }[],
};
