import { expect } from '@playwright/test';
import { type Dashboard, panelsOf, queryPanel, type QueryOptions } from './grafana';

/** Panels allowed to stay empty on the test stack, with the reason. Keyed by dashboard uid, then panel title. */
export const EXPECTED_EMPTY: Record<string, Record<string, string>> = {};

/** Every panel of the dashboard returns data, apart from the ones listed above. */
export const expectEveryPanelHasData = async (dashboard: Dashboard, options: QueryOptions = {}) => {
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

  expect(empty, 'panels without data').toEqual([]);
  expect(unexpectedlyFilled, 'allowlisted panels that now have data, drop them from EXPECTED_EMPTY').toEqual([]);
};
