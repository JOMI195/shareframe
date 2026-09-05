import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import Home from '@/main/home/home';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeDashboardData, makeWeeklyActivity, seedUser } from '@tests/fixtures';
import { server, withDashboard } from '@tests/mocks';

const render = () => renderWithProviders(<Home />, { preloadedState: signedInState() });

describe('dashboard', () => {
  it('greets the signed-in user', async () => {
    render();

    expect(await screen.findByText(`Hi, ${seedUser.username}`)).toBeInTheDocument();
  });

  it('links to every main area from the quick access cards', async () => {
    render();

    for (const title of ['Fotos', 'Aktivitäten', 'Freunde', 'Bilderrahmen']) {
      expect(await screen.findByText(title)).toBeInTheDocument();
    }
  });

  it('shows the counts the backend reports', async () => {
    server.use(
      ...withDashboard(
        makeDashboardData({
          images: { uploaded_images_by_me_count: 42 },
          sent_images: {
            uploaded_images_by_me_count: 42,
            active_images_to_me_count: 7,
            latest_expiring_image: null,
            weekly_activity: makeWeeklyActivity(),
          },
        }),
      ),
    );
    render();

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  it('says so when nothing is waiting', async () => {
    server.use(...withDashboard(makeDashboardData()));
    render();

    expect(await screen.findByText('Keine aktiven Fotos')).toBeInTheDocument();
  });

  // last_seen drives the online badge, so a stale heartbeat must read as offline.
  it('marks a frame online only while its heartbeat is fresh', async () => {
    server.use(
      ...withDashboard(
        makeDashboardData({
          frames: [
            { id: 1, last_seen: new Date().toISOString() },
            { id: 2, last_seen: '2020-01-01T00:00:00Z' },
            { id: 3, last_seen: null },
          ],
        }),
      ),
    );
    render();

    expect(await screen.findByText('Online')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Offline')).toHaveLength(2));
  });
});
