import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import RequestOTPDialog from '@/main/frames/dialogs/requestOTP/requestOTPDialog';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFrame } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const frame = makeFrame({ id: 3 });

const render = () =>
  renderWithProviders(<RequestOTPDialog />, {
    preloadedState: signedInState({
      entities: { frames: { frames: [frame] } },
      ui: { frames: { dialogs: { requestOTP: { open: true, frameId: frame.id } } } },
    }),
  });

const serveOtp = (otp = '482913', expires = '10') =>
  server.use(
    mswHttp.post(apiUrl(frameEndpoints.getObtainFrameOtpUrl(frame.id)), () =>
      HttpResponse.json({ otp, expires_in_minutes: expires }),
    ),
  );

const otpField = () => screen.getByLabelText('OTP') as HTMLInputElement;

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
});

describe('RequestOTPDialog', () => {
  it('starts without an OTP and with copying disabled', () => {
    render();

    expect(otpField().value).toBe('');
    expect(screen.getByRole('button', { name: 'copy otp' })).toBeDisabled();
  });

  it('shows the generated OTP and how long it lasts', async () => {
    serveOtp();
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Generieren' }));

    await waitFor(() => expect(otpField().value).toBe('482913'));
    expect(screen.getByText('gültig für: 10 Minuten')).toBeInTheDocument();
  });

  it('copies the OTP and says so', async () => {
    serveOtp();
    const { user, store } = render();
    // userEvent.setup() installs its own clipboard stub, so override it afterwards.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });

    await user.click(screen.getByRole('button', { name: 'Generieren' }));
    await waitFor(() => expect(otpField().value).toBe('482913'));

    await user.click(screen.getByRole('button', { name: 'copy otp' }));

    expect(writeText).toHaveBeenCalledWith('482913');
    await waitFor(() =>
      expect(store.getState().ui.frames.snackbar.alert.severity).toBe('success'),
    );
  });

  // Plain HTTP on the LAN has no clipboard API; the fallback must still report.
  it('reports a failed copy instead of pretending it worked', async () => {
    serveOtp();
    const { user, store } = render();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
    document.execCommand = vi.fn().mockReturnValue(false);

    await user.click(screen.getByRole('button', { name: 'Generieren' }));
    await waitFor(() => expect(otpField().value).toBe('482913'));

    await user.click(screen.getByRole('button', { name: 'copy otp' }));

    await waitFor(() => expect(store.getState().ui.frames.snackbar.alert.severity).toBe('error'));
  });

  it('replaces the OTP when a new one is generated', async () => {
    let otp = '111111';
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getObtainFrameOtpUrl(frame.id)), () =>
        HttpResponse.json({ otp, expires_in_minutes: '10' }),
      ),
    );

    const { user } = render();
    await user.click(screen.getByRole('button', { name: 'Generieren' }));
    await waitFor(() => expect(otpField().value).toBe('111111'));

    otp = '222222';
    await user.click(screen.getByRole('button', { name: 'Generieren' }));

    await waitFor(() => expect(otpField().value).toBe('222222'));
  });

  it('leaves the field empty when the backend refuses', async () => {
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getObtainFrameOtpUrl(frame.id)), () =>
        HttpResponse.json({ detail: 'Rahmen ist offline.' }, { status: 400 }),
      ),
    );

    const { user, store } = render();
    await user.click(screen.getByRole('button', { name: 'Generieren' }));

    await waitFor(() => expect(store.getState().ui.frames.snackbar.alert.open).toBe(true));
    expect(otpField().value).toBe('');
  });
});
