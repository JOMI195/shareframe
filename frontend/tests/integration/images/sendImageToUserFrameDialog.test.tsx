import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import SendImageToUserFrameDialog from '@/main/images/dialogs/sendImageToUserFrame/sendImageToUserFrameDialog';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, makeImage, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const photo = makeImage({ id: 5 });

const friendships = [
  makeFriendship({ id: 1, sender: seedUser.username, reciever: 'bob', status: 'accepted' }),
  makeFriendship({ id: 2, sender: 'carol', reciever: seedUser.username, status: 'accepted' }),
  makeFriendship({ id: 3, sender: 'dave', reciever: seedUser.username, status: 'pending' }),
];

const openState = (images = [photo]) =>
  signedInState({
    entities: { friendships: { friendships } },
    ui: { images: { dialogs: { sendToFrame: { open: true, imagesToSend: images } } } },
  });

const render = (images = [photo]) =>
  renderWithProviders(<SendImageToUserFrameDialog />, { preloadedState: openState(images) });

// Neither MUI Select exposes an accessible name here; the receivers come first.
const receiverSelect = () => screen.getAllByRole('combobox')[0];

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

const chooseReceivers = async (user: ReturnType<typeof render>['user'], ...names: string[]) => {
  for (const name of names) {
    await user.click(receiverSelect());
    await user.click(await within(await screen.findByRole('listbox')).findByRole('option', { name }));
    // The menu closes on a short timeout and blocks the rest of the dialog until it does.
    await waitForElementToBeRemoved(() => screen.queryByRole('listbox'));
  }
};

describe('SendImageToUserFrameDialog', () => {
  afterEach(() => vi.useRealTimers());

  it('offers every accepted friend plus my own frames', async () => {
    const { user } = render();

    await user.click(receiverSelect());

    const options = within(await screen.findByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'bob',
      'carol',
      'deine eigenen Bilderrahmen',
    ]);
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
});
