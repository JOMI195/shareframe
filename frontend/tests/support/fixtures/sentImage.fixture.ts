import type { ISentImage } from '@/types';
import { makeImage } from './image.fixture';

export const makeSentImage = (over: Partial<ISentImage> = {}): ISentImage => ({
  id: 1,
  sender: 'alice',
  reciever: 'bob',
  sender_avatar: '/media/avatars/alice.jpg',
  reciever_avatar: null,
  image: makeImage(),
  status: 'sent',
  scheduled_for: null,
  sent_at: '2026-01-01T10:00:00Z',
  expires_at: '2026-01-08T10:00:00Z',
  ...over,
});
