import { base64ToArrayBuffer, getProfileInitials } from '../profile';

jest.mock('../../services/api/supabase', () => ({
  supabase: {},
}));

describe('profile utilities', () => {
  it('builds profile initials from the first two name parts', () => {
    expect(getProfileInitials('Alice Xavier')).toBe('AX');
    expect(getProfileInitials('  budi  ')).toBe('B');
    expect(getProfileInitials('', 'U')).toBe('U');
  });

  it('decodes base64 into an array buffer without browser globals', () => {
    const bytes = new Uint8Array(base64ToArrayBuffer('SGVsbG8='));

    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });
});
