export interface BarcodeIdentification {
  productName: string;
  wasteType: 'plastic' | 'paper' | 'metal' | 'organic' | 'other';
}

export const identifyBarcode = async (barcode: string): Promise<BarcodeIdentification> => {
  try {
    // 1. Sanitize the barcode (remove any non-numeric characters like prefixes/suffixes)
    const sanitizedBarcode = barcode.replace(/[^0-9]/g, '');
    console.log(`[Barcode Service] Raw barcode: "${barcode}", Sanitized: "${sanitizedBarcode}"`);

    if (!sanitizedBarcode) {
      console.warn('[Barcode Service] Barcode is empty after sanitization.');
      return { productName: 'Unknown', wasteType: 'other' };
    }

    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${sanitizedBarcode}.json`, {
      headers: {
        'User-Agent': 'EcoSort - MobileApp - Version 1.0',
      },
    });

    if (!response.ok) {
      // 2. Handle non-200 responses (like 404 Not Found) gracefully
      console.warn(`[Barcode Service] API returned ${response.status} for barcode ${sanitizedBarcode}`);
      return { productName: 'Unknown', wasteType: 'other' };
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const packaging = (data.product.packaging || '').toLowerCase();
      const categories = (data.product.categories_tags || []).join(' ').toLowerCase();
      const productName = data.product.product_name || data.product.product_name_id || 'Unknown Product';

      let wasteType: 'plastic' | 'paper' | 'metal' | 'organic' | 'other' = 'other';

      // Mapping logic with Indonesian support
      const isPlastic = /plastic|plastik|bottle|botol|pet|hdpe|pvc|ldpe|pp|ps|kresek|gelas plasti|bungkus|kemasan plasti/.test(packaging + categories);
      const isPaper = /paper|kertas|cardboard|karton|box|dus|tetrapak|buku|majalah|koran|koran bekas/.test(packaging + categories);
      const isMetal = /metal|logam|can|kaleng|tin|alum|besi|soda|minuman kaleng/.test(packaging + categories);
      const isOrganic = /fruit|buah|veg|sayur|organic|organik|food|makanan|sisa|ampas|kulit buah/.test(packaging + categories);

      if (isPlastic) {
        wasteType = 'plastic';
      } else if (isPaper) {
        wasteType = 'paper';
      } else if (isMetal) {
        wasteType = 'metal';
      } else if (isOrganic) {
        wasteType = 'organic';
      }

      console.log(`[Barcode Service] Success: ${productName} classified as ${wasteType}`);
      return { productName, wasteType };
    }

    console.warn(`[Barcode Service] Product not found for barcode ${sanitizedBarcode}`);
    return { productName: 'Unknown', wasteType: 'other' };
  } catch (error) {
    console.error('[Barcode Service] error:', error);
    return { productName: 'Unknown', wasteType: 'other' };
  }
};
