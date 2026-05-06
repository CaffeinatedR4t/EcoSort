export interface BarcodeIdentification {
  productName: string;
  wasteType: 'plastic' | 'paper' | 'metal' | 'organic' | 'other';
}

export const identifyBarcode = async (barcode: string): Promise<BarcodeIdentification> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'EcoSort - MobileApp - Version 1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Barcode lookup failed');
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

      return { productName, wasteType };
    }

    return { productName: 'Unknown', wasteType: 'other' };
  } catch (error) {
    console.error('Barcode service error:', error);
    return { productName: 'Unknown', wasteType: 'other' };
  }
};
