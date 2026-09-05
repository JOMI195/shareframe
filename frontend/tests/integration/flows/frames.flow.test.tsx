import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFrame } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withFrames } from '@tests/mocks';

// The dialog's own format. Note the backend derives serials as four groups of
// four (XXXX-XXXX-XXXX-XXXX), which this validation rejects — see README.tests.md.
const SERIAL = 'EOJ8W-XBVY8-6U3LL-39I2F-1HUCU';

const frame = makeFrame({ id: 1, public_serial_number: SERIAL, last_seen: new Date().toISOString() });

const openFrames = async (frames = [frame]) => {
  server.use(...withFrames(frames));
  const view = renderRoute('/bilderrahmen/', { preloadedState: signedInState() });
  if (frames.length > 0) await screen.findByText(SERIAL);
  return view;
};

describe('frame list', () => {
  it('lists the registered frames with their connection state', async () => {
    await openFrames();

    expect(await screen.findByText(SERIAL)).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('marks a frame that has not reported in as offline', async () => {
    await openFrames([makeFrame({ id: 2, public_serial_number: SERIAL, last_seen: null })]);

    expect(await screen.findByText('Offline')).toBeInTheDocument();
  });

  it('says so when no frame is registered', async () => {
    await openFrames([]);

    expect(
      await screen.findByText('Keine hinzugefügten Bilderrahmen vorhanden'),
    ).toBeInTheDocument();
  });

  // frames.tsx refetches on window focus so a frame paired elsewhere shows up.
  it('refetches when the window regains focus', async () => {
    let calls = 0;
    server.use(
      mswHttp.get(apiUrl(frameEndpoints.getFramesUrl()), () => {
        calls += 1;
        return HttpResponse.json([frame]);
      }),
    );
    renderRoute('/bilderrahmen/', { preloadedState: signedInState() });
    await waitFor(() => expect(calls).toBe(1));

    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(calls).toBe(2));
  });
});

describe('registering a frame', () => {
  const openDialog = async (user: ReturnType<typeof renderRoute>['user']) => {
    await user.click(screen.getByRole('button', { name: /Bilderrahmen hinzufügen/ }));
    return screen.findByLabelText('Seriennummer');
  };

  it('registers the serial that was typed and closes', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      ...withFrames([]),
      mswHttp.post(apiUrl(frameEndpoints.getRegisterFrameUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(frame);
      }),
    );
    const { user, store } = renderRoute('/bilderrahmen/', { preloadedState: signedInState() });

    const field = await openDialog(user);
    await user.type(field, SERIAL);
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await waitFor(() => expect(bodies).toEqual([{ public_serial_number: SERIAL }]));
    await waitFor(() => expect(store.getState().ui.frames.dialogs.register.open).toBe(false));
  });

  it('insists on the serial number format', async () => {
    const calls: string[] = [];
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getRegisterFrameUrl()), () => {
        calls.push('called');
        return HttpResponse.json(frame);
      }),
    );
    const { user } = await openFrames();

    const field = await openDialog(user);
    await user.type(field, 'ABC');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    expect(
      await screen.findByText('Der Code muss das Format EOJ8W-XBVY8-6U3LL-39I2F-1HUCU haben'),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('stays open when the serial is unknown', async () => {
    server.use(
      ...withFrames([]),
      mswHttp.post(apiUrl(frameEndpoints.getRegisterFrameUrl()), () =>
        HttpResponse.json({ detail: 'Kein Bilderrahmen gefunden.' }, { status: 404 }),
      ),
    );
    const { user, store } = renderRoute('/bilderrahmen/', { preloadedState: signedInState() });

    const field = await openDialog(user);
    await user.type(field, SERIAL);
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await waitFor(() => expect(store.getState().ui.frames.snackbar.alert.severity).toBe('error'));
    expect(store.getState().ui.frames.dialogs.register.open).toBe(true);
  });
});

describe('unregistering a frame', () => {
  it('asks first and then releases the frame', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getUnregisterFrameUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(frame);
      }),
    );
    const { user } = await openFrames();

    await user.click(await screen.findByRole('button', { name: 'delete' }));
    expect(
      await screen.findByText('Du kannst den Bilderrahmen jederzeit wieder mit seiner Seriennummer hinzufügen'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Löschen bestätigen' }));

    await waitFor(() => expect(bodies).toEqual([{ public_serial_number: SERIAL }]));
  });

  it('keeps the frame when the confirmation is cancelled', async () => {
    const calls: string[] = [];
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getUnregisterFrameUrl()), () => {
        calls.push('called');
        return HttpResponse.json(frame);
      }),
    );
    const { user } = await openFrames();

    await user.click(await screen.findByRole('button', { name: 'delete' }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(calls).toHaveLength(0);
    expect(screen.getByText(SERIAL)).toBeInTheDocument();
  });
});
