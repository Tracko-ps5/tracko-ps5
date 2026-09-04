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

export async function fetchPriceHistory(productId?: string, editionType?: 'digital' | 'disc'): Promise<PriceHistoryEntry[]> {
  try {
    let url = '/api/history';
    if (productId && editionType) {
      url += `?productId=${productId}&editionType=${editionType}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur lors du chargement de l\'historique');
    return await res.json();
  } catch (err) {
    console.error('[API TRACKO] Impossible de charger l\'historique:', err);
    return [];
  }
}

export async function fetchAllPriceHistory(): Promise<PriceHistoryEntry[]> {
  return fetchPriceHistory();
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

export async function deletePriceAlert(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    console.error('[API TRACKO] Erreur suppression alerte:', err);
    return { success: false, message: 'Impossible de joindre le serveur pour supprimer l\'alerte.' };
  }
}

export async function updatePriceAlert(id: string, targetPrice: number): Promise<{ success: boolean; alert?: any; message: string }> {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPrice }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('[API TRACKO] Erreur mise à jour alerte:', err);
    return { success: false, message: 'Impossible de joindre le serveur pour mettre à jour l\'alerte.' };
  }
}

// ==========================================
// MÉTHODES API ADMIN PRIVÉ
// ==========================================

export async function loginAdmin(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Erreur réseau de connexion.' };
  }
}

export async function fetchAdminOffers(token: string): Promise<{ offers: LiveOffer[]; products: any[]; merchants: any[]; history: PriceHistoryEntry[] }> {
  const res = await fetch('/api/admin/offers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Accès refusé ou session expirée.');
  return await res.json();
}

export async function saveAdminOffer(token: string, offer: any): Promise<{ success: boolean; offer?: LiveOffer; message?: string; historyAdded?: boolean }> {
  const res = await fetch('/api/admin/offers/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ offer }),
  });
  return await res.json();
}

export async function bulkSaveAdminOffers(token: string, offers: any[]): Promise<{ success: boolean; updatedCount?: number; historyCount?: number }> {
  const res = await fetch('/api/admin/offers/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ offers }),
  });
  return await res.json();
}

export async function fetchLatestObservations(token: string): Promise<{ lastObservations: any[] }> {
  const res = await fetch('/api/admin/history/latest', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}

export async function exportAdminBackup(token: string): Promise<any> {
  const res = await fetch('/api/admin/backup', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}

export async function importAdminBackup(token: string, data: any): Promise<{ success: boolean }> {
  const res = await fetch('/api/admin/backup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function fetchAlertsStatus(): Promise<{
  alertEngine: string;
  persistence: string;
  resend: {
    service: string;
    configured: boolean;
    status: string;
    statusLabel: string;
    fromEmail: string;
    maskedKey: string | null;
    notes: string;
  };
  activeAlertsCount: number;
  allAlertsCount: number;
}> {
  const res = await fetch('/api/alerts/status');
  return await res.json();
}

export async function triggerManualAlertEvaluation(): Promise<any> {
  const res = await fetch('/api/alerts/evaluate', { method: 'POST' });
  return await res.json();
}

export async function runAlertTests(): Promise<{ passed: number; failed: number; total: number }> {
  const res = await fetch('/api/alerts/run-tests');
  return await res.json();
}


