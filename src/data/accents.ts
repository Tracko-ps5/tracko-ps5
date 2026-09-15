import type { Family } from "./mock-ps5";

export interface FamilyAccent {
  light: string;
  mid: string;
  deep: string;
}

export const familyAccents: Record<Family["slug"], FamilyAccent> = {
  ps5: { light: "#C7D6DF", mid: "#4F7186", deep: "#2E4451" },
  "ps5-slim": { light: "#D6D2DE", mid: "#786F8C", deep: "#453E58" },
  "ps5-pro": { light: "#DFCBB5", mid: "#A9704E", deep: "#6C4630" },
};
