import type { IFriendship } from '@/types';

export const makeFriendship = (over: Partial<IFriendship> = {}): IFriendship => ({
  id: 1,
  sender: 'alice',
  reciever: 'bob',
  status: 'accepted',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  ...over,
});
