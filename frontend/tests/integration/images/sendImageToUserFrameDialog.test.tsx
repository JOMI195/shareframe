import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { triggerIntersection } from '@tests/setup/vitest.setup';
import { HttpResponse, http as mswHttp } from 'msw';
import SendImageToUserFrameDialog from '@/main/images/dialogs/sendImageToUserFrame/sendImageToUserFrameDialog';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFrame, makeFriendship, makeImage, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';
import { openSendImageToUserFrameDialog } from '@/store/ui/images/images.slice';

const photo = makeImage({ id: 5 });

const friendships = [
  makeFriendship({ id: 1, sender: seedUser.username, reciever: 'bob', status: 'accepted' }),
  makeFriendship({ id: 2, sender: 'carol', reciever: seedUser.username, status: 'accepted' }),
  makeFriendship({ id: 3, sender: 'dave', reciever: seedUser.username, status: 'pending' }),
];

const openState = (images = [photo], frames = [makeFrame()]) =>
  signedInState({
    entities: { friendships: { friendships }, frames: { frames, api: { lastFetch: Date.now() } } },
    ui: { images: { dialogs: { sendToFrame: { open: true, imagesToSend: images } } } },
  });

const render = (images = [photo], frames = [makeFrame()]) =>
  renderWithProviders(<SendImageToUserFrameDialog />, { preloadedState: openState(images, frames) });

// Neither MUI Select exposes an accessible name here; the receivers come first.
const receiverSelect = () => screen.getAllByRole('combobox')[0];

// The picker edits sections; its hidden input takes a whole date string like autofill does.
const sendTimeInput = () =>
  screen.getByRole('group', { name: 'Sendezeitpunkt' }).parentElement!.querySelector('input')!;

const recordSends = () => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    mswHttp.post(apiUrl(frameEndpoints.getSentImageToFrameUrl()), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ message: 'Image sent successful.' });
    }),
  );
  return bodies;
};

// The picker stays open for several receivers; it blocks the dialog until it is dismissed.
const chooseReceivers = async (user: ReturnType<typeof render>['user'], ...names: string[]) => {
  await user.click(receiverSelect());
  const listbox = await screen.findByRole('listbox');
  for (const name of names) {
    await user.click(within(listbox).getByRole('option', { name }));
  }
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
};

describe('SendImageToUserFrameDialog', () => {
  afterEach(() => vi.useRealTimers());

  it('offers every accepted friend plus my own frames', async () => {
    const { user } = render();

    await user.click(receiverSelect());

    const options = within(await screen.findByRole('listbox')).getAllByRole('option');
    const names = ['bob', 'carol', 'deine eigenen Bilderrahmen'];
    expect(options).toHaveLength(names.length);
    names.forEach((name, i) => expect(options[i]).toHaveAccessibleName(name));
  });

  it('leaves out my own frames when I have none', async () => {
    const { user } = render([photo], []);

    await user.click(receiverSelect());

    expect(within(await screen.findByRole('listbox')).queryByRole('option', { name: 'deine eigenen Bilderrahmen' })).toBeNull();
  });

  it('keeps the picker open to choose several receivers', async () => {
    const { user } = render();

    await user.click(receiverSelect());
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: 'bob' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(within(listbox).getByRole('option', { name: 'carol' }));
    await user.keyboard('{Escape}');

    expect(await screen.findByRole('button', { name: '1 Foto an 2 Empfänger senden' })).toBeInTheDocument();
  });

  it('shows the photos that are about to be sent', async () => {
    render([makeImage({ id: 5, display_name: 'Strand' }), makeImage({ id: 6, display_name: 'Berge' })]);

    await act(async () => triggerIntersection(true));

    expect(await screen.findByAltText('Strand')).toBeInTheDocument();
    expect(await screen.findByAltText('Berge')).toBeInTheDocument();
  });

  it('leaves out people whose request is still pending', async () => {
    const { user } = render();

    await user.click(receiverSelect());

    expect(within(await screen.findByRole('listbox')).queryByRole('option', { name: 'dave' })).toBeNull();
  });

  it('cannot send before a receiver is chosen', () => {
    render();

    expect(screen.getByRole('button', { name: /an 0 Empfänger senden/ })).toBeDisabled();
  });

  it('sends one request per photo and receiver', async () => {
    const bodies = recordSends();
    const { user } = render([photo, makeImage({ id: 6 })]);

    await chooseReceivers(user, 'bob', 'carol');
    await user.click(screen.getByRole('button', { name: /an 2 Empfänger senden/ }));

    await waitFor(() => expect(bodies).toHaveLength(4));
    expect(bodies.map((body) => `${body.reciever_username}:${body.image_id}`).sort()).toEqual([
      'bob:5',
      'bob:6',
      'carol:5',
      'carol:6',
    ]);
  });

  it('sends the expiry as a unix timestamp derived from the selected hours', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const bodies = recordSends();
    const { user } = render();

    await chooseReceivers(user, 'bob');
    await user.click(screen.getByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    // The default is 24 hours.
    expect(bodies[0].expiry_unix_timestamp).toBe(String(Date.UTC(2026, 0, 2, 12) / 1000));
    expect(bodies[0]).not.toHaveProperty('scheduled_unix_timestamp');
  });

  it('schedules the send and counts the expiry from the chosen time', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const bodies = recordSends();
    const { user } = render();

    await chooseReceivers(user, 'bob');
    await user.click(screen.getByRole('switch', { name: 'Zu einem späteren Zeitpunkt senden' }));
    fireEvent.change(sendTimeInput(), { target: { value: '03.01.2026 09:30' } });
    await user.click(screen.getByRole('button', { name: /an 1 Empfänger planen/ }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].scheduled_unix_timestamp).toBe(Date.UTC(2026, 0, 3, 9, 30) / 1000);
    expect(bodies[0].expiry_unix_timestamp).toBe(String(Date.UTC(2026, 0, 4, 9, 30) / 1000));
  });

  it('shows the send time in German format with a 24 hour clock', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const { user } = render();

    await user.click(screen.getByRole('switch', { name: 'Zu einem späteren Zeitpunkt senden' }));

    expect(sendTimeInput()).toHaveValue('01.01.2026 14:00');
    expect(screen.getByText(/Höchstens 30 Tage im Voraus/)).toBeInTheDocument();
  });

  it('cannot schedule a send in the past', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const { user } = render();

    await chooseReceivers(user, 'bob');
    await user.click(screen.getByRole('switch', { name: 'Zu einem späteren Zeitpunkt senden' }));
    fireEvent.change(sendTimeInput(), { target: { value: '31.12.2025 12:00' } });

    expect(screen.getByText('Der Zeitpunkt muss in der Zukunft liegen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /an 1 Empfänger planen/ })).toBeDisabled();
  });

  // The dialog used to close before its own requests resolved.
  it('stays open until every send has come back', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getSentImageToFrameUrl()), async () => {
        await gate;
        return HttpResponse.json({ message: 'Image sent successful.' });
      }),
    );

    const { user, store } = render();
    await chooseReceivers(user, 'bob');
    await user.click(screen.getByRole('button', { name: /an 1 Empfänger senden/ }));

    await screen.findByRole('button', { name: /Sende 1 Foto an 1 Empfänger\.\.\./ });
    expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(true);

    release!();

    await waitFor(() => expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(false));
  });

  it('also closes the selection dialog once the photos are on their way', async () => {
    recordSends();
    const { user, store } = render();

    await chooseReceivers(user, 'bob');
    await user.click(screen.getByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() => expect(store.getState().ui.images.dialogs.selection.open).toBe(false));
  });

  it('sums all sends up in one message', async () => {
    let calls = 0;
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getSentImageToFrameUrl()), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ detail: 'kaputt' }, { status: 500 })
          : HttpResponse.json({ message: 'Image sent successful.' });
      }),
    );
    const { user, store } = render();
    await chooseReceivers(user, 'bob', 'carol');

    await user.click(screen.getByRole('button', { name: /an 2 Empfänger senden/ }));

    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert).toMatchObject({
        message: '1 von 2 Sendungen erfolgreich, 1 fehlgeschlagen',
        severity: 'warning',
      }),
    );
    expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(false);
  });

  it('stays open for another try when nothing could be sent', async () => {
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getSentImageToFrameUrl()), () =>
        HttpResponse.json({ detail: 'kaputt' }, { status: 500 }),
      ),
    );
    const { user, store } = render();
    await chooseReceivers(user, 'bob');

    await user.click(screen.getByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() => expect(store.getState().ui.images.snackbar.alert.severity).toBe('error'));
    expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(true);
    expect(screen.getByRole('button', { name: /an 1 Empfänger senden/ })).toBeEnabled();
  });

  it('closes from the header without a separate cancel button', async () => {
    const { user, store } = render();

    expect(screen.queryByRole('button', { name: 'Abbrechen' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(false);
  });

  it('links to the activity page once something went out', async () => {
    recordSends();
    const { user, store } = render();
    await chooseReceivers(user, 'bob');

    await user.click(screen.getByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.link).toEqual({ label: 'Ansehen', to: '/aktivitaeten/' }),
    );
  });

  it('refuses a custom duration that is not a positive whole number', async () => {
    const { user } = render();
    await chooseReceivers(user, 'bob');

    await user.click(screen.getByRole('radio', { name: 'Eigene Dauer' }));
    await user.clear(screen.getByLabelText('Dauer'));
    await user.type(screen.getByLabelText('Dauer'), '0');

    expect(screen.getByText(/Eine ganze Zahl von 1 bis/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /an 1 Empfänger senden/ })).toBeDisabled();
  });

  // The selector keeps its own mode, so it must not show a custom value the next send ignores.
  it('starts with the preset duration again after closing', async () => {
    const { user, store } = render();
    await user.click(screen.getByRole('radio', { name: 'Eigene Dauer' }));

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    act(() => {
      store.dispatch(openSendImageToUserFrameDialog({ images: [photo] }));
    });

    expect(await screen.findByRole('radio', { name: 'Vorgaben' })).toBeChecked();
  });
});
