import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as notificationsEndpoints from '@/assets/endpoints/api/notificationsEndpoints';
import { getUnsubscribePageUrl } from '@/assets/endpoints/app/notificationEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const URL = apiUrl(notificationsEndpoints.getUnsubscribeUrl());

const open = () => renderRoute(`/${getUnsubscribePageUrl()}signed:token/`);

describe('unsubscribe page', () => {
  it('sends the token only after the click', async () => {
    const bodies: unknown[] = [];
    server.use(
      mswHttp.post(URL, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = open();

    const button = await screen.findByRole('button', { name: 'Abbestellen' });
    expect(bodies).toEqual([]);
    await user.click(button);

    expect(await screen.findByText(/nicht mehr per E-Mail/)).toBeVisible();
    await waitFor(() => expect(bodies).toEqual([{ token: 'signed:token' }]));
  });

  it('explains an invalid link', async () => {
    server.use(mswHttp.post(URL, () => HttpResponse.json({}, { status: 400 })));
    const { user } = open();

    await user.click(await screen.findByRole('button', { name: 'Abbestellen' }));

    expect(await screen.findByText(/Der Link ist ungültig/)).toBeVisible();
  });
});
