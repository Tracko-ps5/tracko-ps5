// Configuration globale du site TRACKO
export const APP_CONFIG = {
  name: 'TRACKO',
  tagline: 'Trouve le meilleur prix. Au bon moment.',
  subTagline: 'Compare les prix. Suis leur évolution. Achète au bon moment.',
  contactEmail: 'contact@tracko.fr',
  
  // Date de sortie cible pour le compte à rebours GTA VI (19 novembre 2026, fuseau France UTC+1)
  gtaViReleaseDate: '2026-11-19T00:00:00+01:00',
  gtaViTitle: 'GTA VI',
  gtaViSubtitle: 'PROCHAINE SORTIE',

  // Marchands surveillés
  merchants: [
    { name: 'Amazon', logo: '🛒', url: 'https://www.amazon.fr' },
    { name: 'Fnac', logo: '🟡', url: 'https://www.fnac.com' },
    { name: 'Cdiscount', logo: '📦', url: 'https://www.cdiscount.com' },
    { name: 'Boulanger', logo: '🟠', url: 'https://www.boulanger.com' },
    { name: 'PlayStation Direct', logo: '🎮', url: 'https://direct.playstation.com' },
  ],

  // Note de transparence (Règle N°6 & N°21)
  isMockData: true,
  mockDataDisclaimer: 'Données de démonstration calibrées sur les prix réels observés chez les marchands officiels français.',
};
