import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import Settings from '@/common/components/settings/settings';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';

const tabs = [
  { label: 'Profil', id: 'profile', icon: <span />, content: <p>Profilinhalt</p> },
  { label: 'Mitteilungen', id: 'notifications', icon: <span />, content: <p>Mitteilungsinhalt</p> },
];

const Search = () => <output aria-label="search">{useLocation().search}</output>;

const render = (route: string) =>
  renderWithProviders(
    <>
      <Settings title="Nutzerkonto" tabs={tabs} />
      <Search />
    </>,
    { route },
  );

describe('settings tabs', () => {
  it('opens the first tab by default', () => {
    render('/');

    expect(screen.getByText('Profilinhalt')).toBeVisible();
  });

  it('opens the tab named in the link', () => {
    render('/?tab=notifications');

    expect(screen.getByText('Mitteilungsinhalt')).toBeVisible();
    expect(screen.queryByText('Profilinhalt')).not.toBeInTheDocument();
  });

  it('falls back to the first tab for an unknown name', () => {
    render('/?tab=gibtsnicht');

    expect(screen.getByText('Profilinhalt')).toBeVisible();
  });

  it('puts the chosen tab into the url', async () => {
    const { user } = render('/');

    await user.click(screen.getByRole('tab', { name: 'Mitteilungen' }));

    expect(screen.getByText('Mitteilungsinhalt')).toBeVisible();
    expect(screen.getByLabelText('search')).toHaveTextContent('?tab=notifications');
  });
});
