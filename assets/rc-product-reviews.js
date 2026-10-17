(() => {
  const AUTHORS = [
    'Marc L.', 'Sophie D.', 'Thomas R.', 'Julien M.', 'Camille B.', 'Nicolas P.', 'Léa M.',
    'Alexandre G.', 'Chloé R.', 'Maxime T.', 'Manon L.', 'Antoine B.', 'Emma C.', 'Hugo D.',
    'Inès P.', 'Lucas V.', 'Clara F.', 'Mathieu S.', 'Sarah K.', 'Adrien N.', 'Pauline H.',
    'Romain C.', 'Julie W.', 'Baptiste A.', 'Marine E.', 'Kevin B.', 'Anaïs T.', 'Florian G.',
    'Elodie M.', 'Pierre L.', 'Nadia R.', 'Yanis K.', 'Céline D.', 'Guillaume F.', 'Lina B.',
    'Quentin R.', 'Amandine S.', 'Mehdi A.', 'Claire P.', 'Théo L.', 'Laura N.', 'Damien V.',
    'Mélanie H.', 'Juliette C.', 'Karim B.', 'Audrey F.', 'Benjamin S.', 'Noémie D.', 'Valentin P.',
    'Isabelle R.',
  ];

  const CITIES = [
    'Lyon', 'Nantes', 'Toulouse', 'Lille', 'Bordeaux', 'Rennes', 'Strasbourg', 'Montpellier',
    'Grenoble', 'Nice', 'Dijon', 'Angers', 'Tours', 'Reims', 'Clermont-Ferrand', 'Le Mans',
    'Orléans', 'Caen', 'Annecy', 'La Rochelle', 'Avignon', 'Pau', 'Bayonne', 'Poitiers', 'Metz',
  ];

  const COUNTS = {
    'sweep-pro-4x4-70-kmh-rclab': 70,
    'nissan-gt-r-nismo-gt500-1-24-voiture-telecommandee-drift-et-piste': 68,
    '4x4-tout-terrain-1-16-50-km-h': 67,
    'lancia-delta-martini-1-14-rc-rclab': 64,
    'lancia-delta-martini-racing-1-14-voiture-telecommandee-de-rallye-et-drift': 64,
    '4x4-rc-1-16-brushless-70-kmh-rclab': 63,
    '4x4-off-road-1-16-voiture-telecommandee-brushless-70-km-h': 63,
    'force-13-buggy-4x4-75-kmh-rclab': 61,
    'force-13-1-12-buggy-telecommande-4x4-haute-vitesse-75-km-h': 61,
    'buggy-off-road-4x4-1-16-rclab': 60,
    'voiture-telecommandee-buggy-off-road-4x4-1-16': 60,
    'buggy-4x4-1-14-brushless-70-km-h': 59,
    '4x4-tout-terrain-brushless-70-km-h-rclab': 58,
    'drive-4x4-voiture-telecommandee-tout-terrain-70-km-h': 58,
    'hyper-go-tout-terrain-4wd-50km-h': 57,
    'trophy-truck-rc-1-16-50-kmh-rclab': 48,
    'trophy-truck-rc-1-16-voiture-telecommandee-4x4-50-km-h': 48,
    'trophy-truck-rc-1-16-brushless-70-rclab': 46,
    'trophy-truck-rc-1-16-brushless-voiture-telecommandee-4x4-70-km-h': 46,
    'traxxas-mini-maxx-bl-2s-rclab': 45,
    'z06-evo-buggy-4x4-rc-1-14-brushless-60-km-h': 44,
    '4x4-rc-1-14-brushless-60-kmh-rclab': 44,
    'buggy-4x4-1-14-brushless-75-km-h-v2': 43,
    'polo-r-wrc-1-14-rc-rallye-rclab': 42,
    'volkswagen-polo-r-wrc-1-14-voiture-telecommandee-de-rallye-et-drift': 42,
    'citroen-c3-wrc-1-14-rc-rallye-rclab': 41,
    'ford-mustang-gt-1-24-rc-drift-rclab': 40,
    'crawler-jeep-wrangler-1-12-rclab': 39,
    'monster-truck-rc-1-16-brushless-75-rclab': 38,
    'rapidly-4x4-1-16-50-kmh-rclab': 38,
    'porsche-911-gt3-r-1-24-rc-drift-rclab': 37,
    'bmw-m4-gt3-1-24-rc-drift-rclab': 37,
    'monster-truck-rc-1-16-brushed-45-rclab': 36,
    'buggy-mantis-1-16-4wd-rclab': 35,
    'truggy-1-16-brushless-70-kmh-3s-rclab': 35,
    'nissan-gt-r-r35-1-24-voiture-telecommandee-drift-et-piste-30-km-h': 34,
    'buggy-rc-match-1-10-4x4-rclab': 34,
    '4x4-brushless-1-16-85-km-h': 33,
    'monster-truck-blackzon-slyder-1-16-rclab': 33,
    '4x4-robuste-1-16-40-km-h': 32,
    'crawler-4x4-1-16-double-moteur-rclab': 32,
    'buggy-1-16-voiture-telecommandee-pour-enfant-25-km-h': 31,
    'crawler-4x4-jeune-enfant-rclab': 30,
  };

  const CARS = {
    'sweep-pro-4x4-70-kmh-rclab': { name: 'Sweep Pro', speed: '70', scale: '1/16', cat: 'monster' },
    '4x4-tout-terrain-1-16-50-km-h': { name: 'Conquer', speed: '50', scale: '1/16', cat: 'monster' },
    'lancia-delta-martini-1-14-rc-rclab': { name: 'Lancia Delta', speed: '65', scale: '1/14', cat: 'drift' },
    'lancia-delta-martini-racing-1-14-voiture-telecommandee-de-rallye-et-drift': { name: 'Lancia Delta', speed: '65', scale: '1/14', cat: 'drift' },
    'nissan-gt-r-nismo-gt500-1-24-voiture-telecommandee-drift-et-piste': { name: 'NISMO GT500', speed: '30', scale: '1/24', cat: 'drift' },
    '4x4-rc-1-16-brushless-70-kmh-rclab': { name: 'Gantry Pro', speed: '70', scale: '1/16', cat: 'monster' },
    '4x4-off-road-1-16-voiture-telecommandee-brushless-70-km-h': { name: 'Gantry Pro', speed: '70', scale: '1/16', cat: 'monster' },
    'force-13-buggy-4x4-75-kmh-rclab': { name: 'buggy 1/12', speed: '75', scale: '1/12', cat: 'buggy' },
    'force-13-1-12-buggy-telecommande-4x4-haute-vitesse-75-km-h': { name: 'buggy 1/12', speed: '75', scale: '1/12', cat: 'buggy' },
    'buggy-off-road-4x4-1-16-rclab': { name: 'buggy 1/16', speed: '50', scale: '1/16', cat: 'buggy' },
    'voiture-telecommandee-buggy-off-road-4x4-1-16': { name: 'buggy 1/16', speed: '50', scale: '1/16', cat: 'buggy' },
    'buggy-4x4-1-14-brushless-70-km-h': { name: 'Z06', speed: '70', scale: '1/14', cat: 'buggy' },
    '4x4-tout-terrain-brushless-70-km-h-rclab': { name: 'Drive', speed: '70', scale: '1/16', cat: 'monster' },
    'drive-4x4-voiture-telecommandee-tout-terrain-70-km-h': { name: 'Drive', speed: '70', scale: '1/16', cat: 'monster' },
    'hyper-go-tout-terrain-4wd-50km-h': { name: 'Hyper Go', speed: '50', scale: '1/14', cat: 'premium' },
    'trophy-truck-rc-1-16-50-kmh-rclab': { name: 'RAPID 50', speed: '50', scale: '1/16', cat: 'trophy' },
    'trophy-truck-rc-1-16-brushless-70-rclab': { name: 'RAPID 70', speed: '70', scale: '1/14', cat: 'trophy' },
    'traxxas-mini-maxx-bl-2s-rclab': { name: 'Mini Maxx', speed: '50', scale: '1/16', cat: 'premium' },
    'z06-evo-buggy-4x4-rc-1-14-brushless-60-km-h': { name: 'Z06 Evo', speed: '60', scale: '1/14', cat: 'buggy' },
    '4x4-rc-1-14-brushless-60-kmh-rclab': { name: 'Z06 Evo', speed: '60', scale: '1/14', cat: 'buggy' },
    'buggy-4x4-1-14-brushless-75-km-h-v2': { name: 'Z06 V2', speed: '75', scale: '1/14', cat: 'buggy' },
    'polo-r-wrc-1-14-rc-rallye-rclab': { name: 'Polo WRC', speed: '65', scale: '1/14', cat: 'drift' },
    'citroen-c3-wrc-1-14-rc-rallye-rclab': { name: 'C3 WRC', speed: '65', scale: '1/14', cat: 'drift' },
    'ford-mustang-gt-1-24-rc-drift-rclab': { name: 'Mustang', speed: '30', scale: '1/24', cat: 'drift' },
    'crawler-jeep-wrangler-1-12-rclab': { name: 'Jeep Wrangler', speed: '8', scale: '1/12', cat: 'crawler' },
    'monster-truck-rc-1-16-brushless-75-rclab': { name: 'Monster 75', speed: '75', scale: '1/16', cat: 'monster' },
    'rapidly-4x4-1-16-50-kmh-rclab': { name: 'Rapidly', speed: '50', scale: '1/16', cat: 'monster' },
    'porsche-911-gt3-r-1-24-rc-drift-rclab': { name: 'Porsche GT3', speed: '30', scale: '1/24', cat: 'drift' },
    'bmw-m4-gt3-1-24-rc-drift-rclab': { name: 'BMW M4', speed: '30', scale: '1/24', cat: 'drift' },
    'monster-truck-rc-1-16-brushed-45-rclab': { name: 'Monster 45', speed: '45', scale: '1/16', cat: 'monster' },
    'buggy-mantis-1-16-4wd-rclab': { name: 'Mantis', speed: '45', scale: '1/16', cat: 'buggy' },
    'truggy-1-16-brushless-70-kmh-3s-rclab': { name: 'Truggy 3S', speed: '70', scale: '1/16', cat: 'buggy' },
    'nissan-gt-r-r35-1-24-voiture-telecommandee-drift-et-piste-30-km-h': { name: 'GT-R R35', speed: '30', scale: '1/24', cat: 'drift' },
    'buggy-rc-match-1-10-4x4-rclab': { name: 'MATCH 1/10', speed: '45', scale: '1/10', cat: 'buggy' },
    '4x4-brushless-1-16-85-km-h': { name: '4x4 85', speed: '85', scale: '1/16', cat: 'monster' },
    'monster-truck-blackzon-slyder-1-16-rclab': { name: 'Slyder', speed: '30', scale: '1/16', cat: 'monster' },
    '4x4-robuste-1-16-40-km-h': { name: '4x4 40', speed: '40', scale: '1/16', cat: 'monster' },
    'crawler-4x4-1-16-double-moteur-rclab': { name: 'crawler double moteur', speed: '10', scale: '1/16', cat: 'crawler' },
    'buggy-1-16-voiture-telecommandee-pour-enfant-25-km-h': { name: 'buggy enfant', speed: '25', scale: '1/16', cat: 'kids' },
    'crawler-4x4-jeune-enfant-rclab': { name: 'crawler enfant', speed: '6', scale: '1/18', cat: 'kids' },
  };

  const TEXTS = {
    all: [
      "J'avais peur d'un jouet Alibaba qui casse au premier choc. Boîte ouverte, châssis propre, rien à monter. On a roulé le soir même.",
      "Le SAV a répondu le lendemain sur une question batterie. Ça change tout quand tu commandes sans connaître la RC.",
      "Livraison suivie, carton nickel, notice claire. J'hésitais à cause du délai. Au final c'est arrivé dans les 4 à 12 jours ouvrés comme annoncé.",
      "Deux batteries dans le pack, c'est ça qui m'a décidé. Une en charge, une sur le terrain. Plus de dispute au bout de 12 minutes.",
      "Je me disais trop cher vs Amazon. La différence, c'est que là ça tient les cailloux et le SAV est en France.",
      "Prêt à rouler, vraiment. Charge, allume, pars. Pas de soudures, pas de pièces en vrac. Parfait en cadeau.",
      "Retour 30 jours affiché clairement, ça m'a enlevé le dernier doute. On a gardé, évident dès la première session.",
      "La télécommande est simple. Mon ado a compris en 2 minutes, moi aussi. Pas besoin d'être mécano.",
      "J'avais commandé une RC l'an dernier ailleurs, morte en 3 sorties. Celle-ci encaisse les bordures et les chutes.",
      "Emballage sérieux, pièce par pièce calée. On sent que ça part d'un stock contrôlé, pas d'un colis bâclé.",
      "Question avant achat, réponse humaine le jour même. Ça m'a suffi pour commander sans ruminer.",
      "Je voulais un truc qui s'utilise le weekend, pas un gadget de salon. On sort dès qu'il fait sec.",
      "Les photos sont honnêtes. La taille correspond. Pas la déception du mini jouet trop petit.",
      "Paiement 4 fois, livraison offerte. Plus d'excuse pour attendre. Bon choix.",
      "Je craignais les pièces en plastique cheap. Les points qui prennent les chocs sont costauds. Rien n'a lâché.",
      "Colis suivi du début à la fin. Plus de stress douane ou colis fantôme.",
      "On a pris le pack batteries en plus. Session beaucoup plus longue, plus personne ne s'ennuie.",
      "Je commandais jamais en ligne ce genre de truc. Le suivi et le retour 30 jours m'ont débloqué.",
      "Notice en français, branchements évidents. Aucune galère au déballage.",
      "Cadeau pour un anniversaire. Arrivé à temps, déjà sorti 4 fois. Plus dans le placard.",
      "Je voulais éviter un jouet trop fragile pour un jardin en pente. Ça grimpe, ça encaisse, ça recommence.",
      "Support français, pas un chatbot. Une vraie réponse sur la charge. Tranquille.",
      "J'ai comparé 3 fiches. Ici c'est clair : vitesse, batteries, délai. Moins de pièges.",
      "Première RC de la maison. On appréhendait le réglage. Rien à régler pour commencer. On roule.",
      "Le carton est passé par Colissimo, suivi jusqu'à la boîte. Zéro friction.",
      "J'avais peur de me faire avoir sur le délai. Suivi dès l'expédition, reçu dans la fenêtre annoncée.",
      "Première commande ici. Rien à signaler côté galère. Juste le plaisir de sortir la RC le weekend.",
      "Le pack duo, c'est le bon réflexe. On ne rentre plus au bout d'un quart d'heure.",
      "Je voulais un modèle qui survive au jardin, pas au salon. Mission remplie.",
      "Question pièces, le SAV m'a dit comment faire. Pas de mur, pas d'attente de 3 semaines.",
    ],
    parent: [
      "Cadeau pour mon fils de 10 ans. J'avais peur que ce soit trop complexe. Il a roulé tout seul après la charge.",
      "On hésitait à cause de la vitesse. Sur l'herbe du jardin, c'est jouable. On reste à côté les premières fois.",
      "Mon ado voulait ça depuis Noël. J'avais peur du jouet cassé le 26. Toujours en état après les sauts du parking.",
      "Deux enfants, une voiture. Les deux batteries calment le conflit. Chacun sa session.",
      "Je voulais un cadeau qui s'utilise, pas une boîte ouverte 10 minutes. On y retourne tous les samedis.",
      "Peur que ça soit trop rapide pour un débutant. Tu commences doucement, la gâchette n'est pas tout ou rien.",
      "J'ai 40 ans, lui 13. On se la passe. Ça crée un vrai moment, pas un écran de plus.",
      "Anniversaire dans 2 semaines, j'avais le stress du délai. Reçu dans les temps, emballé proprement.",
      "Je ne m'y connais pas en RC. La fiche est claire, le SAV aussi. J'ai commandé sans appeler un copain bricoleur.",
      "On craignait le bruit pour les voisins. En terrain, ça passe. On évite le bitume sous les fenêtres le dimanche matin.",
      "Ma fille de 9 ans tient la télécommande sans galère. Petit, léger, pas une usine à gaz.",
      "J'avais peur d'acheter trop petit. L'échelle se voit dès l'ouverture. Ça a de la gueule sous le sapin.",
      "Cadeau de Noël anticipé. Si ça n'allait pas, 30 jours pour renvoyer. On n'a pas eu besoin.",
      "Le mode débutant dans la tête : on roule sur l'herbe d'abord. Moins de casse, plus de kiff.",
      "Papa inquiet du SAV après-vente. Mail, réponse, pièce expliquée. Plus la crainte du jouet mort sans recours.",
    ],
    hobby: [
      "Les {speed} km/h sont là, pas une promesse en l'air. Parking vide, première ligne droite, le sourire est venu tout seul.",
      "4x4 {scale}, ça passe ornière et gravier. J'avais peur d'un 2 roues motrices déguisé. Non, ça tire.",
      "Brushless, ça s'entend et ça se sent. Plus de jouet à charbons qui s'essouffle au bout d'un tour.",
      "Je viens du Traxxas. Pour le prix, la {car} fait le job terrain. Chocs, herbe haute, relance.",
      "Portée de la radio largement suffisante pour un parking. Pas de coupure bête à 30 mètres.",
      "Rien à souder. RTR honnête. Tu charges, tu roules, tu règles plus tard si tu veux pinailler.",
      "J'avais peur d'un ESC fragile. Après 3 weekends dont un un peu humide, toujours nickel.",
      "Les pneus accrochent l'herbe. Moins de patinage idiot qu'avec les slick de salon.",
      "La {car} a le bon compromis : assez rapide pour kiffer, assez costaud pour recommencer après un tonneau.",
      "Je cherchais une RC de session, pas de vitrine. Celle-ci sort, se salit, se rince, reprend.",
    ],
    gift: [
      "Cadeau pour mon neveu. J'avais peur qu'il faille un atelier pour la lancer. Charge le matin, tour l'après-midi.",
      "Emballage propre, ça fait cadeau tout de suite. Pas un sachet plastique triste.",
      "Je ne savais pas quoi prendre comme âge. La fiche est claire, et le SAV a confirmé avant que je paie.",
      "Offert à mon copain qui parle RC depuis 6 mois. Il a souri en voyant que c'était prêt à rouler.",
      "Peur que le modèle déçoive vs les photos. En vrai, la carrosserie a de la présence. Cadeau validé.",
      "Livraison offerte, suivi, retour 30 jours. J'ai offert sans stress de me tromper de taille.",
    ],
    speed: [
      "J'avais peur que les {speed} km/h soient gonflés. Sur le bitume sec, ça pousse vraiment. Pas un 30 km/h déguisé.",
      "Première ligne droite, j'ai levé le doigt. Ça va vite pour une {scale}. On apprend à doser.",
      "Pour un ado qui voulait de la vitesse, c'est le bon cran. Assez pour kiffer, pas une arme incontrôlable.",
      "Le 4x4 aide au relance après un saut. Pas le jouet qui reste coincé dans l'herbe à 2 cm.",
      "Batterie tenue correcte pour la pointe. On a pris une 3e, session complète sans râler.",
    ],
    drift: [
      "Drift en parking le soir, pneus fournis. J'avais peur de devoir racheter un train tout de suite. Non, ça glisse déjà.",
      "La {car} ressemble à la vraie. C'est ça qui a convaincu mon fils. Après, le drift a fait le reste.",
      "Intérieur parquet, ça part en glisse. Extérieur parking, aussi. Les deux usages, enfin.",
      "1/24, je craignais trop petit. Sur une table non. Au sol d'un salon, c'est pile le format.",
      "LED allumées, ça claque le soir. Cadeau qui se montre, pas juste un châssis nu.",
      "Facile à lancer en drift, même sans être un as. On apprend les contre-braquages en 10 minutes.",
      "Peur que ça soit un jouet piste qui refuse de glisser. Non, ça part de travers dès que tu coupes.",
      "Petite, maniable, pas besoin d'un terrain de foot. Un parking d'immeuble suffit.",
    ],
    crawler: [
      "Crawler, donc lent, et c'est le but. J'avais peur que les enfants s'ennuient. Ils grimpent des racines pendant une heure.",
      "La {car} passe des cailloux où un 4x4 rapide se plante. Franchissement, pas sprint.",
      "Pneus crantés, couple, ça grimpe le tas de terre du jardin. Exactement ce qu'on voulait.",
      "Pas la RC de vitesse. Celle du dimanche à deux, à observer la ligne. Très bon cadeau calme.",
      "Je craignais un jouet figé. Les ponts bougent, ça vit. On la regarde autant qu'on la pilote.",
    ],
    kids: [
      "Pour un enfant de 6 ans, j'avais peur du trop vite. Là c'est jouable dans le salon et le jardin.",
      "Petite, légère, télécommande simple. Mon fils n'a pas décroché au bout de 5 minutes.",
      "Cadeau d'anniversaire, peur du jouet cassé le soir. Toujours là 3 semaines plus tard.",
      "Prix doux, donc moins de stress si ça prend un choc. Et ça tient mieux que prévu.",
      "On voulait tester la RC avant d'offrir un plus gros modèle. Parfait pour commencer sans se rater.",
      "Pas besoin d'un adulte bricoleur. Charge, marche, s'amuse. C'est tout ce qu'on demandait.",
    ],
    premium: [
      "Le prix m'a fait hésiter. Une fois en main, le gap avec les 4x4 à 130 € est évident. Ça roule plus propre.",
      "J'ai payé pour un truc qui dure. Pièces dispo, montage propre, pas un jouet jetable.",
      "Cadeau pour un vrai passionné, pas un enfant de 7 ans. Reçu comme ça. Aucun regret sur la somme.",
      "Je comparais avec des copies. Ici le châssis et la radio justifient l'écart. Tu le sens au premier tour.",
    ],
  };

  const STAR = '<span aria-hidden="true">★★★★★</span>';
  const CHECK =
    '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2 4.6 9 10 3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const hash = (text) => {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  };

  const rng = (seed) => {
    let a = seed || 1;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const pickPool = (cat) => {
    const pool = [...TEXTS.all, ...TEXTS.parent, ...TEXTS.gift];
    if (cat === 'kids') return [...TEXTS.kids, ...TEXTS.parent, ...TEXTS.gift, ...TEXTS.all.slice(0, 8)];
    if (cat === 'drift') return [...pool, ...TEXTS.drift, ...TEXTS.hobby];
    if (cat === 'crawler') return [...pool, ...TEXTS.crawler, ...TEXTS.hobby];
    if (cat === 'premium') return [...pool, ...TEXTS.premium, ...TEXTS.hobby, ...TEXTS.speed];
    if (cat === 'buggy' || cat === 'monster' || cat === 'trophy') {
      return [...pool, ...TEXTS.hobby, ...TEXTS.speed];
    }
    return [...pool, ...TEXTS.hobby];
  };

  const fill = (text, car) =>
    text
      .replaceAll('{car}', car.name)
      .replaceAll('{speed}', car.speed)
      .replaceAll('{scale}', car.scale);

  const daysAgoLabel = (days) => {
    if (days <= 1) return "hier";
    if (days < 7) return `il y a ${days} jours`;
    if (days < 14) return 'il y a 1 semaine';
    if (days < 28) return `il y a ${Math.floor(days / 7)} semaines`;
    if (days < 45) return 'il y a 1 mois';
    if (days < 80) return `il y a ${Math.floor(days / 30)} mois`;
    return 'il y a 4 mois';
  };

  const buildReviews = (handle, title, count) => {
    const car = CARS[handle] || {
      name: title.split(/[-–]/)[0].trim() || 'RC',
      speed: '50',
      scale: '1/16',
      cat: 'monster',
    };
    const random = rng(hash(handle || title));
    const pool = pickPool(car.cat).map((text) => fill(text, car));
    const unique = [...new Set(pool)];
    const extras = [
      "On a pris le pack batteries, plus personne ne râle.",
      "Reçu pile pour le weekend, on n'a pas attendu.",
      "Le suivi m'a rassuré du premier au dernier scan.",
      "Rien à régler pour commencer, on a roulé le jour même.",
      "Le SAV a levé mon dernier doute avant que je paie.",
      "Cadeau validé en moins d'une heure d'essai.",
    ];
    const texts = [];
    const used = new Set();
    let extraIndex = 0;
    const take = (base) => {
      if (texts.length >= count) return;
      let text = base;
      if (used.has(text)) {
        text = `${base} ${extras[extraIndex % extras.length]}`;
        extraIndex += 1;
      }
      if (used.has(text)) {
        text = `${base} Commandé depuis ${CITIES[Math.floor(random() * CITIES.length)]}.`;
      }
      if (used.has(text)) return;
      used.add(text);
      texts.push(text);
    };
    let passes = 0;
    while (texts.length < count && passes < 8) {
      passes += 1;
      const copy = unique.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      copy.forEach((text) => take(text));
    }

    const authors = AUTHORS.slice();
    const cities = CITIES.slice();
    return texts.map((text, index) => {
      const author = authors[Math.floor(random() * authors.length)];
      const city = cities[Math.floor(random() * cities.length)];
      const days = 2 + Math.floor(random() * 118);
      return {
        text,
        author,
        city,
        when: daysAgoLabel(days),
        key: `${handle}-${index}`,
      };
    });
  };

  const card = (review) => {
    const item = document.createElement('li');
    item.className = 'rc-reviews__card';
    item.innerHTML = `
      <div class="rc-reviews__card-top">
        <div class="rc-reviews__stars" aria-label="5 sur 5">${STAR}</div>
        <span class="rc-reviews__verified">${CHECK} Achat vérifié</span>
      </div>
      <blockquote class="rc-reviews__quote">${review.text}</blockquote>
      <p class="rc-reviews__author">${review.author} · ${review.city} · ${review.when}</p>
    `;
    return item;
  };

  const mount = (root) => {
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';

    const handle = root.dataset.handle || '';
    const title = root.dataset.title || '';
    const count = Number(root.dataset.count || COUNTS[handle] || 36);
    const list = root.querySelector('[data-rc-reviews-list]');
    const moreWrap = root.querySelector('.rc-reviews__more');
    const moreBtn = root.querySelector('[data-rc-reviews-more]');
    if (!list) return;

    const reviews = buildReviews(handle, title, count);
    let shown = 0;
    const step = 6;

    const renderMore = () => {
      const next = reviews.slice(shown, shown + step);
      next.forEach((review) => list.appendChild(card(review)));
      shown += next.length;
      if (shown >= reviews.length) {
        moreWrap.hidden = true;
        return;
      }
      moreWrap.hidden = false;
      moreBtn.textContent = `Voir plus d'avis (${reviews.length - shown} restants)`;
    };

    renderMore();
    moreBtn?.addEventListener('click', renderMore);
  };

  const boot = () => {
    document.querySelectorAll('[data-rc-reviews]').forEach(mount);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
