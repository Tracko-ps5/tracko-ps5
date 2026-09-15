// Stockage des alertes de prix créées par les visiteurs, via Netlify Blobs.
import { getStore } from "@netlify/blobs";

export interface Alert {
  id: string;
  email: string;
  familySlug: string;
  edition: string;
  version: string;
  productLabel: string;
  targetPrice: number;
  createdAt: string;
  notifiedAt: string | null;
}

const STORE_NAME = "tracko-alerts";
const ALERTS_KEY = "alerts";

export async function getAlerts(): Promise<Alert[]> {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get(ALERTS_KEY, { type: "json" });
    return Array.isArray(data) ? (data as Alert[]) : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(ALERTS_KEY, alerts);
}

export async function addAlert(input: {
  email: string;
  familySlug: string;
  edition: string;
  version: string;
  productLabel: string;
  targetPrice: number;
}): Promise<Alert> {
  const alerts = await getAlerts();
  const alert: Alert = {
    id: crypto.randomUUID(),
    email: input.email,
    familySlug: input.familySlug,
    edition: input.edition,
    version: input.version,
    productLabel: input.productLabel,
    targetPrice: input.targetPrice,
    createdAt: new Date().toISOString(),
    notifiedAt: null,
  };
  alerts.push(alert);
  await saveAlerts(alerts);
  return alert;
}
