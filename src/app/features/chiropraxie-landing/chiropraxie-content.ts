/** Contenu et arborescence clonés depuis https://www.chiropraxie-guinee.fr/ */

export interface ChiropraxieNavItem {
  label: string;
  path: string;
}

export type ChiropraxieBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'hours' }
  | { kind: 'partners' }
  | { kind: 'external'; label: string; url: string }
  | { kind: 'map' };

export interface ChiropraxiePageDef {
  slug: string;
  eyebrow?: string;
  title: string;
  bannerImage?: string;
  subtitle?: string;
  contentImage?: string;
  blocks: ChiropraxieBlock[];
  videos?: { youtubeId: string; title: string; caption?: string }[];
}

export const CHIROPRAXIE_SITE = {
  practitioner: {
    fullName: 'Kadiatou Nabé',
    title: 'Chiropracteur à domicile et sur lieu de travail à Conakry',
    phone: '+224 661 67 77 08',
    phoneTel: '+224661677708',
    address: 'COLEAH Guinée Motel Ocean Dark',
    addressLines: ['COLEAH', 'Guinée', 'Motel Ocean Dark'],
    city: 'Conakry',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Coleah+Motel+Ocean+Dark+Conakry+Guinée',
    logoImage:
      'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210307/183678/400/91c9490086ffc18dd8ee20170227-2328987-1ts5cf9.png',
    portraitImage:
      'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210309/183689/1200/a49c0461b49fe6eaad3420170227-2328987-1v9l8o4.jpeg',
    pageBackground:
      'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210317/183709/1200/d325387edd0f9161908920170227-2328987-1ynuzed.jpeg',
  },
  hoursSummary: {
    weekdays: 'Du Lundi au Vendredi de 8h à 17h',
    saturday: 'Le Samedi de 8h à 12h',
    weekdaysHtml: 'Du <strong>Lundi</strong> au <strong>Vendredi</strong> de <strong>8h</strong> à <strong>17h</strong>',
    saturdayHtml: 'Le <strong>Samedi</strong> de <strong>8h</strong> à <strong>12h</strong>',
  },
  hours: [
    { day: 'Lundi', hours: '8h - 17h' },
    { day: 'Mardi', hours: '8h - 17h' },
    { day: 'Mercredi', hours: '8h - 17h' },
    { day: 'Jeudi', hours: '8h - 17h' },
    { day: 'Vendredi', hours: '8h - 17h' },
    { day: 'Samedi', hours: '8h - 12h' },
    { day: 'Dimanche', hours: 'Fermé' },
  ],
  menuChiropraxie: [
    { label: 'Présentation', path: 'presentation-de-la-chiropraxie' },
    { label: 'Patients', path: 'patients-de-la-chiropraxie' },
    { label: 'Prévention', path: 'chiropraxie-et-prevention' },
    { label: 'Symptômes traités', path: 'symptomes-traite-par-la-chiropraxie' },
  ] as ChiropraxieNavItem[],
  menuPractitioner: {
    label: 'Le chiropracteur',
    path: 'kadiatou-nabe-chiropracteur-conakry',
  },
  menuInfos: [
    { label: 'Le cabinet', path: 'le-cabinet-chiropratique-conakry' },
    { label: 'La consultation', path: 'la-consultation-de-chiropraxie-thiais-94320' },
    { label: 'Remboursements', path: 'mutuelles-et-remboursement-des-seances-de-chiropraxie' },
    { label: 'Liens utiles', path: 'liens-utiles-chiropraxie' },
  ] as ChiropraxieNavItem[],
  menuTestimonials: {
    label: 'Témoignages',
    path: 'temoignages-kadiatou-nabe-chiropracteur-conakry',
  },
  menuContact: {
    label: 'Contact',
    path: 'prendre-rendez-vous-chiropracteur-thiais',
  },
  exploreCards: [
    {
      title: 'La chiropraxie',
      path: 'presentation-de-la-chiropraxie',
      image:
        'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210310/183693/1200/bb89354b3f476ffdf6dd20170227-2328987-iiwjpe.jpeg',
    },
    {
      title: 'Patients',
      path: 'patients-de-la-chiropraxie',
      image:
        'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210313/183700/1200/682770a3765cd0e6f65c20170227-2328987-1nidfqy.jpeg',
    },
    {
      title: 'Symptômes',
      path: 'symptomes-traite-par-la-chiropraxie',
      image:
        'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210316/183706/1200/561dce2d9e585dd7711e20170227-2328987-8o2d8a.jpeg',
    },
  ],
  aboutBackground:
    'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210310/183693/1200/bb89354b3f476ffdf6dd20170227-2328987-iiwjpe.jpeg',
  partners: [
    { label: 'Association française de Chiropraxie', url: 'https://www.chiropraxie.com/', image: 'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210306/183679/400/80ea2295195509e6853d20170227-2328987-18s9oj2.jpeg' },
    { label: 'Institut Franco-Européen de Chiropraxie (IFEC)', url: 'https://www.ifec.net/', image: 'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210306/183680/400/f9e91d7d041ac84695cf20170227-2328987-77v8qh.jpeg' },
    { label: 'Redressez-vous', url: 'http://www.redressez-vous.fr/accueil.html', image: 'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1488210306/183681/800/383db6bcd1de80744ba120170227-2328987-1f90b8o.png' },
  ],
  footerPlanLinks: [
    { label: 'Accueil', path: '' },
    { label: 'Le chiropracteur', path: 'kadiatou-nabe-chiropracteur-conakry' },
    { label: 'Le cabinet', path: 'le-cabinet-chiropratique-conakry' },
    { label: 'Témoignages', path: 'temoignages-kadiatou-nabe-chiropracteur-conakry' },
    { label: 'Contact', path: 'prendre-rendez-vous-chiropracteur-thiais' },
  ] as ChiropraxieNavItem[],
  footerChiroLinks: [
    { label: 'Présentation', path: 'presentation-de-la-chiropraxie' },
    { label: 'Patients', path: 'patients-de-la-chiropraxie' },
    { label: 'Prévention', path: 'chiropraxie-et-prevention' },
    { label: 'Symptômes traités', path: 'symptomes-traite-par-la-chiropraxie' },
  ] as ChiropraxieNavItem[],
  sitemapLinks: [
    { label: 'Accueil', path: '' },
    { label: 'Présentation de la chiropraxie', path: 'presentation-de-la-chiropraxie' },
    { label: 'Les patients de la chiropraxie', path: 'patients-de-la-chiropraxie' },
    { label: 'Chiropraxie et prévention', path: 'chiropraxie-et-prevention' },
    { label: 'Les symptômes traités par la chiropraxie', path: 'symptomes-traite-par-la-chiropraxie' },
    { label: 'Kadiatou Nabé, votre chiropracteur à Conakry', path: 'kadiatou-nabe-chiropracteur-conakry' },
    { label: 'Le cabinet chiropratique à Conakry', path: 'le-cabinet-chiropratique-conakry' },
    { label: 'La consultation de chiropraxie', path: 'la-consultation-de-chiropraxie-thiais-94320' },
    { label: 'Mutuelles et remboursement', path: 'mutuelles-et-remboursement-des-seances-de-chiropraxie' },
    { label: 'Liens utiles', path: 'liens-utiles-chiropraxie' },
    { label: 'Témoignages', path: 'temoignages-kadiatou-nabe-chiropracteur-conakry' },
    { label: 'Prendre rendez-vous / Contact', path: 'prendre-rendez-vous-chiropracteur-thiais' },
    { label: 'Mentions légales', path: 'mentions-legales' },
    { label: 'Plan du site', path: 'plan-du-site' },
  ] as ChiropraxieNavItem[],
  practicalInfo: [
    'Consultations le samedi (selon disponibilité)',
    'Uniquement sur rendez-vous',
    'Consultations à domicile',
  ],
} as const;

/** Contenu spécifique à la page d'accueil */
export const CHIROPRAXIE_HOME = {
  pageTitle: 'Kadiatou Nabé, chiropracteur à Conakry',
  introLead: 'Kadiatou Nabe est chiropracteur diplômée.',
  introParagraphs: [
    'Elle est heureuse de recevoir dans son cabinet enfants, sportifs, personnes âgées, personnes sédentaires, musiciens ou encore femmes enceintes.',
    "Elle traite et soigne mal de dos, douleurs dorsales, hernies discales non chirurgicales, névralgies d'Arnold, douleurs aux articulations périphériques...",
    "La chiropraxie, autrement appelée activité chiropratique ou chiropractie, est la profession manuelle de santé la plus exercée dans le monde.",
  ],
  about: {
    heading: 'Kadiatou Nabe, votre chiropracteur à Conakry',
    intro: 'Située à Conakry, Kadiatou Nabe est un chiropracteur de confiance :',
    morePath: 'kadiatou-nabe-chiropracteur-conakry',
  },
  credentials: [
    "Diplôme de l'Institut Franco-Européen de Chiropraxie (IFEC), suite à 6 années d'étude (Etablissement de formation agréé par le ministère de la santé)",
    "Membre de l'AFC (Association française de chiropratique)",
    'Institut Franco-Européen de Chiropraxie',
    'Redressez-vous !',
  ],
  cabinetTeaser: {
    title: 'Votre cabinet chiropratique à Conakry',
    morePath: 'le-cabinet-chiropratique-conakry',
  },
  footerBio:
    'Chiropracteur diplômée, Kadiatou Nabe accueille femmes enceintes, enfants, personnes sédentaires, musiciens ou adultes dans son cabinet à Conakry.',
} as const;

export const CHIROPRAXIE_STATIC_PAGES: Record<string, { title: string; eyebrow?: string; bannerImage?: string }> = {
  'prendre-rendez-vous-chiropracteur-thiais': {
    title: 'Contacter votre chiropracteur',
    eyebrow: 'CONTACT CHIROPRACTEUR CONAKRY',
  },
  'mentions-legales': { title: 'Mentions légales' },
  'plan-du-site': { title: 'Plan du site' },
};

export const CHIROPRAXIE_PAGE_TITLES: Record<string, string> = Object.fromEntries(
  [
    ...Object.entries(CHIROPRAXIE_STATIC_PAGES).map(([slug, meta]) => [slug, meta.title]),
  ],
);

export const CHIROPRAXIE_PAGES: Record<string, ChiropraxiePageDef> = {
  'presentation-de-la-chiropraxie': {
    slug: 'presentation-de-la-chiropraxie',
    eyebrow: 'PRÉSENTATION DE LA CHIROPRAXIE',
    title: 'Présentation de la chiropraxie',
    bannerImage:
      'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1510589408/370785/1200/66d2545e5719e75e025420171113-547746-5ozxcp.jpeg',
    subtitle: "Qu'est ce que la chiropraxie ?",
    contentImage:
      'https://files.sbcdnsb.com/images/mb6vzpsfe2nu/content/1510589408/370786/400/8bebb57ae3d29dc2d92120171113-547703-jpbxrm.png',
    blocks: [
      { kind: 'p', text: 'La chiropraxie est une médecine manuelle de référence pour les soins du dos et des articulations.' },
      { kind: 'p', text: "Notre quotidien (sport, accidents, stress, conditions de travail, mauvaises habitudes, manque d'exercice etc.) est source de tensions qui ont pour conséquences des dysfonctionnements ou des douleurs." },
      { kind: 'p', text: "L'objectif de la chiropraxie n'est pas de se substituer au traitement médical mais d'offrir une alternative à la chirurgie et aux médicaments, chaque fois que le diagnostic posé rend cette thérapie possible. La chiropraxie s'inscrit également, avec une efficacité démontrée et reconnue, dans la prévention de certaines pathologies telles que le mal de dos et l'arthrose." },
      { kind: 'p', text: "C'est une médecine manuelle reconnue par le Code de la Santé Publique qui réserve le titre de Chiropracteur aux professionnels justifiant d'un diplôme agréé par le Ministère de la Santé." },
    ],
    videos: [
      {
        youtubeId: 'SeYb1Kklqu0',
        title: 'La chiropraxie en vidéos',
        caption: 'Alexis Nogier - Chirurgien',
      },
    ],
  },
  'patients-de-la-chiropraxie': {
    slug: 'patients-de-la-chiropraxie',
    eyebrow: 'LES PATIENTS DE LA CHIROPRAXIE',
    title: 'Les patients de la chiropraxie',
    blocks: [
      { kind: 'p', text: "La chiropraxie est indiquée pour tous, sans distinction d'âge. Cependant, certaines périodes de la vie, certains métiers ou certains sports sont plus propices à une « sur-utilisation » des articulations, muscles ou tendons comme à l'adoption de gestes et postures inadaptés." },
      { kind: 'h3', text: 'Les adultes et professionnels' },
      { kind: 'p', text: "Les soins chiropratiques aident à retrouver l'équilibre dont le corps a besoin pour mieux s'adapter aux situations stressantes de tous les jours. Il en résulte un meilleur sommeil, une plus grande concentration, une diminution de la nervosité." },
      { kind: 'h3', text: 'Les sportifs' },
      { kind: 'p', text: "La pratique d'un sport, amateur ou de haut niveau, peut engendrer des sollicitations musculaires et articulaires importantes. La répétition de gestes techniques durant les entraînements ou les compétitions peut amener le corps jusqu'à ses limites physiques et mécaniques." },
      { kind: 'h3', text: 'Les femmes enceintes' },
      { kind: 'p', text: "Le traitement chiropratique agit sur l'alignement du bassin et sur la mobilité articulaire, favorisant ainsi le bien être de la femme enceinte et une meilleure position du fœtus dans l'utérus." },
      { kind: 'h3', text: 'Les nouveaux nés' },
      { kind: 'p', text: "Par un travail de pressions très douces et précises, le chiropracteur est capable de détecter et corriger ces lésions dès le premier âge." },
      { kind: 'h3', text: 'Les enfants' },
      { kind: 'p', text: "Le suivi chiropratique pendant la croissance de l'enfant est particulièrement recommandé." },
      { kind: 'h3', text: 'Les adolescents' },
      { kind: 'p', text: "Les soins chiropratiques aideront l'adolescent à ne pas se laisser submerger par un état de fatigue physique et émotionnelle influant sur sa concentration, son activité intellectuelle et donc sur sa réussite scolaire." },
      { kind: 'h3', text: 'Les seniors' },
      { kind: 'p', text: "Avec l'âge, les os se fragilisent, les articulations perdent de leur souplesse, les muscles fondent. Il est essentiel de conserver un bon état de santé." },
    ],
  },
  'chiropraxie-et-prevention': {
    slug: 'chiropraxie-et-prevention',
    eyebrow: 'CHIROPRAXIE ET PRÉVENTION',
    title: 'Chiropraxie et prévention',
    blocks: [
      { kind: 'h3', text: 'La prévention pour tous' },
      { kind: 'p', text: "En plus d'être thérapeutiques et naturels, les soins chiropratiques sont préventifs. Ils permettent d'entretenir le bon fonctionnement du système nerveux, chose primordiale pour maintenir une santé optimale. La capacité de résistance et d'adaptation de votre corps aux stress quotidiens professionnels et familiaux sera augmentée. Le tout grâce à des ajustements réguliers (3-4 séances par an) et à des conseils concernant votre posture et votre hygiène de vie !" },
      { kind: 'p', text: 'Ces ajustements, sont des gestes doux, précis et non douloureux. Ils ont pour objectifs de :' },
      { kind: 'ul', items: ['libérer les tensions', 'stimuler le système nerveux', 'rétablir un équilibre optimal', 'redonner aux articulations leur mobilité'] },
    ],
  },
  'symptomes-traite-par-la-chiropraxie': {
    slug: 'symptomes-traite-par-la-chiropraxie',
    eyebrow: 'LES SYMPTÔMES ET DOULEURS TRAITÉS PAR LA CHIROPRAXIE',
    title: 'Les symptômes traités par la chiropraxie',
    blocks: [
      { kind: 'p', text: 'Que ce soit de la prévention, du maintien en forme, de la rééducation, ou du traitement de douleur, le chiropracteur vous proposera les ajustements adéquats.' },
      { kind: 'h3', text: 'Douleurs articulaires au niveau des extrémités' },
      { kind: 'ul', items: ['Epaule : tendinite épaule (supra épineux, long biceps), épaule gelée', 'Coude : épicondyllite, épitrochléite, perte de force dans les mains', 'Poignet : syndrome canal carpien, luxation du lunate', 'Hanche : tendinite fessier, coxarthrose', "Genou : gonalgie, syndrome de l'essuie glace, entorse du genou, tendinite de la patte d'oie", "Cheville : entorse, tendinite du talon d'achille, boiterie", 'Stress, fatigue, arthrose, fibromyalgie'] },
      { kind: 'h3', text: 'Les douleurs vertébrales - Mal de dos' },
      { kind: 'ul', items: ['Cervicalgies (torticolis, entorses cervicales, coup du lapin, etc.)', 'Dorsalgies (douleurs entre les omoplates, névralgies intercostales, etc.)', 'Lombalgies (lumbagos, entorses lombaires, etc.)', 'Arthrose, scolioses, hernies discales, sciatalgies, sciatiques, cruralgies, névralgies cervico brachiales, etc'] },
      { kind: 'h3', text: 'Psychologie - Douleurs globales' },
      { kind: 'p', text: "La chiropraxie agit aussi sur certaines pathologies liées au stress comme l'anxiété, les troubles du sommeil, l'eczéma. Elle est efficace contre certaines formes de migraines, de maux de tête, les céphalées de tension." },
      { kind: 'p', text: "C'est là que la chiropraxie prend tout son sens." },
    ],
  },
  'kadiatou-nabe-chiropracteur-conakry': {
    slug: 'kadiatou-nabe-chiropracteur-conakry',
    eyebrow: 'KADIATOU NABE VOUS ACCUEILLE DANS SON CABINET CHIROPRATIQUE À CONAKRY',
    title: 'Kadiatou Nabé, votre chiropracteur à Conakry',
    blocks: [
      { kind: 'p', text: 'Kadiatou Nabé est chiropracteur reconnue :' },
      { kind: 'ul', items: ["Diplôme de l'Institut Franco-Européen de Chiropraxie (IFEC), suite à 6 années d'étude (Établissement de formation agréé par le ministère de la santé)", "Membre de l'AFC (Association française de chiropratique)"] },
      { kind: 'p', text: 'Le chiropracteur protège et répare votre dos et articulations tout au long de votre vie :' },
      { kind: 'ul', items: ['Scolioses', 'Cyphoses', 'Douleurs aux hanches', 'Lombalgie', 'Douleurs dans les épaules', 'Tendinites', 'Hyperlordoses', 'Mal aux genoux', 'Épaule gelée', 'Cruralgies', 'Douleurs aux articulations périphériques', 'Entorse', 'Douleurs dorsales', 'Dorsalgie', 'Mal de dos', 'Douleurs aux pieds', 'Stress', 'Fibromyalgie', 'Mal de tête chronique'] },
    ],
  },
  'le-cabinet-chiropratique-conakry': {
    slug: 'le-cabinet-chiropratique-conakry',
    eyebrow: 'KADIATOU NABE VOUS REÇOIT DANS SON CABINET DE CHIROPRAXIE À CONAKRY',
    title: 'Le cabinet chiropratique à Conakry',
    blocks: [
      { kind: 'h3', text: 'Informations pratiques' },
      { kind: 'ul', items: ['Consultations à domicile', 'Uniquement sur rendez-vous', 'Consultations le samedi (selon disponibilité)'] },
      { kind: 'h3', text: 'Accéder au cabinet' },
      { kind: 'p', text: 'COLEAH Guinée Motel Ocean Dark — Conakry' },
      { kind: 'map' },
      { kind: 'h3', text: 'Horaires du cabinet' },
      { kind: 'hours' },
    ],
  },
  'la-consultation-de-chiropraxie-thiais-94320': {
    slug: 'la-consultation-de-chiropraxie-thiais-94320',
    eyebrow: 'DÉCOUVREZ COMMENT SE DÉROULE UNE CONSULTATION AVEC VOTRE CHIROPRACTEUR KADIATOU NABE',
    title: 'La consultation de chiropraxie avec Kadiatou Nabé',
    blocks: [
      { kind: 'h3', text: 'Le déroulement des consultations' },
      { kind: 'p', text: 'Une consultation chiropratique se déroule en quatre étapes : Détecter, Corriger, Stabiliser et Prévenir.' },
      { kind: 'h3', text: '1) Anamnèse et détection - Première séance' },
      { kind: 'p', text: "Le thérapeute interroge son patient sur sa pathologie, son mode de vie, les traumatismes depuis l'enfance, ses conditions de vie et de travail. Il procède ensuite à un examen chiropratique complet." },
      { kind: 'h3', text: '2) Correction et soulagement - Les premières semaines' },
      { kind: 'p', text: "L'étape du soulagement consiste à soulager le plus rapidement possible les maux pour lesquels le patient est venu consulter." },
      { kind: 'h3', text: '3) Correction et stabilisation - Les mois suivants' },
      { kind: 'p', text: 'Le temps de stabilisation a pour but de stabiliser la colonne vertébrale et ramener le système nerveux à un fonctionnement normal.' },
      { kind: 'h3', text: '4) Prévention - Toute la vie' },
      { kind: 'p', text: "Cette phase est l'étape durant laquelle le patient va conserver le mieux-être acquis au cours des étapes précédentes." },
      { kind: 'h3', text: 'Honoraires et moyens de paiement' },
      { kind: 'p', text: 'Kadiatou Nabé accepte les chèques et espèces.' },
      { kind: 'h3', text: 'Horaires du cabinet' },
      { kind: 'hours' },
    ],
  },
  'mutuelles-et-remboursement-des-seances-de-chiropraxie': {
    slug: 'mutuelles-et-remboursement-des-seances-de-chiropraxie',
    eyebrow: 'DE PLUS EN PLUS DE MUTUELLES REMBOURSENT LES CONSULTATIONS AVEC UN CHIROPRACTEUR',
    title: 'Mutuelles et remboursement des consultations de chiropraxie',
    blocks: [
      { kind: 'p', text: "Les consultations chiropratiques ne sont pas encore remboursées par l'assurance maladie." },
      { kind: 'p', text: "Par contre les contrats de complémentaires santé couvrant les consultations chiropratiques sont fréquents. Il peut s'agir d'un montant global par an, ou d'un montant par séance." },
      { kind: 'p', text: "Pour plus d'informations, consultez le site de l'Association Française de Chiropraxie sur lequel la liste des mutuelles concernées est régulièrement mise à jour." },
      { kind: 'external', label: 'Association française de Chiropraxie', url: 'https://www.chiropraxie.fr/' },
      { kind: 'p', text: 'Demandez une attestation à votre thérapeute en chiropraxie.' },
      { kind: 'h3', text: 'Horaires du cabinet' },
      { kind: 'hours' },
    ],
  },
  'liens-utiles-chiropraxie': {
    slug: 'liens-utiles-chiropraxie',
    eyebrow: "LA CHIROPRAXIE EST CONSTITUÉE D'UN ÉCOSYSTÈME DENSE ET SOLIDAIRE",
    title: 'Liens utiles relatifs à la chiropraxie',
    blocks: [
      { kind: 'partners' },
      { kind: 'h3', text: 'Horaires du cabinet' },
      { kind: 'hours' },
    ],
  },
  'temoignages-kadiatou-nabe-chiropracteur-conakry': {
    slug: 'temoignages-kadiatou-nabe-chiropracteur-conakry',
    eyebrow: 'TOUS LES AVIS DE PATIENTS SUR KADIATOU NABE',
    title: 'Témoignages sur Kadiatou Nabé, chiropracteur à Conakry',
    blocks: [
      { kind: 'h3', text: 'Partagez vos impressions' },
      { kind: 'p', text: 'Les témoignages patients sont recueillis via la plateforme d\'origine du site. Contactez le cabinet pour partager votre expérience.' },
      { kind: 'p', text: '0 avis publiés pour le moment.' },
    ],
  },
};

export const CHIROPRAXIE_PAGE_SLUGS = Object.keys(CHIROPRAXIE_PAGES);
