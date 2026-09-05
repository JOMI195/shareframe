import type { IUser } from '@/types';

export const makeUser = (over: Partial<IUser> = {}): IUser => ({
  id: 1,
  email: 'alice@example.com',
  username: 'alice',
  account: { friendship_user_searchable: true, friendship_user_search_code: 'ABCD1234' },
  ...over,
});

export const seedUser = makeUser();

export const otherUser = makeUser({
  id: 2,
  email: 'bob@example.com',
  username: 'bob',
  account: { friendship_user_searchable: true, friendship_user_search_code: 'EFGH5678' },
});
