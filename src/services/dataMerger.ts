import { PS5Model, MerchantOffer } from '../types';
import { LiveOffer } from '../backend/types';

function getMerchantLogo(merchantId: string): string {
  if (merchantId.includes('fnac')) return '🟡';
  if (merchantId.includes('boulanger')) return '🟠';
  if (merchantId.includes('cdiscount')) return '📦';
  if (merchantId.includes('amazon')) return '🛒';
  if (merchantId.includes('leclerc')) return '🔵';
  return '🛒';
}

/**
 * Fusionne les offres multi-marchands récupérées en temps réel depuis le backend
 * avec le catalogue de référence existant, sans altérer la structure ni le design.
 */
export function mergeModelsWithLiveOffers(baseModels: PS5Model[], liveOffers: LiveOffer[]): PS5Model[] {
  if (!liveOffers || liveOffers.length === 0) {
    return baseModels;
  }

  return baseModels.map((model) => {
    // 1. Digital Edition
    let updatedDigital = { ...model.digitalEdition };
    const liveDigitalOffers = liveOffers.filter(
      (o) => o.productId === model.id && o.editionType === 'digital'
    );

    if (liveDigitalOffers.length > 0) {
      const convertedOffers: MerchantOffer[] = liveDigitalOffers.map((lo) => ({
        id: lo.id,
        merchantName: lo.merchantName,
        merchantLogo: getMerchantLogo(lo.merchantId),
        condition: lo.condition === 'refurbished' ? 'refurbished' : 'new',
        conditionLabel: lo.conditionLabel,
        price: lo.price,
        originalPrice: lo.originalPrice,
        inStock: lo.inStock,
        stockStatus: lo.stockStatus,
        deliveryInfo: lo.deliveryInfo,
        url: lo.url,
        isBestPrice: false,
        lastUpdated: `Vérifié le ${lo.lastCheckedFormatted}`,
      }));

      // Remplacer les offres des marchands synchronisés et conserver les autres
      const otherOffers = updatedDigital.offers.filter(
        (o) => !liveDigitalOffers.some((lo) => lo.merchantName.toLowerCase().includes(o.merchantName.toLowerCase().replace(' (flux pilote)', '')))
      );

      const allMerged = [...convertedOffers, ...otherOffers];
      
      // Recalculer le prix le plus bas uniquement parmi les offres EN STOCK
      const inStockOffers = allMerged.filter((o) => o.inStock);
      if (inStockOffers.length > 0) {
        const minOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
        updatedDigital.currentLowestPrice = minOffer.price;
        updatedDigital.currentLowestMerchant = minOffer.merchantName;
      }
      
      updatedDigital.offers = allMerged;
    }

    // 2. Disc Edition (si existante)
    let updatedDisc = model.discEdition ? { ...model.discEdition } : undefined;
    if (updatedDisc) {
      const liveDiscOffers = liveOffers.filter(
        (o) => o.productId === model.id && o.editionType === 'disc'
      );

      if (liveDiscOffers.length > 0) {
        const convertedOffers: MerchantOffer[] = liveDiscOffers.map((lo) => ({
          id: lo.id,
          merchantName: lo.merchantName,
          merchantLogo: getMerchantLogo(lo.merchantId),
          condition: lo.condition === 'refurbished' ? 'refurbished' : 'new',
          conditionLabel: lo.conditionLabel,
          price: lo.price,
          originalPrice: lo.originalPrice,
          inStock: lo.inStock,
          stockStatus: lo.stockStatus,
          deliveryInfo: lo.deliveryInfo,
          url: lo.url,
          isBestPrice: false,
          lastUpdated: `Vérifié le ${lo.lastCheckedFormatted}`,
        }));

        const otherOffers = updatedDisc.offers.filter(
          (o) => !liveDiscOffers.some((lo) => lo.merchantName.toLowerCase().includes(o.merchantName.toLowerCase().replace(' (flux pilote)', '')))
        );

        const allMerged = [...convertedOffers, ...otherOffers];
        const inStockOffers = allMerged.filter((o) => o.inStock);
        if (inStockOffers.length > 0) {
          const minOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
          updatedDisc.currentLowestPrice = minOffer.price;
          updatedDisc.currentLowestMerchant = minOffer.merchantName;
        }

        updatedDisc.offers = allMerged;
      }
    }

    // Recalculer startingPrice du modèle
    const lowestDigital = updatedDigital.currentLowestPrice || model.startingPrice;
    const lowestDisc = updatedDisc?.currentLowestPrice || Infinity;
    const minStarting = Math.min(lowestDigital, lowestDisc);

    return {
      ...model,
      startingPrice: minStarting < Infinity ? minStarting : model.startingPrice,
      digitalEdition: updatedDigital,
      discEdition: updatedDisc,
    };
  });
}
