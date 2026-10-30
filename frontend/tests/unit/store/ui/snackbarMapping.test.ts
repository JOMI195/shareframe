import { describe, expect, it } from 'vitest';
import type { Action, Reducer } from '@reduxjs/toolkit';
import authReducer from '@/store/ui/authentication/authentication.slice';
import framesReducer from '@/store/ui/frames/frames.slice';
import friendshipsReducer from '@/store/ui/friendships/friendships.slice';
import contactReducer from '@/store/ui/contact/contact.slice';
import * as authActions from '@/store/entities/authentication/authentication.slice';
import * as framesActions from '@/store/entities/frames/frames.slice';
import * as friendshipsActions from '@/store/entities/friendships/friendships.slice';
import * as contactActions from '@/store/entities/contact/contact.slice';

type Snackbar = { alert: { open: boolean; message: string; severity: string }; loading: { open: boolean; message: string } };

// Runs every entity action through the ui reducer and snapshots the snackbar it
// produces. Any changed wording, severity or missing handler shows up here.
const snackbarMap = <S extends { snackbar: Snackbar }>(
  reducer: Reducer<S>,
  actions: Record<string, unknown>,
) => {
  const initial = reducer(undefined, { type: '@@init' } as Action);

  return Object.entries(actions)
    .filter(([, value]) => typeof value === 'function' && 'type' in (value as object))
    .reduce<Record<string, string>>((acc, [name, creator]) => {
      const action = (creator as (payload?: unknown) => Action)(undefined);
      const { alert, loading } = reducer(initial, action).snackbar;
      if (!alert.open && !loading.open) return acc;

      acc[name] = loading.open ? `loading: ${loading.message}` : `${alert.severity}: ${alert.message}`;
      return acc;
    }, {});
};

describe('authentication ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(authReducer, authActions)).toMatchInlineSnapshot(`
      {
        "authenticationFulfilled": "success: Anmeldung erfolgreich",
        "authenticationPending": "loading: Du wirst angemeldet",
        "authenticationRejected": "error: Anmeldung fehlgeschlagen",
        "emailChangeConfirmFulfilled": "success: E-Mail-Adresse geändert. Melde dich ab jetzt mit der neuen Adresse an",
        "emailChangeConfirmPending": "loading: E-Mail-Adresse wird bestätigt",
        "emailChangeConfirmRejected": "error: Bestätigung der E-Mail-Adresse fehlgeschlagen",
        "emailChangeRequestFulfilled": "success: Bestätigungslink an die neue E-Mail-Adresse gesendet",
        "emailChangeRequestPending": "loading: Bestätigungslink wird gesendet",
        "emailChangeRequestRejected": "error: Änderung der E-Mail-Adresse fehlgeschlagen",
        "passwordResetFulfilled": "success: E-Mail zum Zurücksetzen gesendet",
        "passwordResetPending": "loading: E-Mail wird gesendet",
        "passwordResetRejected": "error: E-Mail konnte nicht gesendet werden",
        "passwordUpdateFulfilled": "success: Passwort geändert",
        "passwordUpdatePending": "loading: Passwort wird gespeichert",
        "passwordUpdateRejected": "error: Passwort konnte nicht geändert werden",
        "resendActivationEmailFulfilled": "success: Aktivierungsmail gesendet",
        "resendActivationEmailPending": "loading: Aktivierungsmail wird gesendet",
        "resendActivationEmailRejected": "error: Aktivierungsmail konnte nicht gesendet werden",
        "signedOut": "success: Abmeldung erfolgreich",
        "userActivationFulfilled": "success: Konto aktiviert",
        "userActivationPending": "loading: Konto wird aktiviert",
        "userActivationRejected": "error: Konto konnte nicht aktiviert werden",
        "userCreationFulfilled": "success: Konto erstellt",
        "userCreationPending": "loading: Konto wird erstellt",
        "userCreationRejected": "error: Konto konnte nicht erstellt werden",
        "userDeleteFulfilled": "success: Konto gelöscht",
        "userDeletePending": "loading: Konto wird gelöscht",
        "userDeleteRejected": "error: Konto konnte nicht gelöscht werden",
        "userUpdateFulfilled": "success: Gespeichert",
        "userUpdatePending": "loading: Wird gespeichert",
        "userUpdateRejected": "error: Konnte nicht gespeichert werden",
      }
    `);
  });
});

describe('frames ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(framesReducer, framesActions)).toMatchInlineSnapshot(`
      {
        "frameOTPRecieved": "success: Code erstellt",
        "frameOTPRequestFailed": "error: Code konnte nicht erstellt werden",
        "frameOTPRequested": "loading: Code wird erstellt",
        "framesRequestFailed": "error: Bilderrahmen konnten nicht geladen werden",
        "registerFrameFailed": "error: Bilderrahmen konnte nicht hinzugefügt werden",
        "registerFrameFulfilled": "success: Bilderrahmen hinzugefügt",
        "registerFramePending": "loading: Bilderrahmen wird hinzugefügt",
        "unregisterFrameFailed": "error: Bilderrahmen konnte nicht entfernt werden",
        "unregisterFrameFulfilled": "success: Bilderrahmen entfernt",
        "unregisterFramePending": "loading: Bilderrahmen wird entfernt",
      }
    `);
  });
});

describe('friendships ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(friendshipsReducer, friendshipsActions)).toMatchInlineSnapshot(`
      {
        "acceptFriendshipRequestFailed": "error: Anfrage konnte nicht angenommen werden",
        "acceptFriendshipRequestFulfilled": "success: Anfrage angenommen",
        "acceptFriendshipRequestPending": "loading: Anfrage wird angenommen",
        "friendshipDeleteDeleteFailed": "error: Freundschaft konnte nicht beendet werden",
        "friendshipDeleteDeleteFulfilled": "success: Freundschaft beendet",
        "friendshipDeleteRequested": "loading: Freundschaft wird beendet",
        "friendshipRequestWithdrawn": "success: Anfrage zurückgezogen",
        "friendshipsRequestFailed": "error: Freunde konnten nicht geladen werden",
        "rejectFriendshipRequestFailed": "error: Anfrage konnte nicht abgelehnt werden",
        "rejectFriendshipRequestFulfilled": "success: Anfrage abgelehnt",
        "rejectFriendshipRequestPending": "loading: Anfrage wird abgelehnt",
        "sendFriendshipRequestFailed": "error: Die Anfrage konnte nicht gesendet werden.",
        "sendFriendshipRequestFulfilled": "success: Anfrage gesendet",
        "sendFriendshipRequestPending": "loading: Anfrage wird gesendet",
      }
    `);
  });
});

describe('contact ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(contactReducer, contactActions)).toMatchInlineSnapshot(`
      {
        "contactEmailSendingFailed": "error: Nachricht konnte nicht gesendet werden",
        "contactEmailSendingFulfilled": "success: Nachricht gesendet",
        "contactEmailSendingPending": "loading: Nachricht wird gesendet",
      }
    `);
  });
});
