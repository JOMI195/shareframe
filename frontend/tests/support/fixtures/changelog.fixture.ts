import type { IChangelog, IChangelogId } from '@/types/types.changelogs';

export const makeChangelogId = (over: Partial<IChangelogId> = {}): IChangelogId => ({
  id: 1,
  date: '2026-01-01',
  title: 'Erste Version',
  is_published: true,
  ...over,
});

export const makeChangelog = (over: Partial<IChangelog> = {}): IChangelog => ({
  ...makeChangelogId(),
  content: '# Hallo',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  ...over,
});
