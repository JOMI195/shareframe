import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import AlertSnackbar from '@/common/components/snackbars/alertSnackbar';
import LoadingSnackbar from '@/common/components/snackbars/loadingSnackbar';
import { closeImagesAlertSnackbar, getImagesSnackbar } from '@/store/ui/images/images.slice';
import { closeAuthAlertSnackbar, getAuthSnackbar } from '@/store/ui/authentication/authentication.slice';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';

const alertState = (slice: 'images' | 'auth', message: string, severity = 'error') => ({
  ui: { [slice]: { snackbar: { alert: { open: true, message, severity } } } },
});

// One component is aliased ten times in snackbars.tsx, parameterised by selector.
describe('AlertSnackbar', () => {
  it('renders the message from the selector it was given', () => {
    renderWithProviders(
      <AlertSnackbar getSnackbar={getImagesSnackbar} closeSnackbar={closeImagesAlertSnackbar} />,
      { preloadedState: alertState('images', 'Bilder laden fehlgeschlagen') },
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Bilder laden fehlgeschlagen');
  });

  it('reads a different slice when given a different selector', () => {
    renderWithProviders(
      <AlertSnackbar getSnackbar={getAuthSnackbar} closeSnackbar={closeAuthAlertSnackbar} />,
      {
        preloadedState: {
          ...alertState('images', 'Bilder laden fehlgeschlagen'),
          ...alertState('auth', 'Anmeldung fehlgeschlagen'),
        },
      },
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Anmeldung fehlgeschlagen');
  });

  it('renders nothing while closed', () => {
    renderWithProviders(
      <AlertSnackbar getSnackbar={getImagesSnackbar} closeSnackbar={closeImagesAlertSnackbar} />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('closes through the dispatched action', async () => {
    const { user, store } = renderWithProviders(
      <AlertSnackbar getSnackbar={getImagesSnackbar} closeSnackbar={closeImagesAlertSnackbar} />,
      { preloadedState: alertState('images', 'Kaputt') },
    );

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(store.getState().ui.images.snackbar.alert.open).toBe(false);
  });

  it('carries the severity through to the alert', () => {
    renderWithProviders(
      <AlertSnackbar getSnackbar={getImagesSnackbar} closeSnackbar={closeImagesAlertSnackbar} />,
      { preloadedState: alertState('images', 'Erfolg', 'success') },
    );

    expect(screen.getByRole('alert').className).toMatch(/colorSuccess|standardSuccess/);
  });
});

describe('LoadingSnackbar', () => {
  it('renders the loading message', () => {
    renderWithProviders(
      <LoadingSnackbar getSnackbar={getImagesSnackbar} closeSnackbar={closeImagesAlertSnackbar} />,
      { preloadedState: { ui: { images: { snackbar: { loading: { open: true, message: 'Bild hochladen' } } } } } },
    );

    expect(screen.getByText('Bild hochladen')).toBeInTheDocument();
  });
});
