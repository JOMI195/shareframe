import type { UnknownAction } from "redux";

const ERROR_MESSAGES: Record<string, string> = {
  serial_required: "Bitte gib die Seriennummer deines Bilderrahmens ein.",
  frame_unavailable: "Diesen Bilderrahmen können wir nicht hinzufügen. Prüfe die Seriennummer. Gehört er schon jemandem, muss er ihn zuerst entfernen.",
  frame_not_found: "Diesen Bilderrahmen gibt es in deinem Konto nicht mehr.",
  receiver_required: "Wähle mindestens einen Empfänger.",
  image_required: "Wähle ein Foto aus.",
  timestamp_invalid: "Der Zeitpunkt ist ungültig.",
  timestamp_past: "Der Zeitpunkt liegt in der Vergangenheit.",
  schedule_too_far: "Der geplante Zeitpunkt liegt zu weit in der Zukunft.",
  expiry_before_schedule: "Die Anzeigedauer muss nach dem geplanten Zeitpunkt enden.",
  image_not_found: "Dieses Foto gibt es nicht mehr.",
  receiver_not_found: "Mit dieser Person bist du nicht mehr befreundet.",
  friend_code_unknown: "Zu diesem Freundescode haben wir niemanden gefunden. Prüfe den Code.",
  friend_request_self: "Das ist dein eigener Freundescode.",
  friend_request_pending: "Du hast dieser Person schon eine Anfrage geschickt.",
  friendship_exists: "Ihr seid bereits befreundet.",
  friend_request_gone: "Diese Anfrage gibt es nicht mehr. Vielleicht wurde sie schon beantwortet.",
  friendship_not_found: "Diese Freundschaft gibt es nicht mehr.",
  wrong_password: "Das Passwort stimmt nicht.",
  password_invalid: "Dieses Passwort ist nicht erlaubt. Wähle ein anderes.",
  password_mismatch: "Die neuen Passwörter stimmen nicht überein.",
  reset_link_invalid: "Der Link ist abgelaufen oder wurde schon benutzt.",
  throttled: "Zu viele Versuche. Bitte warte kurz.",
};

export const errorMessageFor = (code: unknown): string | undefined =>
  typeof code === "string" ? ERROR_MESSAGES[code] : undefined;

export const errorCodeOf = (action: UnknownAction): string | undefined => {
  const meta = (action as { meta?: { code?: unknown } }).meta;
  return typeof meta?.code === "string" ? meta.code : undefined;
};

// Backend texts are English, so only a known code replaces the reducer's own text.
export const errorText = (action: UnknownAction, fallback: string): string =>
  errorMessageFor(errorCodeOf(action)) ?? fallback;
