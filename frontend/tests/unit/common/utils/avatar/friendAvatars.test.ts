import { describe, expect, it } from 'vitest';
import { getFriendAvatars } from '@/common/utils/avatar/friendAvatars';
import { makeFriendship, seedUser } from '@tests/fixtures';

const ME = seedUser.username;

describe('getFriendAvatars', () => {
  it('maps each accepted friend to their picture, whichever side sent the request', () => {
    const avatars = getFriendAvatars(
      [
        makeFriendship({ sender: ME, reciever: 'bob', reciever_avatar: '/media/avatars/bob.jpg' }),
        makeFriendship({ sender: 'carol', reciever: ME, sender_avatar: null }),
      ],
      seedUser,
    );

    expect(avatars.get('bob')).toBe('/media/avatars/bob.jpg');
    expect(avatars.get('carol')).toBeNull();
  });

  it('adds myself last with my own picture', () => {
    const avatars = getFriendAvatars([makeFriendship({ sender: ME, reciever: 'bob' })], seedUser);

    expect([...avatars.keys()]).toEqual(['bob', ME]);
    expect(avatars.get(ME)).toBe(seedUser.account.avatar);
  });

  it('leaves out friendships that are not accepted', () => {
    const avatars = getFriendAvatars(
      [
        makeFriendship({ sender: 'dave', reciever: ME, status: 'pending' }),
        makeFriendship({ sender: ME, reciever: 'erin', status: 'rejected' }),
      ],
      seedUser,
    );

    expect([...avatars.keys()]).toEqual([ME]);
  });
});
