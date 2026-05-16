// ============================================================================
// page-content.ts — Contenu i18n des pages About et Contact (FR / EN / AR).
//
// AR : Modern Standard Arabic, registre médical/bien-être. À faire relire
//      par un locuteur natif avant publication grand public.
// ============================================================================

import type { Locale } from './i18n';

export interface AboutContent {
  metaTitle: string;
  metaDescription: string;
  hero: {
    badge: string;
    title1: string;
    title2: string;
    description: string;
  };
  kpis: {
    successRate: string;
    livesReshaped: string;
    excellence: string;
  };
  story: {
    eyebrow: string;
    title: string;
    paragraph1: { lead: string; emphasis1: string; emphasis2: string; tail: string };
    paragraph2: { lead: string; emphasis1: string; emphasis2: string; tail: string };
    paragraph3: { lead: string; emphasis: string; tail: string };
    badgeCertified: string;
    badgeNonInvasive: string;
  };
  pillars: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ title: string; description: string }>;
  };
  cta: {
    titleLead: string;
    titleEmphasis: string;
    titleTail: string;
    description: string;
    button: string;
  };
}

export interface ContactContent {
  metaTitle: string;
  metaDescription: string;
  hero: {
    badge: string;
    title: string;
    description: string;
  };
  cards: {
    whatsapp: { title: string; cta: string };
    phone: { title: string; cta: string };
    email: { title: string; cta: string };
  };
  center: {
    eyebrow: string;
    title: string;
    addressLine1: string;
    addressLine2: string;
    description: string;
    mapsLink: string;
  };
  hours: {
    eyebrow: string;
    title: string;
    monThu: string;
    fri: string;
    satSun: string;
    flexibleBadge: string;
  };
  social: {
    eyebrow: string;
    title: string;
    description: string;
    button: string;
  };
  cta: {
    title: string;
    description: string;
    button: string;
  };
}

// ============================================================================
// FRANÇAIS
// ============================================================================
const aboutFr: AboutContent = {
  metaTitle: 'La méthode RESET — Auriculothérapie + laser, un héritage scientifique français',
  metaDescription:
    "RESET combine l'auriculothérapie française du Dr Paul Nogier (années 1950) avec la photobiomodulation laser moderne. Méthode non-invasive, non-médicale et sans médicament.",
  hero: {
    badge: 'Bienvenue chez RESET',
    title1: 'Un héritage scientifique',
    title2: 'né en France.',
    description:
      "Nous proposons une régulation neuronale avancée pour libérer nos clients à travers le monde. Le meilleur moment pour RESET, c'est avant le point de rupture.",
  },
  kpis: {
    successRate: 'Taux de succès',
    livesReshaped: 'Vies remises',
    excellence: 'Excellence',
  },
  story: {
    eyebrow: 'Notre histoire',
    title: 'La méthode RESET — un héritage scientifique',
    paragraph1: {
      lead: 'RESET est un programme spécialisé qui combine la précision de l\'',
      emphasis1: 'auriculothérapie française',
      emphasis2: 'photobiomodulation laser',
      tail:
        " avancée. Notre approche est entièrement non-invasive, sans médicament, et non-médicale — focalisée sur la régulation neuronale naturelle.",
    },
    paragraph2: {
      lead: 'Dans les ',
      emphasis1: 'années 1950',
      emphasis2: 'Dr Paul Nogier',
      tail:
        " identifia une cartographie précise de correspondances neuronales entre l'oreille externe et le corps humain. Cette recherche pionnière a établi la base de l'auriculothérapie moderne, méthode aujourd'hui reconnue mondialement pour son efficacité dans la régulation comportementale.",
    },
    paragraph3: {
      lead: "Aujourd'hui, le centre ",
      emphasis: 'RESET Branch Cairo East CMC',
      tail:
        ' applique cette méthode au Caire avec un laser de photobiomodulation certifié et un accompagnement humain personnalisé.',
    },
    badgeCertified: 'Méthode certifiée',
    badgeNonInvasive: '100 % non-invasif',
  },
  pillars: {
    eyebrow: 'Les 3 piliers de votre succès',
    title: 'Comment ça marche concrètement',
    subtitle: "Trois composants qui agissent ensemble pour rétablir l'équilibre neuronal.",
    items: [
      {
        title: 'Régulation du stress',
        description:
          "La technologie laser basse intensité (photobiomodulation) calme naturellement le système nerveux en stimulant la production d'endorphines et la régulation du cortisol.",
      },
      {
        title: 'Stimulation auriculaire',
        description:
          "Cible précise sur les points neuronaux de l'oreille externe pour neutraliser les envies physiques de nicotine, sucre, alcool ou drogues.",
      },
      {
        title: 'Accompagnement personnel',
        description:
          'Un praticien dédié vous guide pendant et après la transition comportementale, avec un suivi disponible sur le long terme.',
      },
    ],
  },
  cta: {
    titleLead: 'Prêt(e) à ',
    titleEmphasis: 'commencer',
    titleTail: ' ?',
    description: "Choisissez votre service, votre créneau, c'est tout.",
    button: 'Réserver ma séance',
  },
};

const contactFr: ContactContent = {
  metaTitle: 'Contact — RESET Le Caire',
  metaDescription:
    'Centre RESET — Branch Cairo East CMC. CMC, Teseen, New Cairo, Le Caire, Égypte. Ouvert 11h-22h tous les jours. Réservation en ligne ou par WhatsApp.',
  hero: {
    badge: 'Nous joindre',
    title: 'On vous écoute.',
    description:
      'WhatsApp, téléphone, ou visite directe au centre — choisissez le canal qui vous convient.',
  },
  cards: {
    whatsapp: { title: 'WhatsApp', cta: 'Démarrer une conversation' },
    phone: { title: 'Téléphone', cta: 'Appeler maintenant' },
    email: { title: 'Email', cta: 'Envoyer un message' },
  },
  center: {
    eyebrow: 'Le centre',
    title: 'Visitez RESET',
    addressLine1: 'CMC, Teseen, New Cairo',
    addressLine2: 'Le Caire, Égypte',
    description:
      "Technologie certifiée, accompagnement expert. Nous sommes dédiés à vous offrir la percée dont vous avez besoin pour reprendre le contrôle de votre vie.",
    mapsLink: 'Itinéraire Google Maps',
  },
  hours: {
    eyebrow: 'Horaires',
    title: 'Ouvert 7 jours sur 7',
    monThu: 'Lundi – Jeudi',
    fri: 'Vendredi',
    satSun: 'Samedi – Dimanche',
    flexibleBadge: 'Réservation flexible 24/7 en ligne',
  },
  social: {
    eyebrow: 'Sur Instagram',
    title: '@reset_eg',
    description: 'Suivez RESET sur Instagram pour les nouvelles, témoignages et conseils.',
    button: 'Suivre @reset_eg',
  },
  cta: {
    title: 'Réservez votre séance',
    description: "En moins de 2 minutes. Choisissez votre service, votre créneau, c'est tout.",
    button: 'Réserver maintenant',
  },
};

// ============================================================================
// ENGLISH
// ============================================================================
const aboutEn: AboutContent = {
  metaTitle: 'The RESET method — Auriculotherapy + laser, a French scientific heritage',
  metaDescription:
    'RESET combines French auriculotherapy from Dr Paul Nogier (1950s) with modern photobiomodulation laser. A non-invasive, non-medical, medication-free method.',
  hero: {
    badge: 'Welcome to RESET',
    title1: 'A scientific heritage',
    title2: 'born in France.',
    description:
      'We deliver advanced neural regulation to free our clients around the world. The best moment for RESET is before the breaking point.',
  },
  kpis: {
    successRate: 'Success rate',
    livesReshaped: 'Lives reshaped',
    excellence: 'Excellence',
  },
  story: {
    eyebrow: 'Our story',
    title: 'The RESET method — a scientific heritage',
    paragraph1: {
      lead: 'RESET is a specialized program that combines the precision of ',
      emphasis1: 'French auriculotherapy',
      emphasis2: 'advanced photobiomodulation laser',
      tail:
        '. Our approach is entirely non-invasive, medication-free and non-medical — focused on natural neural regulation.',
    },
    paragraph2: {
      lead: 'In the ',
      emphasis1: '1950s',
      emphasis2: 'Dr Paul Nogier',
      tail:
        ' identified a precise mapping of neural correspondences between the outer ear and the human body. This pioneering research established the foundation of modern auriculotherapy, a method now recognized worldwide for its effectiveness in behavioural regulation.',
    },
    paragraph3: {
      lead: 'Today, the ',
      emphasis: 'RESET Branch Cairo East CMC',
      tail:
        ' centre applies this method in Cairo with a certified photobiomodulation laser and personalized human support.',
    },
    badgeCertified: 'Certified method',
    badgeNonInvasive: '100% non-invasive',
  },
  pillars: {
    eyebrow: 'The 3 pillars of your success',
    title: 'How it actually works',
    subtitle: 'Three components acting together to restore neural balance.',
    items: [
      {
        title: 'Stress regulation',
        description:
          'Low-intensity laser technology (photobiomodulation) naturally calms the nervous system by stimulating endorphin production and cortisol regulation.',
      },
      {
        title: 'Auricular stimulation',
        description:
          'Precise targeting of the neural points on the outer ear to neutralize physical cravings for nicotine, sugar, alcohol or drugs.',
      },
      {
        title: 'Personal support',
        description:
          'A dedicated practitioner guides you during and after the behavioural transition, with long-term follow-up available.',
      },
    ],
  },
  cta: {
    titleLead: 'Ready to ',
    titleEmphasis: 'begin',
    titleTail: '?',
    description: "Choose your service, choose your slot, that's all.",
    button: 'Book my session',
  },
};

const contactEn: ContactContent = {
  metaTitle: 'Contact — RESET Cairo',
  metaDescription:
    'RESET Centre — Branch Cairo East CMC. CMC, Teseen, New Cairo, Cairo, Egypt. Open 11am-10pm every day. Book online or via WhatsApp.',
  hero: {
    badge: 'Get in touch',
    title: 'We are listening.',
    description: 'WhatsApp, phone, or visit the centre — pick the channel that suits you.',
  },
  cards: {
    whatsapp: { title: 'WhatsApp', cta: 'Start a conversation' },
    phone: { title: 'Phone', cta: 'Call now' },
    email: { title: 'Email', cta: 'Send a message' },
  },
  center: {
    eyebrow: 'The centre',
    title: 'Visit RESET',
    addressLine1: 'CMC, Teseen, New Cairo',
    addressLine2: 'Cairo, Egypt',
    description:
      'Certified technology, expert support. We are dedicated to giving you the breakthrough you need to take back control of your life.',
    mapsLink: 'Open in Google Maps',
  },
  hours: {
    eyebrow: 'Opening hours',
    title: 'Open 7 days a week',
    monThu: 'Monday – Thursday',
    fri: 'Friday',
    satSun: 'Saturday – Sunday',
    flexibleBadge: 'Flexible 24/7 online booking',
  },
  social: {
    eyebrow: 'On Instagram',
    title: '@reset_eg',
    description: 'Follow RESET on Instagram for news, testimonials and tips.',
    button: 'Follow @reset_eg',
  },
  cta: {
    title: 'Book your session',
    description: "In less than 2 minutes. Choose your service, choose your slot, that's all.",
    button: 'Book now',
  },
};

// ============================================================================
// العربية
// ============================================================================
const aboutAr: AboutContent = {
  metaTitle: 'منهج RESET — العلاج بالأذن مع الليزر، إرث علمي فرنسي',
  metaDescription:
    'يجمع RESET بين العلاج الأذني الفرنسي للدكتور بول نوجييه (خمسينيات القرن العشرين) وليزر التحفيز الضوئي الحديث. منهج غير جراحي وغير دوائي وبلا أدوية.',
  hero: {
    badge: 'أهلًا بك في RESET',
    title1: 'إرث علمي',
    title2: 'وُلد في فرنسا.',
    description:
      'نقدّم تنظيمًا عصبيًا متقدّمًا لتحرير عملائنا حول العالم. أفضل وقت لـ RESET هو قبل أن تبلغ نقطة الانهيار.',
  },
  kpis: {
    successRate: 'نسبة النجاح',
    livesReshaped: 'حيوات تغيّرت',
    excellence: 'تميّز',
  },
  story: {
    eyebrow: 'قصّتنا',
    title: 'منهج RESET — إرث علمي',
    paragraph1: {
      lead: 'RESET برنامج متخصّص يجمع بين دقّة ',
      emphasis1: 'العلاج الأذني الفرنسي',
      emphasis2: 'ليزر التحفيز الضوئي',
      tail: ' المتقدّم. مقاربتنا غير جراحية تمامًا وبلا أدوية وغير طبّية — تركّز على التنظيم العصبي الطبيعي.',
    },
    paragraph2: {
      lead: 'في ',
      emphasis1: 'خمسينيات القرن العشرين',
      emphasis2: 'الدكتور بول نوجييه',
      tail:
        ' خريطة دقيقة من التقابلات العصبية بين الأذن الخارجية وجسم الإنسان. أرسى هذا البحث الرائد أساس العلاج الأذني الحديث، وهو منهج معترف به اليوم عالميًا لفاعليته في تنظيم السلوك.',
    },
    paragraph3: {
      lead: 'يطبّق مركز ',
      emphasis: 'RESET فرع القاهرة الجديدة CMC',
      tail: ' اليوم هذا المنهج في القاهرة بليزر تحفيز ضوئي معتمد ومرافقة بشرية شخصية.',
    },
    badgeCertified: 'منهج معتمَد',
    badgeNonInvasive: 'غير جراحي 100٪',
  },
  pillars: {
    eyebrow: 'الأركان الثلاثة لنجاحك',
    title: 'كيف يعمل الأمر عمليًا',
    subtitle: 'ثلاثة مكوّنات تعمل معًا لاستعادة التوازن العصبي.',
    items: [
      {
        title: 'تنظيم التوتّر',
        description:
          'تقنية الليزر منخفض الكثافة (التحفيز الضوئي) تُهدّئ الجهاز العصبي طبيعيًا عبر تحفيز إنتاج الإندورفينات وتنظيم الكورتيزول.',
      },
      {
        title: 'تحفيز أذني',
        description:
          'استهداف دقيق للنقاط العصبية في الأذن الخارجية لتحييد الرغبة الجسدية في النيكوتين أو السكّر أو الكحول أو المخدّرات.',
      },
      {
        title: 'مرافقة شخصية',
        description:
          'ممارس مخصّص يرافقك أثناء وبعد التحوّل السلوكي مع متابعة متاحة على المدى الطويل.',
      },
    ],
  },
  cta: {
    titleLead: 'مستعدّ لـ',
    titleEmphasis: 'البدء',
    titleTail: '؟',
    description: 'اختر خدمتك وموعدك، هذا كل ما عليك.',
    button: 'احجز جلستي',
  },
};

const contactAr: ContactContent = {
  metaTitle: 'تواصل — RESET القاهرة',
  metaDescription:
    'مركز RESET — فرع القاهرة الجديدة CMC. CMC، التسعين، القاهرة الجديدة، القاهرة، مصر. مفتوح يوميًا من 11 صباحًا حتى 10 مساءً. احجز عبر الإنترنت أو واتساب.',
  hero: {
    badge: 'تواصل معنا',
    title: 'نحن نسمعك.',
    description: 'واتساب أو هاتف أو زيارة مباشرة للمركز — اختر القناة التي تناسبك.',
  },
  cards: {
    whatsapp: { title: 'واتساب', cta: 'ابدأ محادثة' },
    phone: { title: 'الهاتف', cta: 'اتصل الآن' },
    email: { title: 'البريد', cta: 'أرسل رسالة' },
  },
  center: {
    eyebrow: 'المركز',
    title: 'زر RESET',
    addressLine1: 'CMC، التسعين، القاهرة الجديدة',
    addressLine2: 'القاهرة، مصر',
    description:
      'تقنية معتمَدة ومرافقة خبيرة. نحن مكرّسون لمنحك الانطلاقة التي تحتاجها لاستعادة زمام حياتك.',
    mapsLink: 'افتح في خرائط جوجل',
  },
  hours: {
    eyebrow: 'مواعيد العمل',
    title: 'مفتوح طوال الأسبوع',
    monThu: 'الإثنين – الخميس',
    fri: 'الجمعة',
    satSun: 'السبت – الأحد',
    flexibleBadge: 'حجز إلكتروني مرن 24/7',
  },
  social: {
    eyebrow: 'على إنستغرام',
    title: '@reset_eg',
    description: 'تابع RESET على إنستغرام للأخبار والشهادات والنصائح.',
    button: 'تابع @reset_eg',
  },
  cta: {
    title: 'احجز جلستك',
    description: 'في أقل من دقيقتين. اختر خدمتك وموعدك، هذا كل ما عليك.',
    button: 'احجز الآن',
  },
};

// ============================================================================
// Export
// ============================================================================
const ABOUT: Record<Locale, AboutContent> = { fr: aboutFr, en: aboutEn, ar: aboutAr };
const CONTACT: Record<Locale, ContactContent> = { fr: contactFr, en: contactEn, ar: contactAr };

export function getAboutContent(locale: Locale): AboutContent {
  return ABOUT[locale] ?? aboutFr;
}

export function getContactContent(locale: Locale): ContactContent {
  return CONTACT[locale] ?? contactFr;
}
