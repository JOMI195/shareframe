import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFrame } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withFrames } from '@tests/mocks';

const SERIAL = 'EOJ8-WXBV-Y86U-3LL3';

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

  it('says so when no frame is registered and offers to add one', async () => {
    const { user, store } = await openFrames([]);

    expect(await screen.findByText('Noch kein Bilderrahmen hinzugefügt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ersten Bilderrahmen hinzufügen' }));

    expect(store.getState().ui.frames.dialogs.register.open).toBe(true);
  });

  it('offers a retry when the list could not be loaded', async () => {
    let fail = true;
    server.use(
      mswHttp.get(apiUrl(frameEndpoints.getFramesUrl()), () =>
        fail ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json([frame]),
      ),
    );
    const { user } = renderRoute('/bilderrahmen/', { preloadedState: signedInState() });
    const retry = await screen.findByRole('button', { name: 'Erneut versuchen' });

    fail = false;
    await user.click(retry);

    expect(await screen.findByText(SERIAL)).toBeInTheDocument();
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

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 1000);
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(calls).toBe(2));
  });

  it('does not refetch on a quick refocus', async () => {
    let calls = 0;
    server.use(
      mswHttp.get(apiUrl(frameEndpoints.getFramesUrl()), () => {
        calls += 1;
        return HttpResponse.json([frame]);
      }),
    );
    renderRoute('/bilderrahmen/', { preloadedState: signedInState() });
    await screen.findByText(frame.public_serial_number);

    window.dispatchEvent(new Event('focus'));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls).toBe(1);
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
      await screen.findByText('Der Code muss das Format EOJ8-WXBV-Y86U-3LL3 haben'),
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
