// Configuration du bandeau gaming — modifie cette date pour changer le compte à rebours.
// Format : ISO 8601. Le composant CountdownBanner.astro se charge du calcul.

export const gtaBannerConfig = {
  // ⚠️ Date d'exemple pour la démo — à ajuster à la vraie date de sortie annoncée.
  releaseDateISO: "2026-11-19T00:00:00",

  // Chemin déjà pré-rempli avec le nom de fichier attendu — dépose ton
  // fichier dans /public/images/ avec exactement ce nom, rien d'autre à
  // modifier. Tant que le fichier n'existe pas, l'emplacement neutre reste
  // affiché à la place.
  bannerImagePath: "/images/gta-vi-banner.jpg" as string | null,

  // Page officielle de précommande Rockstar Store (pas un revendeur tiers).
  preorderUrl: "https://store.rockstargames.com/fr/game/buy-gta-vi",
};
