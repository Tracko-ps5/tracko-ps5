// Stockage des alertes créées par les visiteurs, via Netlify Blobs.
// Deux types d'alertes cohabitent dans le même store :
// - "price"  : prévenir quand le prix passe sous un seuil (fonctionnement historique)
// - "stock"  : prévenir quand une variante repasse de indisponible à disponible
import { getStore } from "@netlify/blobs";

export type AlertType = "price" | "stock";

export interface Alert {
  id: string;
  // Optionnel à la lecture pour rester compatible avec les alertes déjà
  // enregistrées avant l'ajout de ce champ (voir normalizeAlert ci-dessous) ;
  // toujours défini après passage par getAlerts()/addAlert().
  type: AlertType;
  email: string;
  familySlug: string;
  edition: string;
  version: string;
  productLabel: string;
  // Alertes "price" uniquement.
  targetPrice: number | null;
  // Alertes "stock" uniquement : dernier état de disponibilité connu, pour
  // ne détecter qu'une vraie transition indisponible → disponible et
  // permettre un réarmement si le produit repasse ensuite en rupture.
  wasAvailable: boolean | null;
  createdAt: string;
  notifiedAt: string | null;
}

const STORE_NAME = "tracko-alerts";
const ALERTS_KEY = "alerts";

// Les alertes enregistrées avant l'ajout des alertes de stock n'ont ni
// `type` ni `wasAvailable` : elles sont alors implicitement des alertes de
// prix, avec leur `targetPrice` déjà en place. On les normalise ici plutôt
// que de migrer les données stockées, pour ne rien casser.
function normalizeAlert(raw: unknown): Alert | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Partial<Alert> & Record<string, unknown>;
  if (typeof a.id !== "string" || typeof a.email !== "string") return null;

  const type: AlertType = a.type === "stock" ? "stock" : "price";

  return {
    id: a.id,
    type,
    email: a.email,
    familySlug: String(a.familySlug ?? ""),
    edition: String(a.edition ?? ""),
    version: String(a.version ?? ""),
    productLabel: String(a.productLabel ?? ""),
    targetPrice: type === "price" ? (typeof a.targetPrice === "number" ? a.targetPrice : null) : null,
    wasAvailable: type === "stock" ? (typeof a.wasAvailable === "boolean" ? a.wasAvailable : false) : null,
    createdAt: typeof a.createdAt === "string" ? a.createdAt : new Date().toISOString(),
    notifiedAt: typeof a.notifiedAt === "string" ? a.notifiedAt : null,
  };
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get(ALERTS_KEY, { type: "json" });
    if (!Array.isArray(data)) return [];
    return data.map(normalizeAlert).filter((a): a is Alert => a !== null);
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(ALERTS_KEY, alerts);
}

export async function addAlert(input: {
  type: AlertType;
  email: string;
  familySlug: string;
  edition: string;
  version: string;
  productLabel: string;
  // "price" uniquement
  targetPrice?: number;
  // "stock" uniquement : disponibilité au moment de la création de l'alerte
  currentAvailability?: boolean;
}): Promise<Alert> {
  const alerts = await getAlerts();
  const alert: Alert = {
    id: crypto.randomUUID(),
    type: input.type,
    email: input.email,
    familySlug: input.familySlug,
    edition: input.edition,
    version: input.version,
    productLabel: input.productLabel,
    targetPrice: input.type === "price" ? (input.targetPrice ?? null) : null,
    wasAvailable: input.type === "stock" ? (input.currentAvailability ?? false) : null,
    createdAt: new Date().toISOString(),
    notifiedAt: null,
  };
  alerts.push(alert);
  await saveAlerts(alerts);
  return alert;
}
