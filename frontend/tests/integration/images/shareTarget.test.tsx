import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import UploadDialog from '@/main/images/dialogs/upload/uploadDialog';
import ShareTargetRedirect from '@/common/components/pwa/shareTargetRedirect';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { clearSharedFilesStub, stubSharedFiles } from '@tests/helpers/sharedFiles';

afterEach(() => clearSharedFilesStub());

describe('photos shared into the app', () => {
  it('open the upload dialog with the shared photos selected', async () => {
    stubSharedFiles([{ name: 'a.jpg' }, { name: 'b.jpg' }]);
    const { store } = renderWithProviders(<UploadDialog />, { preloadedState: signedInState() });

    expect(await screen.findByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('b.jpg')).toBeInTheDocument();
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });

  // vitest.config pins VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE to 15.
  it('keep the per-upload limit and warn about the rest', async () => {
    stubSharedFiles(Array.from({ length: 16 }, (_, i) => ({ name: `p${i}.jpg` })));
    const { store } = renderWithProviders(<UploadDialog />, { preloadedState: signedInState() });

    expect(await screen.findByText('p14.jpg')).toBeInTheDocument();
    expect(screen.queryByText('p15.jpg')).not.toBeInTheDocument();
    expect(store.getState().ui.images.snackbar.alert.message).toMatch(/Maximum von 15/);
  });

  it('leave the dialog closed when nothing was shared', async () => {
    const { store } = renderWithProviders(<UploadDialog />, { preloadedState: signedInState() });

    await waitFor(() => expect(store.getState().ui.images.dialogs.create.open).toBe(false));
  });
});

describe('ShareTargetRedirect', () => {
  const renderAt = (route: string) =>
    renderWithProviders(
      <Routes>
        <Route path="/fotos/" element={<p>Fotos</p>} />
        <Route path="*" element={<><p>Elsewhere</p><ShareTargetRedirect /></>} />
      </Routes>,
      { route },
    );

  it('moves to the photos page when a share is pending', async () => {
    stubSharedFiles([{ name: 'a.jpg' }]);
    renderAt('/dashboard/');

    expect(await screen.findByText('Fotos')).toBeInTheDocument();
  });

  it('stays put without a pending share', async () => {
    renderAt('/dashboard/');

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText('Elsewhere')).toBeInTheDocument();
  });
});
