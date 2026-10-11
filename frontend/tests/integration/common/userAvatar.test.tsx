import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import UserAvatar from '@/common/components/userAvatar';
import { mediaUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

describe('UserAvatar', () => {
  it('shows the picture once it is fetched', async () => {
    render(<UserAvatar username="alice" url="/media/avatars/shown.jpg" />);

    expect(await screen.findByRole('img', { name: 'alice', hidden: true })).toHaveAttribute('src', expect.stringMatching(/^blob:/));
  });

  it('shows the initial without a picture', () => {
    render(<UserAvatar username="bob" url={null} />);

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  it('falls back to the initial when the picture cannot be fetched', async () => {
    const path = '/media/avatars/missing.jpg';
    let requested = false;
    server.use(
      mswHttp.get(mediaUrl(path), () => {
        requested = true;
        return new HttpResponse(null, { status: 403 });
      }),
    );

    render(<UserAvatar username="carol" url={path} />);

    await expect.poll(() => requested).toBe(true);
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });
});
