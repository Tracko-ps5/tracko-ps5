// Couche "données live" : surcouche modifiable via l'administration, appliquée
// par-dessus les données de référence (mock-ps5.ts). Tant qu'aucune modification
// n'a été enregistrée depuis l'administration, le site affiche les données de
// référence telles quelles — jamais de page cassée ou vide.
import { getStore } from "@netlify/blobs";
import { variants as staticVariants, computeLevel } from "../data/mock-ps5";
import type { Variant, Merchant } from "../data/mock-ps5";

export interface LiveMerchant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  url: string;
  trustRating: number;
}

// Clé : "familySlug:edition:version" → liste de marchands pour cette variante
export type LiveOverrides = Record<string, LiveMerchant[]>;

const STORE_NAME = "tracko-admin";
const OVERRIDES_KEY = "overrides";

function variantKey(familySlug: string, edition: string, version: string): string {
  return `${familySlug}:${edition}:${version}`;
}

export async function getLiveOverrides(): Promise<LiveOverrides> {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get(OVERRIDES_KEY, { type: "json" });
    return (data as LiveOverrides) || {};
  } catch {
    // Netlify Blobs indisponible (ex: en dev local sans `netlify dev`) → on retombe
    // silencieusement sur les données de référence.
    return {};
  }
}

export async function saveLiveOverrides(overrides: LiveOverrides): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(OVERRIDES_KEY, overrides);
}

export function applyOverride(variant: Variant, overrides: LiveOverrides): Variant {
  const key = variantKey(variant.familySlug, variant.edition, variant.version);
  const override = overrides[key];
  if (!override || override.length === 0) return variant;

  const merchants: Merchant[] = override.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    available: m.available,
    trustRating: m.trustRating,
    url: m.url,
    updatedAt: new Date().toISOString().slice(0, 10),
  }));

  const availablePrices = merchants.filter((m) => m.available).map((m) => m.price);
  const currentPrice =
    availablePrices.length > 0 ? Math.min(...availablePrices) : Math.min(...merchants.map((m) => m.price));
  const { level, reason } = computeLevel(currentPrice, variant.averagePrice);

  return {
    ...variant,
    merchants,
    currentPrice,
    priceLevel: level,
    priceLevelReason: reason,
  };
}export async function getLiveVariant(familySlug: string, edition: string, version: string): Promise<Variant | undefined> {
  const base = staticVariants.find((v) => v.familySlug === familySlug && v.edition === edition && v.version === version);
  if (!base) return undefined;
  const overrides = await getLiveOverrides();
  return applyOverride(base, overrides);
}

export async function getLiveVariantsForFamily(familySlug: string): Promise<Variant[]> {
  const overrides = await getLiveOverrides();
  return staticVariants.filter((v) => v.familySlug === familySlug).map((v) => applyOverride(v, overrides));
}

export async function getAllLiveVariants(): Promise<Variant[]> {
  const overrides = await getLiveOverrides();
  return staticVariants.map((v) => applyOverride(v, overrides));
}

// Utilitaire pour l'écran d'administration : construit l'état actuel (live si
// présent, sinon référence) sous la forme éditable LiveOverrides complète.
export async function getEditableSnapshot(): Promise<LiveOverrides> {
  const overrides = await getLiveOverrides();
  const snapshot: LiveOverrides = {};
  for (const v of staticVariants) {
    const key = variantKey(v.familySlug, v.edition, v.version);
    const existing = overrides[key];
    snapshot[key] = existing && existing.length > 0
      ? existing
      : v.merchants.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          available: m.available,
          url: m.url,
          trustRating: m.trustRating,
        }));
  }
  return snapshot;
}
