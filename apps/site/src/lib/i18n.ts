// ============================================================================
// i18n — dictionnaire de traductions FR / EN / AR.
// Statique, embarqué dans le bundle (pas de fetch). Pour ajouter une clé :
// ajoute-la dans les 3 langues, ou laisse en français pour fallback.
// ============================================================================

export const LOCALES = ['ar', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';
export const RTL_LOCALES: Locale[] = ['ar'];

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

export const LOCALE_FULL: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export interface Dict {
  nav: {
    home: string;
    about: string;
    services: string;
    contact: string;
    book: string;
    whatsapp: string;
    menu: string;
    bookSession: string;
  };
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    description: string;
    bullets: { tobacco: string; drugs: string; sugar: string; alcohol: string; stress: string };
    ctaServices: string;
    ctaBook: string;
    kpi: { successRate: string; medication: string };
  };
  services: {
    eyebrow: string;
    title: string;
    subtitle: string;
    smoking: { title: string; tagline: string };
    drugs: { title: string; tagline: string };
    alcohol: { title: string; tagline: string };
    sugar: { title: string; tagline: string };
    stress: { title: string; tagline: string };
    eyebrowDetail: string;
    description: string;
    ctaMore: string;
    ctaBook: string;
  };
  registered: {
    eyebrow: string;
    title: string;
    subtitle: string;
    moh: string;
    eda: string;
    inProcess: string;
  };
  visit: {
    eyebrow: string;
    title1: string;
    title2: string;
    description: string;
    hours: string;
    ctaBook: string;
    ctaContact: string;
    photoBadge: string;
  };
  method: {
    eyebrow: string;
    title: string;
    subtitle: string;
    p1: string;
    p2: string;
    linkMore: string;
    badge: string;
    pillarsEyebrow: string;
    pillarsTitle: string;
    pillar1: { title: string; description: string };
    pillar2: { title: string; description: string };
    pillar3: { title: string; description: string };
    noteTitle: string;
    noteBody: string;
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    step: string;
    step1: { title: string; description: string };
    step2: { title: string; description: string };
    step3: { title: string; description: string };
    step4: { eyebrow: string; title: string; description: string };
  };
  testimonials: {
    eyebrow: string;
    title: string;
    subtitle: string;
    verified: string;
    items: Array<{ name: string; role: string; quote: string }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ q: string; a: string }>;
  };
  finalCta: {
    pill: string;
    title1: string;
    title2: string;
    description: string;
    ctaBook: string;
    ctaPhone: string;
    address: string;
  };
  footer: {
    description: string;
    services: string;
    centre: string;
    legal: string;
    copyright: string;
  };
}

// ============================================================================
// FR (default — full)
// ============================================================================

const fr: Dict = {
  nav: {
    home: 'Accueil',
    about: 'La méthode',
    services: 'Services',
    contact: 'Contact',
    book: 'Réserver',
    whatsapp: 'WhatsApp',
    menu: 'Menu',
    bookSession: 'Réserver une séance →',
  },
  hero: {
    eyebrow: 'BRANCH CAIRO EAST CMC',
    title1: 'Arrêtez de fumer.',
    title2: 'Autrement.',
    description:
      "Une méthode non-invasive combinant l'auriculothérapie française et une technologie laser avancée pour neutraliser naturellement les envies de nicotine et le stress — sans douleur ni médicament.",
    bullets: {
      tobacco: 'Tabac',
      drugs: 'Drogues',
      sugar: 'Sucre',
      alcohol: 'Alcool',
      stress: 'Stress & anxiété',
    },
    ctaServices: 'Nos services',
    ctaBook: 'Réserver une séance',
    kpi: { successRate: 'Taux de succès', medication: 'Médicament' },
  },
  services: {
    eyebrow: 'Nos services',
    title: 'Une méthode, plusieurs libérations',
    subtitle:
      'Chaque programme RESET cible une addiction ou un déséquilibre spécifique avec un protocole personnalisé.',
    smoking: { title: 'Sevrage tabagique', tagline: 'Arrêter de fumer en une séance.' },
    drugs: { title: 'Sevrage drogues', tagline: 'Briser le cycle de la dépendance chimique.' },
    alcohol: { title: 'Sevrage alcool', tagline: 'Reprenez le contrôle naturellement.' },
    sugar: { title: 'Gestion du sucre', tagline: 'Stop aux fringales sucrées.' },
    stress: { title: 'Stress & anxiété', tagline: 'Apaisez votre système nerveux.' },
    eyebrowDetail: 'Programme RESET',
    description:
      'Programme spécialisé qui combine auriculothérapie française et laser de photobiomodulation. Non-invasif, sans médicament, généralement en une seule séance.',
    ctaMore: 'En savoir plus',
    ctaBook: 'Réserver une séance',
  },
  registered: {
    eyebrow: 'Centre agréé',
    title: 'Un centre enregistré et régulé',
    subtitle:
      "Le laser est un dispositif certifié conforme aux normes européennes (CE) pour la biostimulation, utilisé en kinésithérapie, physiothérapie, médecine du sport, acupuncture et auriculothérapie. Les séances sont conduites dans un environnement contrôlé par un praticien certifié, diplômé par une formation certifiante française.",
    moh: 'Ministry of Health',
    eda: 'EDA · Egyptian Drug Authority',
    inProcess: 'Enregistrement en cours',
  },
  visit: {
    eyebrow: 'Visitez RESET',
    title1: 'Centre RESET',
    title2: 'Branch Cairo East CMC',
    description:
      'Technologie certifiée, accompagnement expert. Nous sommes dédiés à vous offrir la percée dont vous avez besoin pour reprendre le contrôle de votre vie.',
    hours: '11h00 – 22h00 · 7 jours sur 7',
    ctaBook: 'Réserver une séance',
    ctaContact: 'Nous contacter',
    photoBadge: 'Ouvert 7/7',
  },
  method: {
    eyebrow: 'La méthode RESET',
    title: 'Un héritage scientifique français',
    subtitle:
      "Dans les années 1950, le Dr. Paul Nogier identifia une cartographie précise de correspondances neurales entre l'oreille externe et le corps. Cette découverte fonde l'auriculothérapie moderne — la base scientifique de notre approche.",
    p1: "RESET combine la précision de l'auriculothérapie française avec la photobiomodulation laser avancée. Notre approche est entièrement non-invasive, sans médicament, et non-médicale.",
    p2: "Dans les années 1950, le médecin français Dr. Paul Nogier établit la base scientifique de l'auriculothérapie moderne en cartographiant les correspondances neuronales de l'oreille externe avec le corps humain. Une méthode reconnue mondialement pour son efficacité dans la régulation comportementale.",
    linkMore: 'En apprendre plus sur la méthode',
    badge: 'Dr. Paul Nogier · 1950',
    pillarsEyebrow: 'Les 3 piliers',
    pillarsTitle: 'Comment ça marche concrètement',
    pillar1: {
      title: 'Régulation du stress',
      description:
        'Laser de photobiomodulation basse intensité pour apaiser naturellement le système nerveux.',
    },
    pillar2: {
      title: 'Stimulation auriculaire',
      description:
        'Cible précise sur les points neurologiques qui neutralisent les envies physiques.',
    },
    pillar3: {
      title: 'Accompagnement personnel',
      description:
        'Un praticien dédié vous guide pendant et après la transition comportementale.',
    },
    noteTitle:
      'Notre approche est entièrement non-invasive, sans médicament et non-médicale.',
    noteBody:
      'Aucune douleur, aucune piqûre, aucune chaleur destructrice. Le laser froid de photobiomodulation est une technologie certifiée, sûre et sans effet secondaire connu.',
  },
  process: {
    eyebrow: 'Votre séance étape par étape',
    title: 'Une heure pour changer de vie',
    subtitle:
      "Le déroulement précis d'une consultation au centre RESET. Simple, rapide, transparent.",
    step: 'Étape',
    step1: {
      title: 'Consultation initiale',
      description: 'Un échange personnalisé pour comprendre votre profil et votre motivation.',
    },
    step2: {
      title: 'Stimulation laser',
      description: 'Application précise sur les points auriculaires.',
    },
    step3: {
      title: 'Recommandations',
      description: 'Conseils simples et actionnables à suivre après votre séance.',
    },
    step4: {
      eyebrow: 'Étape 04 · Suivi long terme',
      title: 'Nous restons disponibles pour assurer votre succès durable.',
      description:
        'Un suivi régulier pour consolider les résultats et prévenir la rechute. WhatsApp, téléphone, ou nouvelle séance — comme vous préférez.',
    },
  },
  testimonials: {
    eyebrow: 'Témoignages',
    title: 'Ils ont repris le contrôle',
    subtitle: 'Des clients réels qui ont retrouvé leur liberté grâce à la méthode RESET.',
    verified: 'Vérifié',
    items: [
      {
        name: 'Sarah J.',
        role: 'Cliente — anxiété',
        quote:
          "Je suis venue chez RESET pour gérer mon anxiété. La séance de photobiomodulation était incroyablement relaxante — sans douleur et silencieuse. Elle m'a aidée à retrouver mon focus et a significativement amélioré la qualité de mon sommeil.",
      },
      {
        name: 'Ahmed M.',
        role: 'Client — sevrage tabac',
        quote:
          "J'étais sceptique au début, mais après une seule séance chez RESET, mon envie de cigarette a littéralement disparu. Même dans les bouchons stressants du Caire, je n'ai pas ressenti le besoin de fumer. 3 mois après, je n'ai jamais été mieux.",
      },
      {
        name: 'Khaled S.',
        role: 'Client — sevrage tabac',
        quote:
          "J'avais tout essayé — patchs, gommes, volonté pure — rien ne fonctionnait jusqu'à RESET. L'équipe est professionnelle et le centre top. Je suis sorti de ma séance avec le sentiment d'être un non-fumeur.",
      },
    ],
  },
  faq: {
    eyebrow: 'Une question ?',
    title: 'Foire aux questions',
    subtitle: 'Tout ce que vous devez savoir avant votre première séance.',
    items: [
      {
        q: 'Le traitement est-il douloureux ?',
        a: 'Aucunement. Notre laser de photobiomodulation est un "laser froid" — vous ne ressentirez aucune douleur, aucune chaleur, aucune piqûre. La plupart de nos clients décrivent la séance comme profondément relaxante.',
      },
      {
        q: 'Est-ce une procédure médicale ?',
        a: "Non. RESET est un centre de bien-être et d'accompagnement au sevrage. Nos services sont non-médicaux : nous ne posons pas de diagnostic, ne prescrivons pas de médicaments et n'interférons pas avec vos traitements en cours.",
      },
      {
        q: 'Les résultats sont-ils garantis ?',
        a: 'La méthode RESET a un taux de succès très élevé, mais aucune méthode de sevrage ne peut offrir 100% de garantie — la motivation personnelle reste essentielle. Nous garantissons en revanche une technologie de pointe et un accompagnement rigoureux.',
      },
      {
        q: 'Combien de séances sont nécessaires ?',
        a: 'Généralement une seule. Pour le sevrage tabagique, une séance primaire suffit dans la majorité des cas. Selon votre profil, une séance de suivi peut être planifiée pour consolider les résultats et prévenir la rechute.',
      },
      {
        q: 'Y a-t-il des effets secondaires ?',
        a: 'Aucun. La photobiomodulation laser est une technologie sûre, sans effet secondaire connu. Contrairement aux substituts nicotiniques, elle ne provoque ni nausées, ni irritations cutanées, ni troubles du sommeil.',
      },
      {
        q: 'Le laser est-il certifié ?',
        a: 'Oui. La sécurité est notre priorité absolue. Notre dispositif laser est entièrement certifié et conforme aux normes européennes et internationales en vigueur, opéré par des praticiens formés en environnement contrôlé.',
      },
    ],
  },
  finalCta: {
    pill: 'Premier RDV disponible cette semaine',
    title1: 'Votre liberté commence',
    title2: "aujourd'hui.",
    description:
      "Réservez votre première consultation en moins de 2 minutes. Sans engagement, sans médicament, sans douleur.",
    ctaBook: 'Réserver ma séance',
    ctaPhone: 'Nous joindre',
    address: '📍 CMC, Teseen, New Cairo · Le Caire · Ouvert 11h-22h tous les jours',
  },
  footer: {
    description:
      "Méthode française non-invasive combinant auriculothérapie et laser de photobiomodulation pour neutraliser naturellement les addictions et le stress.",
    services: 'Services',
    centre: 'Centre',
    legal: 'Conforme décret 188/2020 (ETA) · Loi 151/2020',
    copyright: 'RESET Yourself — Branch Cairo East CMC',
  },
};

// ============================================================================
// EN
// ============================================================================

const en: Dict = {
  nav: {
    home: 'Home',
    about: 'Our method',
    services: 'Services',
    contact: 'Contact',
    book: 'Book',
    whatsapp: 'WhatsApp',
    menu: 'Menu',
    bookSession: 'Book a session →',
  },
  hero: {
    eyebrow: 'BRANCH CAIRO EAST CMC',
    title1: 'Quit smoking.',
    title2: 'Differently.',
    description:
      'A non-invasive method combining French auriculotherapy and advanced laser technology to naturally neutralize nicotine cravings and stress — without pain or medication.',
    bullets: {
      tobacco: 'Tobacco',
      drugs: 'Drugs',
      sugar: 'Sugar',
      alcohol: 'Alcohol',
      stress: 'Stress & anxiety',
    },
    ctaServices: 'Our services',
    ctaBook: 'Book a session',
    kpi: { successRate: 'Success rate', medication: 'Medication' },
  },
  services: {
    eyebrow: 'Our services',
    title: 'One method, multiple liberations',
    subtitle:
      'Each RESET program targets a specific addiction or imbalance with a personalized protocol.',
    smoking: { title: 'Smoking cessation', tagline: 'Quit smoking in one session.' },
    drugs: { title: 'Drug cessation', tagline: 'Break the cycle of chemical dependency.' },
    alcohol: { title: 'Alcohol cessation', tagline: 'Reclaim control naturally.' },
    sugar: { title: 'Sugar management', tagline: 'Stop sugar cravings.' },
    stress: { title: 'Stress & anxiety', tagline: 'Calm your nervous system.' },
    eyebrowDetail: 'RESET program',
    description:
      'Specialized program combining French auriculotherapy and photobiomodulation laser. Non-invasive, drug-free, usually in a single session.',
    ctaMore: 'Learn more',
    ctaBook: 'Book a session',
  },
  registered: {
    eyebrow: 'Certified center',
    title: 'A registered and regulated center',
    subtitle:
      'The laser is a certified device compliant with European (CE) standards for biostimulation, used in physiotherapy, sports medicine, acupuncture and auriculotherapy. Sessions are conducted in a controlled environment by a certified practitioner trained through a recognized French program.',
    moh: 'Ministry of Health',
    eda: 'EDA · Egyptian Drug Authority',
    inProcess: 'Registration in process',
  },
  visit: {
    eyebrow: 'Visit RESET',
    title1: 'RESET Center',
    title2: 'Branch Cairo East CMC',
    description:
      'Certified technology, expert guidance. We are dedicated to providing the breakthrough you need to take back control of your life.',
    hours: '11:00 AM – 10:00 PM · 7 days a week',
    ctaBook: 'Book a session',
    ctaContact: 'Contact us',
    photoBadge: 'Open 7/7',
  },
  method: {
    eyebrow: 'The RESET method',
    title: 'A French scientific legacy',
    subtitle:
      'In the 1950s, Dr. Paul Nogier identified a precise mapping of neural correspondences between the outer ear and the body. This discovery founded modern auriculotherapy — the scientific basis of our approach.',
    p1: 'RESET combines the precision of French auriculotherapy with advanced laser photobiomodulation. Our approach is entirely non-invasive, drug-free, and non-medical.',
    p2: "In the 1950s, French physician Dr. Paul Nogier established the scientific basis of modern auriculotherapy by mapping the neural correspondences of the outer ear with the human body. A method recognized worldwide for its effectiveness in behavioral regulation.",
    linkMore: 'Learn more about the method',
    badge: 'Dr. Paul Nogier · 1950',
    pillarsEyebrow: 'The 3 pillars',
    pillarsTitle: 'How it actually works',
    pillar1: {
      title: 'Stress regulation',
      description:
        'Low-intensity photobiomodulation laser to naturally calm the nervous system.',
    },
    pillar2: {
      title: 'Auricular stimulation',
      description: 'Precise targeting of neurological points that neutralize physical cravings.',
    },
    pillar3: {
      title: 'Personal guidance',
      description:
        'A dedicated practitioner guides you during and after the behavioral transition.',
    },
    noteTitle: 'Our approach is entirely non-invasive, drug-free, and non-medical.',
    noteBody:
      'No pain, no needles, no destructive heat. The cold laser of photobiomodulation is a certified, safe technology with no known side effects.',
  },
  process: {
    eyebrow: 'Your session step by step',
    title: 'One hour to change your life',
    subtitle: 'The precise flow of a RESET consultation. Simple, fast, transparent.',
    step: 'Step',
    step1: {
      title: 'Initial consultation',
      description: 'A personalized conversation to understand your profile and motivation.',
    },
    step2: { title: 'Laser stimulation', description: 'Precise application on auricular points.' },
    step3: {
      title: 'Recommendations',
      description: 'Simple, actionable advice to follow after your session.',
    },
    step4: {
      eyebrow: 'Step 04 · Long-term follow-up',
      title: 'We remain available to ensure your lasting success.',
      description:
        'Regular follow-up to consolidate results and prevent relapse. WhatsApp, phone, or new session — as you prefer.',
    },
  },
  testimonials: {
    eyebrow: 'Testimonials',
    title: 'They took back control',
    subtitle: 'Real clients who reclaimed their freedom thanks to the RESET method.',
    verified: 'Verified',
    items: [
      {
        name: 'Sarah J.',
        role: 'Client — anxiety',
        quote:
          'I came to RESET to manage my anxiety. The photobiomodulation session was incredibly relaxing — painless and quiet. It helped me regain my focus and significantly improved my sleep quality.',
      },
      {
        name: 'Ahmed M.',
        role: 'Client — smoking cessation',
        quote:
          "I was skeptical at first, but after just one session at RESET, my craving for cigarettes literally disappeared. Even during stressful Cairo traffic, I didn't feel the need to smoke. 3 months later, I've never felt better.",
      },
      {
        name: 'Khaled S.',
        role: 'Client — smoking cessation',
        quote:
          "I had tried everything — patches, gums, willpower — nothing worked until RESET. The team is professional and the center is top-notch. I left my session feeling like a non-smoker.",
      },
    ],
  },
  faq: {
    eyebrow: 'A question?',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know before your first session.',
    items: [
      {
        q: 'Is the treatment painful?',
        a: 'Not at all. Our photobiomodulation laser is a "cold laser" — you will feel no pain, no heat, no stinging. Most of our clients describe the session as deeply relaxing.',
      },
      {
        q: 'Is this a medical procedure?',
        a: 'No. RESET is a wellness and cessation support center. Our services are non-medical: we do not provide diagnoses, prescribe medications, or interfere with ongoing treatments.',
      },
      {
        q: 'Are results guaranteed?',
        a: 'The RESET method has a very high success rate, but no cessation method can offer 100% guarantee — personal motivation remains essential. We do guarantee cutting-edge technology and rigorous follow-up.',
      },
      {
        q: 'How many sessions are needed?',
        a: 'Usually just one. For smoking cessation, one primary session is enough in most cases. Depending on your profile, a follow-up session may be planned to consolidate results and prevent relapse.',
      },
      {
        q: 'Are there any side effects?',
        a: 'None. Photobiomodulation laser is a safe technology with no known side effects. Unlike nicotine substitutes, it causes neither nausea, skin irritation, nor sleep disturbances.',
      },
      {
        q: 'Is the laser certified?',
        a: 'Yes. Safety is our top priority. Our laser device is fully certified and compliant with current European and international standards, operated by trained practitioners in a controlled environment.',
      },
    ],
  },
  finalCta: {
    pill: 'First appointment available this week',
    title1: 'Your freedom starts',
    title2: 'today.',
    description:
      'Book your first consultation in less than 2 minutes. No commitment, no medication, no pain.',
    ctaBook: 'Book my session',
    ctaPhone: 'Contact us',
    address: '📍 CMC, Teseen, New Cairo · Cairo · Open 11 AM - 10 PM every day',
  },
  footer: {
    description:
      'French non-invasive method combining auriculotherapy and photobiomodulation laser to naturally neutralize addictions and stress.',
    services: 'Services',
    centre: 'Center',
    legal: 'Compliant with Decree 188/2020 (ETA) · Law 151/2020',
    copyright: 'RESET Yourself — Branch Cairo East CMC',
  },
};

// ============================================================================
// AR (RTL)
// ============================================================================

const ar: Dict = {
  nav: {
    home: 'الرئيسية',
    about: 'منهجنا',
    services: 'الخدمات',
    contact: 'تواصل',
    book: 'احجز',
    whatsapp: 'واتساب',
    menu: 'القائمة',
    bookSession: 'احجز جلسة ←',
  },
  hero: {
    eyebrow: 'فرع شرق القاهرة CMC',
    title1: 'أقلع عن التدخين.',
    title2: 'بطريقة مختلفة.',
    description:
      'منهج غير جراحي يجمع بين العلاج بنقاط الأذن الفرنسي والتقنية الليزرية المتقدمة لتحييد الرغبة في النيكوتين والتوتر بشكل طبيعي — بلا ألم وبلا دواء.',
    bullets: {
      tobacco: 'التبغ',
      drugs: 'المخدرات',
      sugar: 'السكر',
      alcohol: 'الكحول',
      stress: 'التوتر والقلق',
    },
    ctaServices: 'خدماتنا',
    ctaBook: 'احجز جلسة',
    kpi: { successRate: 'معدل النجاح', medication: 'بلا دواء' },
  },
  services: {
    eyebrow: 'خدماتنا',
    title: 'منهج واحد، تحررات متعددة',
    subtitle: 'كل برنامج RESET يستهدف إدماناً أو اختلالاً محدداً ببروتوكول شخصي.',
    smoking: { title: 'الإقلاع عن التدخين', tagline: 'أقلع عن التدخين في جلسة واحدة.' },
    drugs: { title: 'الإقلاع عن المخدرات', tagline: 'اكسر دائرة الإدمان الكيميائي.' },
    alcohol: { title: 'الإقلاع عن الكحول', tagline: 'استرجع السيطرة طبيعياً.' },
    sugar: { title: 'التحكم في السكر', tagline: 'أوقف الرغبة الشديدة في السكر.' },
    stress: { title: 'التوتر والقلق', tagline: 'هدّئ جهازك العصبي.' },
    eyebrowDetail: 'برنامج RESET',
    description:
      'برنامج متخصص يجمع بين العلاج بالأذن الفرنسي وليزر الفوتوبيوموديوليشن. غير جراحي، بلا دواء، وعادةً في جلسة واحدة.',
    ctaMore: 'اعرف المزيد',
    ctaBook: 'احجز جلسة',
  },
  registered: {
    eyebrow: 'مركز معتمد',
    title: 'مركز مسجل ومنظم',
    subtitle:
      'الليزر جهاز معتمد متوافق مع المعايير الأوروبية (CE) للتحفيز الحيوي، مستخدم في العلاج الطبيعي والطب الرياضي والوخز بالإبر والعلاج بالأذن. الجلسات تُجرى في بيئة مراقبة من قبل ممارس معتمد، خريج تكوين فرنسي معتمد.',
    moh: 'وزارة الصحة',
    eda: 'هيئة الدواء المصرية · EDA',
    inProcess: 'قيد التسجيل',
  },
  visit: {
    eyebrow: 'زر RESET',
    title1: 'مركز RESET',
    title2: 'فرع شرق القاهرة CMC',
    description:
      'تقنية معتمدة ومرافقة خبيرة. نحن ملتزمون بتقديم الانطلاقة التي تحتاجها لاستعادة السيطرة على حياتك.',
    hours: '11:00 صباحاً – 10:00 مساءً · 7 أيام في الأسبوع',
    ctaBook: 'احجز جلسة',
    ctaContact: 'اتصل بنا',
    photoBadge: 'مفتوح 7/7',
  },
  method: {
    eyebrow: 'منهج RESET',
    title: 'إرث علمي فرنسي',
    subtitle:
      'في خمسينيات القرن الماضي، حدد د. بول نوجييه خريطة دقيقة للتطابقات العصبية بين الأذن الخارجية والجسم. هذا الاكتشاف يؤسس للعلاج بالأذن الحديث — الأساس العلمي لمنهجنا.',
    p1: 'يجمع RESET بين دقة العلاج بالأذن الفرنسي والفوتوبيوموديوليشن الليزري المتقدم. منهجنا غير جراحي تماماً، بلا دواء، وغير طبي.',
    p2: 'في الخمسينيات، أسس الطبيب الفرنسي د. بول نوجييه الأساس العلمي للعلاج بالأذن الحديث برسم خرائط التطابقات العصبية للأذن الخارجية مع جسم الإنسان. منهج معترف به عالمياً لفعاليته في التنظيم السلوكي.',
    linkMore: 'تعرف على المنهج أكثر',
    badge: 'د. بول نوجييه · 1950',
    pillarsEyebrow: 'الركائز الثلاث',
    pillarsTitle: 'كيف يعمل عملياً',
    pillar1: {
      title: 'تنظيم التوتر',
      description: 'ليزر الفوتوبيوموديوليشن منخفض الكثافة لتهدئة الجهاز العصبي طبيعياً.',
    },
    pillar2: {
      title: 'تحفيز الأذن',
      description: 'استهداف دقيق للنقاط العصبية التي تحيّد الرغبات الجسدية.',
    },
    pillar3: {
      title: 'مرافقة شخصية',
      description: 'ممارس مخصص يرشدك خلال وبعد المرحلة الانتقالية السلوكية.',
    },
    noteTitle: 'منهجنا غير جراحي تماماً، بلا دواء، وغير طبي.',
    noteBody:
      'بلا ألم، بلا إبر، بلا حرارة مدمرة. الليزر البارد للفوتوبيوموديوليشن تقنية معتمدة وآمنة بلا آثار جانبية معروفة.',
  },
  process: {
    eyebrow: 'جلستك خطوة بخطوة',
    title: 'ساعة واحدة لتغيير حياتك',
    subtitle: 'التفاصيل الدقيقة لجلسة استشارة في مركز RESET. بسيط، سريع، شفاف.',
    step: 'خطوة',
    step1: {
      title: 'الاستشارة الأولية',
      description: 'محادثة شخصية لفهم ملفك ودوافعك.',
    },
    step2: { title: 'تحفيز ليزري', description: 'تطبيق دقيق على نقاط الأذن.' },
    step3: {
      title: 'التوصيات',
      description: 'نصائح بسيطة وعملية لتتبعها بعد جلستك.',
    },
    step4: {
      eyebrow: 'الخطوة 04 · متابعة طويلة الأمد',
      title: 'نبقى متاحين لضمان نجاحك المستدام.',
      description:
        'متابعة منتظمة لتوطيد النتائج ومنع الانتكاسة. واتساب، هاتف، أو جلسة جديدة — كما تفضل.',
    },
  },
  testimonials: {
    eyebrow: 'شهادات',
    title: 'استعادوا السيطرة',
    subtitle: 'عملاء حقيقيون استرجعوا حريتهم بفضل منهج RESET.',
    verified: 'موثق',
    items: [
      {
        name: 'سارة ج.',
        role: 'عميلة — القلق',
        quote:
          'جئت إلى RESET لإدارة قلقي. جلسة الفوتوبيوموديوليشن كانت مريحة بشكل لا يصدق — بلا ألم وهادئة. ساعدتني في استعادة تركيزي وحسّنت جودة نومي بشكل كبير.',
      },
      {
        name: 'أحمد م.',
        role: 'عميل — الإقلاع عن التدخين',
        quote:
          'كنت متشككاً في البداية، لكن بعد جلسة واحدة فقط في RESET، اختفت رغبتي في السجائر حرفياً. حتى في زحام القاهرة المرهق، لم أشعر بالحاجة للتدخين. بعد 3 أشهر، لم أشعر بأفضل من ذلك أبداً.',
      },
      {
        name: 'خالد س.',
        role: 'عميل — الإقلاع عن التدخين',
        quote:
          'جربت كل شيء — اللاصقات، العلكة، الإرادة الخالصة — لم ينجح شيء حتى RESET. الفريق محترف والمركز ممتاز. خرجت من جلستي وأنا أشعر كغير مدخن.',
      },
    ],
  },
  faq: {
    eyebrow: 'سؤال؟',
    title: 'الأسئلة المتكررة',
    subtitle: 'كل ما تحتاج معرفته قبل جلستك الأولى.',
    items: [
      {
        q: 'هل العلاج مؤلم؟',
        a: 'إطلاقاً. ليزر الفوتوبيوموديوليشن "ليزر بارد" — لن تشعر بأي ألم أو حرارة أو وخز. معظم عملائنا يصفون الجلسة بأنها مريحة للغاية.',
      },
      {
        q: 'هل هو إجراء طبي؟',
        a: 'لا. RESET مركز للرفاهية ودعم الإقلاع. خدماتنا غير طبية: لا نشخّص ولا نصف أدوية ولا نتدخل في علاجاتك الحالية.',
      },
      {
        q: 'هل النتائج مضمونة؟',
        a: 'لمنهج RESET معدل نجاح عالٍ جداً، لكن لا يمكن لأي طريقة إقلاع أن تقدم ضماناً 100% — الدافع الشخصي يبقى أساسياً. نضمن في المقابل تقنية متطورة ومتابعة دقيقة.',
      },
      {
        q: 'كم جلسة مطلوبة؟',
        a: 'عادةً جلسة واحدة. للإقلاع عن التدخين، جلسة أولية واحدة تكفي في معظم الحالات. حسب ملفك، قد تُخطط جلسة متابعة لتوطيد النتائج ومنع الانتكاسة.',
      },
      {
        q: 'هل توجد آثار جانبية؟',
        a: 'لا توجد. ليزر الفوتوبيوموديوليشن تقنية آمنة بلا آثار جانبية معروفة. على عكس بدائل النيكوتين، لا يسبب غثياناً ولا تهيج جلدي ولا اضطرابات نوم.',
      },
      {
        q: 'هل الليزر معتمد؟',
        a: 'نعم. السلامة أولويتنا القصوى. جهاز الليزر معتمد بالكامل ومتوافق مع المعايير الأوروبية والدولية الحالية، يديره ممارسون مدربون في بيئة مراقبة.',
      },
    ],
  },
  finalCta: {
    pill: 'موعد أول متاح هذا الأسبوع',
    title1: 'حريتك تبدأ',
    title2: 'اليوم.',
    description: 'احجز استشارتك الأولى في أقل من دقيقتين. بلا التزام، بلا دواء، بلا ألم.',
    ctaBook: 'احجز جلستي',
    ctaPhone: 'تواصل معنا',
    address: '📍 CMC، شارع التسعين، القاهرة الجديدة · القاهرة · مفتوح 11ص - 10م يومياً',
  },
  footer: {
    description:
      'منهج فرنسي غير جراحي يجمع بين العلاج بالأذن وليزر الفوتوبيوموديوليشن لتحييد الإدمان والتوتر طبيعياً.',
    services: 'الخدمات',
    centre: 'المركز',
    legal: 'متوافق مع المرسوم 188/2020 (ETA) · القانون 151/2020',
    copyright: 'RESET Yourself — فرع شرق القاهرة CMC',
  },
};

const DICTIONARIES: Record<Locale, Dict> = { fr, en, ar };

export function getDict(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Construit une URL prefixée par locale. La locale par défaut (FR) n'est
 * pas préfixée pour préserver les URLs propres (/ → /, /about → /about),
 * EN et AR sont préfixés (/en/about, /ar/about).
 */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}`;
  return `/${locale}${clean}`;
}
