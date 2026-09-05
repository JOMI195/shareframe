import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as friendshipEndpoints from '@/assets/endpoints/api/friendshipsEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withFriendships } from '@tests/mocks';

const ME = seedUser.username;

const accepted = makeFriendship({ id: 1, sender: ME, reciever: 'bob', status: 'accepted' });
const incoming = makeFriendship({ id: 2, sender: 'dave', reciever: ME, status: 'pending' });
const outgoing = makeFriendship({ id: 3, sender: ME, reciever: 'erin', status: 'pending' });

const openFriendships = async (friendships = [accepted, incoming, outgoing]) => {
  server.use(...withFriendships(friendships));
  const view = renderRoute('/freunde/', { preloadedState: signedInState() });
  await screen.findByRole('tab', { name: /Freunde/ });
  return view;
};

const requestsTab = () => screen.getByRole('tab', { name: /Anfragen/ });

describe('friend list', () => {
  it('shows accepted friends', async () => {
    await openFriendships();

    expect(await screen.findByText('bob')).toBeInTheDocument();
  });

  // Only requests waiting for my answer are counted.
  it('badges the number of incoming requests', async () => {
    await openFriendships();

    await waitFor(() => expect(requestsTab()).toHaveTextContent('1'));
  });

  it('lists the incoming request and not my own outgoing one', async () => {
    const { user } = await openFriendships();

    await user.click(requestsTab());

    expect(await screen.findByText('dave')).toBeInTheDocument();
    expect(screen.queryByText('erin')).not.toBeInTheDocument();
  });

  it('says so when nobody has asked', async () => {
    const { user } = await openFriendships([accepted]);

    await user.click(requestsTab());

    expect(await screen.findByText('Keine Freundschaftsanfragen vorhanden')).toBeInTheDocument();
  });
});

describe('answering a request', () => {
  it('accepts it', async () => {
    const calls: string[] = [];
    server.use(
      mswHttp.post(apiUrl(friendshipEndpoints.getFriendshipsAcceptRequestUrl(incoming.id)), () => {
        calls.push('accept');
        return HttpResponse.json({ ...incoming, status: 'accepted' });
      }),
    );
    const { user } = await openFriendships();

    await user.click(requestsTab());
    await user.click(await screen.findByRole('button', { name: 'Anfrage annehmen' }));

    await waitFor(() => expect(calls).toEqual(['accept']));
  });

  it('rejects it', async () => {
    const calls: string[] = [];
    server.use(
      mswHttp.post(apiUrl(friendshipEndpoints.getFriendshipsRejectRequestUrl(incoming.id)), () => {
        calls.push('reject');
        return HttpResponse.json({ ...incoming, status: 'rejected' });
      }),
    );
    const { user } = await openFriendships();

    await user.click(requestsTab());
    await user.click(await screen.findByRole('button', { name: 'Anfrage ablehnen' }));

    await waitFor(() => expect(calls).toEqual(['reject']));
  });
});

describe('sending a request', () => {
  const openDialog = async (user: ReturnType<typeof renderRoute>['user']) => {
    await user.click(screen.getByRole('button', { name: /Freundschafsanfrage/ }));
    return screen.findByLabelText('Freundschaftscode');
  };

  it('sends the friend code that was typed', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.post(apiUrl(friendshipEndpoints.getFriendshipsSendRequestUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(makeFriendship({ id: 9, status: 'pending' }), { status: 201 });
      }),
    );
    const { user } = await openFriendships();

    const field = await openDialog(user);
    await user.type(field, 'SEEDB001');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await waitFor(() =>
      expect(bodies).toEqual([{ reciever_friendship_user_search_code: 'SEEDB001' }]),
    );
  });

  it('insists on an eight character code', async () => {
    const bodies: unknown[] = [];
    server.use(
      mswHttp.post(apiUrl(friendshipEndpoints.getFriendshipsSendRequestUrl()), () => {
        bodies.push('called');
        return HttpResponse.json(makeFriendship(), { status: 201 });
      }),
    );
    const { user } = await openFriendships();

    const field = await openDialog(user);
    await user.type(field, 'KURZ');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    expect(await screen.findByText('Der Code besteht aus 8 Zeichen')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('keeps the dialog open when the code is unknown', async () => {
    server.use(
      mswHttp.post(apiUrl(friendshipEndpoints.getFriendshipsSendRequestUrl()), () =>
        HttpResponse.json({ detail: 'Kein Benutzer gefunden.' }, { status: 404 }),
      ),
    );
    const { user, store } = await openFriendships();

    const field = await openDialog(user);
    await user.type(field, 'UNBEKANN');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await waitFor(() =>
      expect(store.getState().ui.friendships.snackbar.alert.severity).toBe('error'),
    );
    expect(store.getState().ui.friendships.dialogs.create.open).toBe(true);
  });
});
