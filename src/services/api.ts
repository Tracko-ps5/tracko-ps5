import { LiveOffer, PriceHistoryEntry } from '../backend/types';

export async function fetchLiveOffers(productId?: string, editionType?: 'digital' | 'disc'): Promise<LiveOffer[]> {
  try {
    let url = '/api/offers';
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (editionType) params.append('editionType', editionType);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors du chargement des offres');
    return await res.json();
  } catch (err) {
    console.error('[API TRACKO] Impossible de charger les offres live:', err);
    return [];
  }
}

export async function fetchPriceHistory(productId: string, editionType: 'digital' | 'disc'): Promise<PriceHistoryEntry[]> {
  try {
    const res = await fetch(`/api/history?productId=${productId}&editionType=${editionType}`);
    if (!res.ok) throw new Error('Erreur lors du chargement de l\'historique');
    return await res.json();
  } catch (err) {
    console.error('[API TRACKO] Impossible de charger l\'historique:', err);
    return [];
  }
}

export async function triggerPilotSync(): Promise<any> {
  try {
    const res = await fetch('/api/connectors/sync-all', { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('[API TRACKO] Erreur déclenchement connecteurs:', err);
    throw err;
  }
}

export async function createPriceAlert(data: {
  email: string;
  productId: string;
  productName: string;
  editionType: 'digital' | 'disc';
  targetPrice: number;
  currentPriceAtCreation: number;
}): Promise<{ success: boolean; alert?: any; message: string }> {
  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    console.error('[API TRACKO] Erreur création alerte:', err);
    return { success: false, message: 'Impossible de joindre le serveur TRACKO.' };
  }
}
