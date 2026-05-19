const UNRESOLVED_ADDRESS_VALUES = new Set([
  'locating...',
  'fetching location...',
  'address found at coordinates',
  'error fetching address',
  'address not found',
  'home address',
]);

export const isPickupAddressReady = (address?: string | null) => {
  const normalized = String(address || '').trim();
  if (!normalized) return false;
  return !UNRESOLVED_ADDRESS_VALUES.has(normalized.toLowerCase());
};
