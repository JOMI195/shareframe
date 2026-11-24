import { expect } from '@playwright/test';
import { type Dashboard, panelsOf, queryPanel, type QueryOptions } from './grafana';

/** Panels allowed to stay empty on the test stack, with the reason. Keyed by dashboard uid, then panel title. */
export const EXPECTED_EMPTY: Record<string, Record<string, string>> = {
  'shareframe-backup': {
    'Failed step': 'only shows a step that failed',
  },
  'shareframe-logs': {
    'Error share': 'no backend ERROR lines on a healthy stack',
    '5xx by view': 'no endpoint fails on purpose',
    'Exceptions by type': 'no endpoint fails on purpose',
    'Celery errors': 'no task fails on purpose',
  },
};

const panelsByData = async (dashboard: Dashboard, options: QueryOptions) => {
  const allowed = EXPECTED_EMPTY[dashboard.uid] ?? {};
  const empty: string[] = [];
  const unexpectedlyFilled: string[] = [];
  for (const panel of panelsOf(dashboard)) {
    const results = await queryPanel(dashboard, panel, options);
    if (results.length === 0) continue;
    const hasData = results.some((result) => result.rows > 0);
    if (!hasData && !(panel.title in allowed)) empty.push(panel.title);
    if (hasData && panel.title in allowed) unexpectedlyFilled.push(panel.title);
  }
  return { empty, unexpectedlyFilled };
};

/**
 * Every panel of the dashboard returns data, apart from the ones listed above.
 * Polls through one business scrape, the slowest source behind any panel.
 */
export const expectEveryPanelHasData = async (dashboard: Dashboard, options: QueryOptions = {}) => {
  await expect
    .poll(async () => (await panelsByData(dashboard, options)).empty, { message: 'panels without data', timeout: 330_000, intervals: [10_000] })
    .toEqual([]);
  const { unexpectedlyFilled } = await panelsByData(dashboard, options);
  expect(unexpectedlyFilled, 'allowlisted panels that now have data, drop them from EXPECTED_EMPTY').toEqual([]);
};
