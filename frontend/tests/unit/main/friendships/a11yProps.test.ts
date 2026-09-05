import { describe, expect, it } from 'vitest';
import { a11yProps } from '@/main/friendships/tabs/a11yProps';

describe('a11yProps', () => {
  it('links a tab to its panel', () => {
    expect(a11yProps(2)).toEqual({ id: 'simple-tab-2', 'aria-controls': 'simple-tabpanel-2' });
  });
});
