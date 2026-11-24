import { expect, test } from '@playwright/test';
import { dashboardUids, loadDashboard, panelsOf, queryPanel } from '../support/e2e/grafana';

/**
 * Every query on every dashboard must run. Whether it has data depends on traffic,
 * so that is checked per dashboard, after its own spec has driven it.
 */
test.describe('grafana panels', () => {
  for (const uid of dashboardUids()) {
    test(`${uid}: every query runs`, async () => {
      const dashboard = await loadDashboard(uid);
      const failures: string[] = [];

      for (const panel of panelsOf(dashboard)) {
        for (const result of await queryPanel(dashboard, panel)) {
          if (result.error) failures.push(`${panel.title} ${result.refId}: ${result.error}`);
        }
      }

      expect(failures).toEqual([]);
    });
  }
});
