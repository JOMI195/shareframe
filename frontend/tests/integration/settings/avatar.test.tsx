import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import ProfileAvatar from '@/main/settings/user/avatar/avatar';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeUser, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

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
  it('uploads the chosen picture', async () => {
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

    await waitFor(() => expect(uploads).toHaveLength(1));
    expect(uploads[0]).toMatch(/^multipart\/form-data/);
    expect(await screen.findByRole('button', { name: 'Entfernen' })).toBeInTheDocument();
  });

  it('removes the picture after confirming', async () => {
    const deleted = recordDelete();
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Entfernen' }));
    await user.click(await screen.findByRole('button', { name: 'Entfernen bestätigen' }));

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
      expect(screen.queryByRole('button', { name: 'Entfernen bestätigen' })).not.toBeInTheDocument(),
    );
    expect(deleted).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Entfernen' })).toBeInTheDocument();
  });

  it('offers no removal without a picture', () => {
    render(withoutAvatar);

    expect(screen.queryByRole('button', { name: 'Entfernen' })).not.toBeInTheDocument();
  });
});
