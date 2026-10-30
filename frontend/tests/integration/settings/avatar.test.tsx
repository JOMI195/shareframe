import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import ProfileAvatar from '@/main/settings/user/avatar/avatar';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeUser, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';
import { getCroppedImg } from '@/main/images/dialogs/upload/imageCropping/cropper/utils';

// jsdom has no layout, so react-easy-crop never reports a crop area, and no
// canvas, so the real getCroppedImg cannot run. Both are unit-tested separately.
vi.mock('react-easy-crop', async () => {
  const { useEffect } = await import('react');
  const area = { x: 0, y: 0, width: 100, height: 100 };

  type MockProps = {
    crop: { x: number; y: number };
    zoom: number;
    onCropAreaChange: (a: unknown, b: unknown) => void;
  };

  const MockCropper = ({ crop, zoom, onCropAreaChange }: MockProps) => {
    useEffect(() => onCropAreaChange(area, area), [onCropAreaChange]);
    return <div data-testid="cropper" data-crop={JSON.stringify(crop)} data-zoom={zoom} />;
  };

  return { default: MockCropper };
});

vi.mock('@/main/images/dialogs/upload/imageCropping/cropper/utils', () => ({
  getCroppedImg: vi.fn(async () => new Blob(['cropped'], { type: 'image/jpeg' })),
}));

const withoutAvatar = makeUser({ account: { ...seedUser.account, avatar: null } });

const recordDelete = () => {
  const deleted: string[] = [];
  server.use(
    mswHttp.delete(apiUrl(authEndpoints.getMyAvatarUrl()), ({ request }) => {
      deleted.push(request.url);
      return HttpResponse.json(withoutAvatar);
    }),
  );
  return deleted;
};

const render = (me = seedUser) =>
  renderWithProviders(<ProfileAvatar />, {
    preloadedState: signedInState({ auth: { user: { me } } }),
  });

describe('avatar settings', () => {
  it('uploads the picture as cropped', async () => {
    const uploads: (string | null)[] = [];
    server.use(
      // Reading the body hangs: a jsdom File does not stream through undici.
      mswHttp.put(apiUrl(authEndpoints.getMyAvatarUrl()), ({ request }) => {
        uploads.push(request.headers.get('content-type'));
        return HttpResponse.json(
          makeUser({ account: { ...seedUser.account, avatar: '/media/avatars/new.jpg' } }),
        );
      }),
    );
    const { user } = render(withoutAvatar);

    const file = new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Profilbild auswählen'), file);
    const dialog = await screen.findByRole('dialog', { name: 'Profilbild zuschneiden' });
    expect(uploads).toHaveLength(0);

    const confirm = within(dialog).getByRole('button', { name: 'Übernehmen' });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    await waitFor(() => expect(uploads).toHaveLength(1));
    expect(uploads[0]).toMatch(/^multipart\/form-data/);
    expect(vi.mocked(getCroppedImg)).toHaveBeenCalledWith(file, { x: 0, y: 0, width: 100, height: 100 });
    expect(await screen.findByRole('button', { name: 'Entfernen' })).toBeInTheDocument();
  });

  it('uploads nothing when cropping is cancelled', async () => {
    const uploads: string[] = [];
    server.use(
      mswHttp.put(apiUrl(authEndpoints.getMyAvatarUrl()), ({ request }) => {
        uploads.push(request.url);
        return HttpResponse.json(withoutAvatar);
      }),
    );
    const { user } = render(withoutAvatar);

    const file = new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Profilbild auswählen'), file);
    const dialog = await screen.findByRole('dialog', { name: 'Profilbild zuschneiden' });
    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Profilbild zuschneiden' })).not.toBeInTheDocument(),
    );
    expect(uploads).toHaveLength(0);
  });

  it('zooms, moves and resets the crop', async () => {
    const { user } = render(withoutAvatar);

    const file = new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Profilbild auswählen'), file);
    const dialog = await screen.findByRole('dialog', { name: 'Profilbild zuschneiden' });
    const cropper = await within(dialog).findByTestId('cropper');

    expect(within(dialog).getByRole('button', { name: 'Verkleinern' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Vergrößern' }));
    expect(Number(cropper.dataset.zoom)).toBeCloseTo(1.1);

    await user.click(within(dialog).getByRole('button', { name: 'Nach rechts verschieben' }));
    await user.click(within(dialog).getByRole('button', { name: 'Nach unten verschieben' }));
    expect(JSON.parse(cropper.dataset.crop!)).toEqual({ x: 10, y: 10 });

    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));
    expect(JSON.parse(cropper.dataset.crop!)).toEqual({ x: 0, y: 0 });
    expect(cropper.dataset.zoom).toBe('1');
    expect(within(dialog).queryByRole('slider', { name: 'Rotation' })).not.toBeInTheDocument();
  });

  it('removes the picture after confirming', async () => {
    const deleted = recordDelete();
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Entfernen' }));
    await user.click(await screen.findByRole('button', { name: 'Profilbild entfernen' }));

    await waitFor(() => expect(deleted).toHaveLength(1));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Entfernen' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText(seedUser.username[0].toUpperCase())).toBeInTheDocument();
  });

  it('keeps the picture when the confirmation is cancelled', async () => {
    const deleted = recordDelete();
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Entfernen' }));
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Profilbild entfernen' })).not.toBeInTheDocument(),
    );
    expect(deleted).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Entfernen' })).toBeInTheDocument();
  });

  it('offers no removal without a picture', () => {
    render(withoutAvatar);

    expect(screen.queryByRole('button', { name: 'Entfernen' })).not.toBeInTheDocument();
  });
});
