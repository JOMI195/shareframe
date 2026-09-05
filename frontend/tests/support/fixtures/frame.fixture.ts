import type { IFrame } from '@/types';

export const makeFrame = (over: Partial<IFrame> = {}): IFrame => ({
  id: 1,
  public_serial_number: 'AAAA-BBBB-CCCC-DDDD',
  is_active: true,
  registered_at: '2026-01-01T10:00:00Z',
  last_seen: '2026-01-01T10:00:00Z',
  local_ip_address: '192.168.0.10',
  ...over,
});
