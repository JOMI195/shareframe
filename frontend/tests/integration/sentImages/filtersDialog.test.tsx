import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import FiltersDialog from '@/main/sentImages/dialogs/filters/filtersDialog';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, seedUser } from '@tests/fixtures';

const friendships = [
  makeFriendship({ id: 1, sender: seedUser.username, reciever: 'bob', reciever_avatar: '/media/avatars/bob.jpg' }),
  makeFriendship({ id: 2, sender: 'carol', reciever: seedUser.username, sender_avatar: null }),
];

const render = () =>
  renderWithProviders(<FiltersDialog />, {
    preloadedState: signedInState({
      entities: { friendships: { friendships } },
      ui: { sentImages: { dialogs: { filter: { open: true } } } },
    }),
  });

// Neither MUI Select exposes an accessible name here; the sender comes first.
const senderSelect = () => screen.getAllByRole('combobox')[0];

describe('FiltersDialog', () => {
  it('shows the picture of every user it offers', async () => {
    const { user } = render();

    await user.click(senderSelect());

    const listbox = await screen.findByRole('listbox');
    expect(await within(listbox).findByRole('img', { name: 'bob', hidden: true })).toBeInTheDocument();
    expect(await within(listbox).findByRole('img', { name: seedUser.username, hidden: true })).toBeInTheDocument();
    expect(within(listbox).queryByRole('img', { name: 'carol', hidden: true })).not.toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'carol' })).toHaveTextContent('C');
  });

  it('shows the picture of the chosen user in the select', async () => {
    const { user } = render();

    await user.click(senderSelect());
    await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'bob' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

    expect(await within(senderSelect()).findByRole('img', { name: 'bob', hidden: true })).toBeInTheDocument();
    expect(senderSelect()).toHaveTextContent('bob');
  });

  it('shows the placeholder while nobody is chosen', () => {
    render();

    expect(senderSelect()).toHaveTextContent('Alle Sender');
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('Alle Empfänger');
  });
});
