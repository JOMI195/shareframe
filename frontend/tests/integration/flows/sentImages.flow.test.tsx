import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeImage, makePage, makeSentImage, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withSentImages } from '@tests/mocks';
import { clickSpeedDialAction, speedDialAction } from '@tests/helpers/speedDial';

const ME = seedUser.username;

const received = makeSentImage({
  id: 1,
  sender: 'bob',
  reciever: ME,
  image: makeImage({ id: 11, name: 'von-bob.jpg' }),
  expires_at: '2099-01-01T10:00:00Z',
});

const sentByMe = makeSentImage({
  id: 2,
  sender: ME,
  reciever: 'carol',
  image: makeImage({ id: 12, name: 'an-carol.jpg' }),
  expires_at: '2000-01-01T10:00:00Z',
});

const openActivity = async (sentImages = [received, sentByMe]) => {
  server.use(...withSentImages(sentImages));
  const view = renderRoute('/aktivitaeten/', { preloadedState: signedInState() });
  await screen.findByText(/geteilte/);
  return view;
};

/** Every query the page sends, in order. */
const recordQueries = () => {
  const urls: string[] = [];
  server.use(
    mswHttp.get(apiUrl(imageEndpoints.getSentImagesUrl()), ({ request }) => {
      urls.push(new URL(request.url).search);
      return HttpResponse.json(makePage([received, sentByMe]));
    }),
  );
  return urls;
};

const chooseOption = async (
  user: ReturnType<typeof renderRoute>['user'],
  label: string,
  option: string,
) => {
  // The selects are disabled while the list reloads after a filter change.
  await waitFor(() => expect(screen.getByLabelText(label)).not.toHaveClass('Mui-disabled'));
  await user.click(screen.getByLabelText(label));
  await user.click(await within(await screen.findByRole('listbox')).findByRole('option', { name: option }));
  // The menu keeps the rest of the page inert until its close transition ends.
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
};

describe('activity list', () => {
  it('shows how many shared photos there are', async () => {
    await openActivity();

    expect(await screen.findByText('2 geteilte Fotos')).toBeInTheDocument();
  });

  it('says so when there is no activity', async () => {
    await openActivity([]);

    expect(
      await screen.findByText('Keine erhaltenen oder gesendeten Fotos gefunden oder vorhanden'),
    ).toBeInTheDocument();
  });
});

describe('server side filters', () => {
  it('asks for the first page with a page size', async () => {
    const urls = recordQueries();
    renderRoute('/aktivitaeten/', { preloadedState: signedInState() });

    await waitFor(() => expect(urls[0]).toContain('page=1'));
    expect(urls[0]).toContain('page_size=');
  });

  it('narrows the query to expired photos', async () => {
    const { user } = await openActivity();
    const urls = recordQueries();

    await chooseOption(user, 'Status Filter', 'Abgelaufene');

    await waitFor(() => expect(urls[urls.length - 1]).toContain('status=expired'));
  });

  it('narrows the query to what I sent', async () => {
    const { user } = await openActivity();
    const urls = recordQueries();

    await chooseOption(user, 'Versand Filter', 'Von dir gesendete');

    await waitFor(() => expect(urls[urls.length - 1]).toContain('shipping=sentByYou'));
  });

  // "Alle Fotos" is a sentinel, not a value the backend understands.
  it('leaves the sentinel out of the query again', async () => {
    const { user } = await openActivity();
    const urls = recordQueries();

    await chooseOption(user, 'Status Filter', 'Abgelaufene');
    await waitFor(() => expect(urls[urls.length - 1]).toContain('status=expired'));

    await chooseOption(user, 'Status Filter', 'Alle Fotos');

    await waitFor(() => expect(urls[urls.length - 1]).not.toContain('status='));
  });
});

describe('deactivating a shared photo', () => {
  it('stops an active photo after confirming', async () => {
    const calls: string[] = [];
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getSentImagesDeactivateUrl(received.id)), () => {
        calls.push('deactivate');
        return HttpResponse.json({ ...received, expires_at: '2000-01-01T00:00:00Z' });
      }),
    );
    const { user } = await openActivity();

    await user.click(document.querySelectorAll('.MuiImageListItem-root')[0] as HTMLElement);
    await clickSpeedDialAction(user, 'Foto deaktivieren');
    await user.click(await screen.findByRole('button', { name: 'Deaktivieren bestätigen' }));

    await waitFor(() => expect(calls).toEqual(['deactivate']));
  });

  it('cannot deactivate a photo that already expired', async () => {
    const { user } = await openActivity([sentByMe]);

    await user.click(document.querySelectorAll('.MuiImageListItem-root')[0] as HTMLElement);
    await user.hover(await screen.findByRole('button', { name: 'Aktionen' }));

    await waitFor(() => expect(speedDialAction('Foto deaktivieren')).toBeDisabled());
  });
});
