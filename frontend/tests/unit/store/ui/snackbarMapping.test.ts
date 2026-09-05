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
        "authenticationPending": "loading: Anmeldung läuft",
        "authenticationRejected": "error: Anmeldung fehlgeschlagen",
        "passwordResetFulfilled": "success: Email zum Passwort zurücksetzen erfolgreich gesendet",
        "passwordResetPending": "loading: Email zum Passwort zurücksetzen senden",
        "passwordResetRejected": "error: Email zum Passwort zurücksetzen fehlgeschlagen",
        "passwordUpdateFulfilled": "success: Vergabe eines neuen Passwort erfolgreich",
        "passwordUpdatePending": "loading: Vergebe neues Passwort",
        "passwordUpdateRejected": "error: Vergabe eines neuen Passwort fehlgeschlagen",
        "resendActivationEmailFulfilled": "success: Erneutes Senden der Aktivierungsmail erfolgreich",
        "resendActivationEmailPending": "loading: Erneutes Senden der Aktivierungsmail",
        "resendActivationEmailRejected": "error: Erneutes Senden der Aktivierungsmail fehlgeschlagen",
        "signedOut": "success: Abmeldung erfolgreich",
        "userActivationFulfilled": "success: Nutzeraktivierung erfolgreich",
        "userActivationPending": "loading: Nutzeraktivierung läuft",
        "userActivationRejected": "error: Nutzeraktivierung fehlgeschlagen",
        "userCreationFulfilled": "success: Nutzerregistrierung erfolgreich",
        "userCreationPending": "loading: Nutzerregistrierung läuft",
        "userCreationRejected": "error: Nutzerregistrierung fehlgeschlagen",
        "userDeleteFulfilled": "success: Löschen des Nutzerkontos erfolgreich",
        "userDeletePending": "loading: Löschen des Nutzerkontos",
        "userDeleteRejected": "error: Löschen des Nutzerkontos fehlgeschlagen",
        "userUpdateFulfilled": "success: Nutzerupdate erfolgreich",
        "userUpdatePending": "loading: Nutzerupdate",
        "userUpdateRejected": "error: Nutzerupdate fehlgeschlagen",
      }
    `);
  });
});

describe('frames ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(framesReducer, framesActions)).toMatchInlineSnapshot(`
      {
        "frameOTPRecieved": "success: OTP erfolgreich generiert",
        "frameOTPRequestFailed": "error: Generierung von OTP fehlgeschlagen",
        "frameOTPRequested": "loading: Generiere OTP",
        "framesRequestFailed": "error: Bilderrahmen laden fehlgeschlagen",
        "registerFrameFailed": "error: Bilderrahmen registrieren fehlgeschlagen",
        "registerFrameFulfilled": "success: Bilderrahmen registrieren erfolgreich",
        "registerFramePending": "loading: Bilderrahmen registrieren",
        "unregisterFrameFailed": "error: Bilderrahmen vom Nutzer lösen fehlgeschlagen",
        "unregisterFrameFulfilled": "success: Bilderrahmen vom Nutzer lösen erfolgreich",
        "unregisterFramePending": "loading: Bilderrahmen vom Nutzer lösen",
      }
    `);
  });
});

describe('friendships ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(friendshipsReducer, friendshipsActions)).toMatchInlineSnapshot(`
      {
        "acceptFriendshipRequestFailed": "error: Freundschaftsanfrage annehmen fehlgeschlagen",
        "acceptFriendshipRequestFulfilled": "success: Freundschaftsanfrage annehmen erfolgreich",
        "acceptFriendshipRequestPending": "loading: Freundschaftsanfrage annehmen",
        "friendshipDeleteDeleteFailed": "error: Freundschaft löschen fehlgeschlagen",
        "friendshipDeleteDeleteFulfilled": "success: Freundschaft löschen erfolgreich",
        "friendshipDeleteRequested": "loading: Freundschaft löschen",
        "friendshipsRequestFailed": "error: Freundesdaten laden fehlgeschlagen",
        "rejectFriendshipRequestFailed": "error: Freundschaftsanfrage ablehnen fehlgeschlagen",
        "rejectFriendshipRequestFulfilled": "success: Freundschaftsanfrage ablehnen erfolgreich",
        "rejectFriendshipRequestPending": "loading: Freundschaftsanfrage ablehnen",
        "sendFriendshipRequestFailed": "error: Freundschaftsanfrage fehlgeschlagen. Schau mal ob die Anfrage nicht schon gestellt wurde.",
        "sendFriendshipRequestFulfilled": "success: Freundschaftsanfrage erfolgreich",
        "sendFriendshipRequestPending": "loading: Freundschaftsanfrage",
      }
    `);
  });
});

describe('contact ui snackbars', () => {
  it('maps every entity action', () => {
    expect(snackbarMap(contactReducer, contactActions)).toMatchInlineSnapshot(`
      {
        "contactEmailSendingFailed": "error: Senden der Kontaktemail fehlgeschlagen",
        "contactEmailSendingFulfilled": "success: Senden der Kontaktemail erfolgreich",
        "contactEmailSendingPending": "loading: Senden der Kontaktemail läuft",
      }
    `);
  });
});
