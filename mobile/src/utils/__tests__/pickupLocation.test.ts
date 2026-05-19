import { isPickupAddressReady } from '../pickupLocation';

describe('pickup location address readiness', () => {
  it('blocks placeholder or unresolved pickup addresses', () => {
    expect(isPickupAddressReady('Locating...')).toBe(false);
    expect(isPickupAddressReady('Fetching location...')).toBe(false);
    expect(isPickupAddressReady('Address found at coordinates')).toBe(false);
    expect(isPickupAddressReady('Error fetching address')).toBe(false);
    expect(isPickupAddressReady('Address not found')).toBe(false);
    expect(isPickupAddressReady('Home Address')).toBe(false);
    expect(isPickupAddressReady('')).toBe(false);
  });

  it('allows an exact readable pickup address', () => {
    expect(isPickupAddressReady('Jl. Sudirman Kav 1, Jakarta, DKI Jakarta')).toBe(true);
  });
});
