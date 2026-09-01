export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoGuideData {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  readingTime: string;
  publishedDate: string;
  sections: Array<{
    heading: string;
    content: string[];
    tips?: string;
  }>;
  relatedModelId?: string;
}

export const MAIN_FAQS: FaqItem[] = [
  {
    question: "Quel est le prix officiel (MSRP) de la PlayStation 5 en France ?",
    answer: "Les prix de vente conseillés par Sony sont : 449,99 € pour la PS5 Slim Édition Digitale (1 To), 549,99 € pour la PS5 Slim avec lecteur de disque Blu-ray (1 To), et 799,99 € pour la PS5 Pro (2 To SSD). Les marchands proposent régulièrement des offres promotionnelles répertoriées en temps réel sur TRACKO."
  },
  {
    question: "Quelle est la différence entre la PS5 Slim Digitale et la PS5 Slim avec Lecteur ?",
    answer: "Les performances de jeu et les composants graphiques sont strictement identiques. La version avec lecteur possède un lecteur de disque Blu-ray 4K Ultra HD permettant de lire les jeux physiques et films. La version Digitale nécessite le téléchargement des jeux via le PlayStation Store, mais un lecteur amovible officiel Sony (vendu séparément à environ 119 €) peut y être ajouté ultérieurement."
  },
  {
    question: "Comment fonctionne l'indicateur de prix TRACKO (Bon Prix / Prix Moyen / Mauvais Prix) ?",
    answer: "TRACKO analyse l'historique des prix constatés chez les principaux marchands (Fnac, Amazon, Cdiscount, Boulanger). Un 'Bon Prix' (vert) correspond à un tarif inférieur au prix moyen du marché ou au prix officiel Sony. Un 'Prix Moyen' (orange) correspond au prix standard constaté. Un 'Mauvais Prix' (rouge) indique une surcote ou une offre marketplace supérieure au tarif conseillé."
  },
  {
    question: "Vaut-il mieux acheter une PS5 neuve ou reconditionnée ?",
    answer: "Une PS5 neuve offre 2 ans de garantie constructeur Sony intégrale. Une PS5 reconditionnée certifiée (état très bon ou parfait) permet d'économiser entre 50 € et 120 €, tout en bénéficiant d'une garantie légale d'au moins 12 à 24 mois selon le marchand. TRACKO vous permet de filtrer les offres par état pour comparer en toute transparence."
  },
  {
    question: "À quelle fréquence les prix et stocks sont-ils vérifiés sur TRACKO ?",
    answer: "Les prix et la disponibilité en stock sont synchronisés de manière continue et automatisée auprès des marchands partenaires pour vous garantir une information fiable avant votre achat."
  }
];

export const SEO_GUIDES: Record<string, SeoGuideData> = {
  'digital-vs-lecteur': {
    id: 'digital-vs-lecteur',
    slug: '/comparatif-ps5-digital-vs-lecteur',
    title: 'PS5 Digitale vs PS5 avec Lecteur : Quel modèle choisir ?',
    subtitle: 'Comparatif complet, calcul de rentabilité sur 3 ans et critères de choix pour faire le bon achat.',
    metaTitle: 'PS5 Digitale vs Lecteur : Comparatif et Guide d\'Achat | TRACKO',
    metaDescription: 'Faut-il acheter la PS5 Slim Digitale ou la version avec lecteur de disque ? Découvrez le comparatif des prix, avantages, inconvénients et rentabilité.',
    readingTime: '4 min',
    publishedDate: '01/09/2026',
    sections: [
      {
        heading: '1. Comparaison des caractéristiques techniques',
        content: [
          'La PlayStation 5 Slim Digitale et la version avec lecteur partagent exactement la même architecture matérielle : processeur AMD Zen 2, carte graphique RDNA 2 de 10,28 TFLOPS, et stockage SSD ultra-rapide de 1 To (environ 848 Go exploitables).',
          'La seule différence réside dans la présence du lecteur optique Blu-ray 4K Ultra HD intégré et le poids de la console (3,2 kg pour la version disque contre 2,6 kg pour la version digitale).'
        ]
      },
      {
        heading: '2. Écart de prix et rentabilité des jeux physiques',
        content: [
          'À l\'achat de la console, la PS5 Slim Digitale coûte généralement 100 € de moins que la version disque (449 € vs 549 € prix conseillés).',
          'Toutefois, les jeux sur disque bénéficient de fortes promotions en magasin, du marché de l\'occasion (Leboncoin, Vinted, magasins spécialisés) et de la possibilité d\'être revendus après utilisation.',
          'Si vous achetez plus de 3 ou 4 jeux récents par an, l\'économie réalisée grâce aux disques physiques et à l\'occasion compense très rapidement l\'écart initial de 100 €.'
        ],
        tips: 'Astuce TRACKO : La PS5 Slim Digitale est modulaire. Si vous regrettez votre choix, vous pouvez acheter le lecteur de disque amovible officiel Sony ultérieurement et le clipser sans outil.'
      },
      {
        heading: '3. Verdict : Pour qui est chaque modèle ?',
        content: [
          'Choisissez la PS5 Digitale si : vous jouez principalement à des jeux en ligne gratuits (Fortnite, Warzone), disposez d\'un abonnement PlayStation Plus Extra/Premium, ou préférez une console ultra-compacte sans boîtes de jeux chez vous.',
          'Choisissez la PS5 avec Lecteur si : vous possédez déjà une collection de jeux PS4 sur disque, souhaitez revendre vos jeux finis, ou utilisez votre console comme lecteur Blu-ray 4K pour vos films.'
        ]
      }
    ],
    relatedModelId: 'ps5-slim'
  },
  'neuf-vs-reconditionne': {
    id: 'neuf-vs-reconditionne',
    slug: '/ps5-neuf-vs-reconditionne',
    title: 'Acheter une PS5 : Neuf ou Reconditionné ? Guide & Pièges à éviter',
    subtitle: 'Comment économiser intelligemment sur votre PlayStation 5 en toute sécurité et avec garantie.',
    metaTitle: 'PS5 Neuve ou Reconditionnée : Comparatif Prix et Garanties | TRACKO',
    metaDescription: 'Est-ce rentable d\'acheter une PS5 reconditionnée ? Garanties, état de la manette DualSense, prix moyens constatés et conseils d\'experts.',
    readingTime: '5 min',
    publishedDate: '01/09/2026',
    sections: [
      {
        heading: '1. Les garanties légales : Neuf vs Reconditionné',
        content: [
          'Une PS5 neuve achetée auprès d\'un marchand officiel (Fnac, Amazon, Boulanger, Cdiscount) bénéficie de la garantie légale de conformité de 2 ans et du support officiel Sony.',
          'Une PS5 reconditionnée vendue par un professionnel certifié propose généralement une garantie de 12 à 24 mois couvrant les pannes matérielles de la console et de son alimentation.'
        ]
      },
      {
        heading: '2. Les éléments critiques à vérifier sur une console reconditionnée',
        content: [
          'Le fonctionnement de la manette DualSense : les sticks analogiques ne doivent pas présenter de dérive (drift) et les gâchettes adaptatives doivent réagir normalement.',
          'Le système de ventilation et le niveau sonore : une console reconditionnée doit avoir été dépoussiérée pour éviter toute surchauffe.',
          'Le port HDMI 2.1 et les connectiques USB : vérifiez l\'absence de jeu ou de détérioration physique sur le port vidéo.'
        ],
        tips: 'Conseil TRACKO : Privilégiez toujours les grades "Excellent état" ou "Comme neuf" pour bénéficier d\'une console esthétiquement impeccable.'
      },
      {
        heading: '3. Quelle économie réelle ?',
        content: [
          'En moyenne, une PS5 Slim reconditionnée permet d\'économiser entre 60 € et 120 € par rapport au prix neuf constructeur.',
          'Sur TRACKO, utilisez le filtre "État" (Neuf / Reconditionné) pour observer immédiatement l\'écart de prix chez les différents vendeurs.'
        ]
      }
    ],
    relatedModelId: 'ps5-slim'
  }
};
