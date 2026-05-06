import { identifyBarcode } from '../barcode';

// Mock fetch
global.fetch = jest.fn();

describe('barcode service', () => {
  it('identifies a known barcode and maps it to a waste type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Test Water Bottle',
          packaging: 'Bottle, plastic',
        },
      }),
    });

    const result = await identifyBarcode('12345678');
    expect(result.productName).toBe('Test Water Bottle');
    expect(result.wasteType).toBe('plastic');
  });

  it('returns "other" for unknown barcodes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0 }),
    });

    const result = await identifyBarcode('00000000');
    expect(result.wasteType).toBe('other');
  });
});
