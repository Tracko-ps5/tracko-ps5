import { PS5Model, MerchantOffer, PricePoint } from '../types';
import { LiveOffer, PriceHistoryEntry } from '../backend/types';

function cleanMerchantName(name: string): string {
  return name.replace(/\s*\(flux pilote\)/i, '').trim();
}

function processHistoryForEdition(
  history: PriceHistoryEntry[],
  productId: string,
  editionType: 'digital' | 'disc'
): {
  '7d': PricePoint[];
  '30d': PricePoint[];
  '3m': PricePoint[];
  '6m': PricePoint[];
  '1y': PricePoint[];
  lowestEver?: { price: number; date: string };
  highestEver?: number;
  average?: number;
} {
  const filtered = history
    .filter((h) => h.productId === productId && h.editionType === editionType && h.price > 0)
    .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const toPricePoint = (h: PriceHistoryEntry): PricePoint => {
    const d = new Date(h.checkedAt);
    const dateFormatted = isNaN(d.getTime())
      ? (h.dateLabel || 'Relevé')
      : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    return {
      date: dateFormatted,
      price: h.price,
      merchant: cleanMerchantName(h.merchantName),
    };
  };

  const p7d = filtered.filter((h) => now - new Date(h.checkedAt).getTime() <= 7 * DAY_MS).map(toPricePoint);
  const p30d = filtered.filter((h) => now - new Date(h.checkedAt).getTime() <= 30 * DAY_MS).map(toPricePoint);
  const p3m = filtered.filter((h) => now - new Date(h.checkedAt).getTime() <= 90 * DAY_MS).map(toPricePoint);
  const p6m = filtered.filter((h) => now - new Date(h.checkedAt).getTime() <= 180 * DAY_MS).map(toPricePoint);
  const p1y = filtered.filter((h) => now - new Date(h.checkedAt).getTime() <= 365 * DAY_MS).map(toPricePoint);

  let lowestEver: { price: number; date: string } | undefined;
  let highestEver: number | undefined;
  let average: number | undefined;

  if (filtered.length > 0) {
    const minEntry = filtered.reduce((min, cur) => cur.price < min.price ? cur : min, filtered[0]);
    const maxEntry = filtered.reduce((max, cur) => cur.price > max.price ? cur : max, filtered[0]);
    const sum = filtered.reduce((acc, cur) => acc + cur.price, 0);

    const dMin = new Date(minEntry.checkedAt);
    const minDateLabel = !isNaN(dMin.getTime())
      ? dMin.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : (minEntry.dateLabel || 'Récemment');

    lowestEver = { price: minEntry.price, date: minDateLabel };
    highestEver = maxEntry.price;
    average = Math.round((sum / filtered.length) * 100) / 100;
  }

  return {
    '7d': p7d,
    '30d': p30d,
    '3m': p3m,
    '6m': p6m,
    '1y': p1y,
    lowestEver,
    highestEver,
    average,
  };
}

/**
 * Fusionne les offres multi-marchands récupérées en temps réel et l'historique réel
 * avec le catalogue de référence existant, en toute transparence et sans données fictives.
 */
export function mergeModelsWithLiveOffers(
  baseModels: PS5Model[],
  liveOffers: LiveOffer[],
  realHistory: PriceHistoryEntry[] = []
): PS5Model[] {
  return baseModels.map((model) => {
    // 1. Digital Edition
    let updatedDigital = { ...model.digitalEdition };
    const liveDigitalOffers = (liveOffers || []).filter(
      (o) => o.productId === model.id && o.editionType === 'digital'
    );

    if (liveDigitalOffers.length > 0) {
      const convertedOffers: MerchantOffer[] = liveDigitalOffers.map((lo) => {
        const isManual = lo.sourceType === 'manual_verification' || !lo.merchantId.includes('awin');
        const merchantClean = cleanMerchantName(lo.merchantName);

        return {
          id: lo.id,
          merchantName: merchantClean,
          merchantLogo: '',
          condition: lo.condition === 'refurbished' ? 'refurbished' : 'new',
          conditionLabel: lo.conditionLabel || (lo.condition === 'refurbished' ? 'Reconditionné vérifié' : 'Neuf scellé'),
          price: lo.price,
          originalPrice: lo.originalPrice,
          inStock: lo.inStock,
          stockStatus: lo.inStock ? (lo.stockStatus || 'in_stock') : 'out_of_stock',
          deliveryInfo: lo.deliveryInfo || (lo.deliveryPrice === 0 ? 'Livraison gratuite' : `Livraison ${lo.deliveryPrice.toFixed(2)} €`),
          url: lo.url,
          isBestPrice: false,
          lastUpdated: lo.lastCheckedFormatted ? `Vérifié le ${lo.lastCheckedFormatted}` : 'Vérifié par TRACKO',
          sourceType: 'manual_verification',
          isLive: true,
          feedSourceUrl: lo.feedSourceUrl,
        };
      });

      // Remplacer les offres existantes du même marchand
      const otherOffers = updatedDigital.offers
        .filter((o) => !liveDigitalOffers.some((lo) => cleanMerchantName(lo.merchantName).toLowerCase() === cleanMerchantName(o.merchantName).toLowerCase()))
        .map((o) => ({ ...o, merchantName: cleanMerchantName(o.merchantName) }));

      const allMerged = [...convertedOffers, ...otherOffers];
      
      // Recalculer le meilleur prix parmi les offres EN STOCK
      const inStockOffers = allMerged.filter((o) => o.inStock);
      if (inStockOffers.length > 0) {
        const minOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
        updatedDigital.currentLowestPrice = minOffer.price;
        updatedDigital.currentLowestMerchant = minOffer.merchantName;
      }
      
      updatedDigital.offers = allMerged;
    } else {
      updatedDigital.offers = updatedDigital.offers.map((o) => ({
        ...o,
        merchantName: cleanMerchantName(o.merchantName),
      }));
    }

    // Calcul de l'historique réel Digital
    if (realHistory && realHistory.length > 0) {
      const digitalHist = processHistoryForEdition(realHistory, model.id, 'digital');
      updatedDigital.priceHistory = {
        '7d': digitalHist['7d'],
        '30d': digitalHist['30d'],
        '3m': digitalHist['3m'],
        '6m': digitalHist['6m'],
        '1y': digitalHist['1y'],
      };
      if (digitalHist.lowestEver) {
        updatedDigital.lowestEverPrice = digitalHist.lowestEver.price;
        updatedDigital.lowestEverDate = digitalHist.lowestEver.date;
      }
      if (digitalHist.highestEver) {
        updatedDigital.highestPrice = digitalHist.highestEver;
      }
      if (digitalHist.average) {
        updatedDigital.averagePrice = digitalHist.average;
      }
    }

    // 2. Disc Edition (si existante)
    let updatedDisc = model.discEdition ? { ...model.discEdition } : undefined;
    if (updatedDisc) {
      const liveDiscOffers = (liveOffers || []).filter(
        (o) => o.productId === model.id && o.editionType === 'disc'
      );

      if (liveDiscOffers.length > 0) {
        const convertedOffers: MerchantOffer[] = liveDiscOffers.map((lo) => {
          const merchantClean = cleanMerchantName(lo.merchantName);

          return {
            id: lo.id,
            merchantName: merchantClean,
            merchantLogo: '',
            condition: lo.condition === 'refurbished' ? 'refurbished' : 'new',
            conditionLabel: lo.conditionLabel || (lo.condition === 'refurbished' ? 'Reconditionné vérifié' : 'Neuf scellé'),
            price: lo.price,
            originalPrice: lo.originalPrice,
            inStock: lo.inStock,
            stockStatus: lo.inStock ? (lo.stockStatus || 'in_stock') : 'out_of_stock',
            deliveryInfo: lo.deliveryInfo || (lo.deliveryPrice === 0 ? 'Livraison gratuite' : `Livraison ${lo.deliveryPrice.toFixed(2)} €`),
            url: lo.url,
            isBestPrice: false,
            lastUpdated: lo.lastCheckedFormatted ? `Vérifié le ${lo.lastCheckedFormatted}` : 'Vérifié par TRACKO',
            sourceType: 'manual_verification',
            isLive: true,
            feedSourceUrl: lo.feedSourceUrl,
          };
        });

        const otherOffers = updatedDisc.offers
          .filter((o) => !liveDiscOffers.some((lo) => cleanMerchantName(lo.merchantName).toLowerCase() === cleanMerchantName(o.merchantName).toLowerCase()))
          .map((o) => ({ ...o, merchantName: cleanMerchantName(o.merchantName) }));

        const allMerged = [...convertedOffers, ...otherOffers];
        const inStockOffers = allMerged.filter((o) => o.inStock);
        if (inStockOffers.length > 0) {
          const minOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
          updatedDisc.currentLowestPrice = minOffer.price;
          updatedDisc.currentLowestMerchant = minOffer.merchantName;
        }

        updatedDisc.offers = allMerged;
      } else {
        updatedDisc.offers = updatedDisc.offers.map((o) => ({
          ...o,
          merchantName: cleanMerchantName(o.merchantName),
        }));
      }

      // Calcul de l'historique réel Disc
      if (realHistory && realHistory.length > 0) {
        const discHist = processHistoryForEdition(realHistory, model.id, 'disc');
        updatedDisc.priceHistory = {
          '7d': discHist['7d'],
          '30d': discHist['30d'],
          '3m': discHist['3m'],
          '6m': discHist['6m'],
          '1y': discHist['1y'],
        };
        if (discHist.lowestEver) {
          updatedDisc.lowestEverPrice = discHist.lowestEver.price;
          updatedDisc.lowestEverDate = discHist.lowestEver.date;
        }
        if (discHist.highestEver) {
          updatedDisc.highestPrice = discHist.highestEver;
        }
        if (discHist.average) {
          updatedDisc.averagePrice = discHist.average;
        }
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
