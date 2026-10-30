import { describe, expect, it } from 'vitest';
import { formatSerial } from '@/main/frames/dialogs/register/serial';

describe('formatSerial', () => {
  it.each([
    ['groups plain input', 'eoj8wxbvy86u3ll3', 'EOJ8-WXBV-Y86U-3LL3'],
    ['keeps typed dashes in place', 'EOJ8-WXBV', 'EOJ8-WXBV'],
    ['adds no trailing dash after a full block', 'EOJ8', 'EOJ8'],
    ['drops spaces and other characters', 'eoj8 wx/bv', 'EOJ8-WXBV'],
    ['stops at sixteen characters', 'AAAABBBBCCCCDDDDEEEE', 'AAAA-BBBB-CCCC-DDDD'],
  ])('%s', (_name, input, expected) => {
    expect(formatSerial(input)).toBe(expected);
  });
});
