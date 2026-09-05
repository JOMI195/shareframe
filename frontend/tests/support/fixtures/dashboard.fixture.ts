import type { IDashboardData, IDayActivity } from '@/types';

const emptyWeek: IDayActivity[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => ({
  day,
  sent_count: 0,
  received_count: 0,
}));

export const makeDashboardData = (over: Partial<IDashboardData> = {}): IDashboardData => ({
  images: { uploaded_images_by_me_count: 0 },
  sent_images: {
    uploaded_images_by_me_count: 0,
    active_images_to_me_count: 0,
    latest_expiring_image: null,
    weekly_activity: emptyWeek,
  },
  frames: [],
  ...over,
});

export const makeWeeklyActivity = (
  counts: [number, number][] = [],
): IDayActivity[] =>
  emptyWeek.map((day, index) => ({
    ...day,
    sent_count: counts[index]?.[0] ?? 0,
    received_count: counts[index]?.[1] ?? 0,
  }));
