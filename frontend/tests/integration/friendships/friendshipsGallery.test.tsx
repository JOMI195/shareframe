import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as friendshipsEndpoints from '@/assets/endpoints/api/friendshipsEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withFriendships } from '@tests/mocks';

const bob = makeFriendship({ id: 1, sender: seedUser.username, reciever: 'bob', status: 'accepted' });

describe('friends page', () => {
  it('starts a photo selection for one friend', async () => {
    server.use(...withFriendships([bob]));
    const { user, router, store } = renderRoute('/freunde/', { preloadedState: signedInState() });

    await user.click(await screen.findByRole('button', { name: 'Foto an bob senden' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/fotos/'));
    expect(store.getState().ui.images.dialogs.selection).toMatchObject({ open: true, receiver: 'bob' });
    expect(await screen.findByText('Wähle Fotos für bob')).toBeInTheDocument();
  });

  it('offers a retry instead of an empty list when loading fails', async () => {
    let fail = true;
    server.use(
      mswHttp.get(apiUrl(friendshipsEndpoints.getFriendshipsUrl()), () =>
        fail ? HttpResponse.json({ detail: 'boom' }, { status: 500 }) : HttpResponse.json([bob]),
      ),
    );
    const { user } = renderRoute('/freunde/', { preloadedState: signedInState() });

    const retry = await screen.findByRole('button', { name: 'Erneut versuchen' });
    expect(screen.queryByText('Keine Freundschaften vorhanden')).not.toBeInTheDocument();
    fail = false;
    await user.click(retry);

    expect(await screen.findByText('bob')).toBeInTheDocument();
  });
});
