// ============================================================================
// services-content.ts — Contenu i18n des 5 pages services (FR / EN / AR).
//
// Centralise tout le texte affiché par <ServicePage>. Les pages
// /services/{smoking,drugs,alcohol,sugar,stress} importent depuis ici et
// passent le bon objet selon la locale courante.
//
// AR : Modern Standard Arabic, registre médical/bien-être. À faire relire
//      par un locuteur natif avant publication grand public.
// ============================================================================

import type { Locale } from './i18n';

export interface ServiceContent {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  tagline: string;
  intro: string;
  benefits: Array<{ title: string; description: string }>;
  process: string[];
  cta: string;
}

type ServiceKey = 'smoking' | 'drugs' | 'alcohol' | 'sugar' | 'stress';
type ServicesDict = Record<ServiceKey, ServiceContent>;

// ============================================================================
// FRANÇAIS
// ============================================================================
const fr: ServicesDict = {
  smoking: {
    metaTitle: 'Sevrage tabagique — Arrêter de fumer en une séance',
    metaDescription:
      'Méthode RESET : auriculothérapie + laser de photobiomodulation pour arrêter de fumer en une séance, sans patchs, sans gommes, sans médicament. Centre RESET Le Caire.',
    eyebrow: 'Sevrage tabagique',
    title: 'Arrêtez de fumer en une séance.',
    tagline: 'Oubliez les patchs et les gommes.',
    intro:
      "Notre technologie de photobiomodulation cible la dépendance à sa source pour neutraliser les symptômes de manque instantanément. Une séance suffit dans la grande majorité des cas — sans douleur, sans médicament, sans effet secondaire.",
    benefits: [
      {
        title: 'Neutralisation des envies physiques',
        description:
          'Le laser stimule des points neuronaux précis qui annulent la sensation de manque physique. Vous sortez de la séance comme un non-fumeur.',
      },
      {
        title: 'Réduction du stress lié au sevrage',
        description:
          "La photobiomodulation calme le système nerveux, évitant l'irritabilité et l'anxiété typiques de l'arrêt du tabac.",
      },
      {
        title: 'Une seule séance dans 80 % des cas',
        description:
          'Pour la majorité de nos clients, une séance primaire suffit. Une consolidation peut être planifiée selon votre profil.',
      },
      {
        title: 'Aucun substitut nicotinique',
        description:
          'Pas de patchs, pas de gommes, pas de cigarettes électroniques. Une méthode 100 % naturelle et non-invasive.',
      },
    ],
    process: [
      'Consultation initiale pour comprendre votre profil de fumeur et votre motivation (15 minutes).',
      "Application précise du laser sur les points auriculaires liés à l'addiction à la nicotine (20 à 30 minutes).",
      'Recommandations personnalisées pour les premières heures et premiers jours sans tabac.',
      'Suivi long terme par notre équipe pour consolider votre nouvelle vie de non-fumeur.',
    ],
    cta: "Devenez non-fumeur dès aujourd'hui.",
  },

  drugs: {
    metaTitle: 'Sevrage drogues — Accompagnement non-médical au sevrage',
    metaDescription:
      "Programme RESET pour le sevrage des drogues : approche non-médicale, non-invasive, basée sur le laser de photobiomodulation et l'auriculothérapie.",
    eyebrow: 'Sevrage drogues',
    title: 'Reprenez votre vie en main.',
    tagline: 'Briser le cycle de la dépendance chimique.',
    intro:
      'Notre thérapie laser privée et non-invasive aide à réduire la douleur physique du sevrage et à stabiliser votre système nerveux pendant la récupération. Démarrez votre chemin vers un futur clean dans un environnement sûr et sans jugement.',
    benefits: [
      {
        title: 'Réduction des symptômes de sevrage',
        description:
          "Le laser stimule la libération d'endorphines naturelles qui atténuent les douleurs physiques et l'inconfort liés à l'arrêt.",
      },
      {
        title: 'Stabilisation du système nerveux',
        description:
          "La photobiomodulation aide à réguler l'humeur, l'anxiété et les troubles du sommeil pendant la phase critique de récupération.",
      },
      {
        title: 'Environnement confidentiel',
        description:
          'Vos séances se déroulent en privé, dans un centre sans jugement, avec un praticien dédié à votre parcours.',
      },
      {
        title: 'Soutien long terme',
        description:
          'Un suivi régulier pour prévenir la rechute et consolider votre nouvelle vie clean.',
      },
    ],
    process: [
      'Consultation initiale confidentielle pour évaluer votre situation et vos objectifs.',
      "Application du laser sur les points auriculaires liés à l'addiction et à la régulation émotionnelle.",
      'Conseils pratiques pour gérer les 72 premières heures post-séance.',
      'Suivi régulier pour consolider votre nouvelle trajectoire.',
    ],
    cta: 'Démarrez votre nouvelle vie.',
  },

  alcohol: {
    metaTitle: 'Sevrage alcool — Reprendre le contrôle naturellement',
    metaDescription:
      'Méthode RESET pour le sevrage alcoolique : laser de photobiomodulation pour neutraliser les envies physiques et stabiliser le système nerveux. Non-médical, non-invasif.',
    eyebrow: 'Sevrage alcool',
    title: "Libérez-vous de l'alcool.",
    tagline: 'Reprenez votre vie et votre santé.',
    intro:
      "Notre protocole laser spécialisé aide à neutraliser les envies physiques et les symptômes de sevrage, vous donnant la clarté mentale nécessaire pour maintenir une sobriété durable. Démarrez votre voyage vers un futur plus net dès aujourd'hui.",
    benefits: [
      {
        title: 'Neutralisation des envies physiques',
        description:
          "Le laser cible les points neuronaux qui régulent l'envie d'alcool, réduisant significativement l'appel compulsif.",
      },
      {
        title: 'Clarté mentale retrouvée',
        description:
          'En stabilisant le système nerveux, vous regagnez la concentration et la maîtrise de soi nécessaires à un changement durable.',
      },
      {
        title: 'Régulation émotionnelle',
        description:
          "La photobiomodulation aide à atténuer le stress, l'anxiété et la dépression souvent associés à l'arrêt.",
      },
      {
        title: 'Sobriété long terme',
        description:
          'Un suivi personnalisé pour vous accompagner dans la consolidation de votre nouvelle hygiène de vie.',
      },
    ],
    process: [
      'Consultation initiale pour évaluer votre consommation et vos motivations (confidentielle).',
      'Application du laser sur les points auriculaires de la dépendance et de la régulation émotionnelle.',
      'Recommandations comportementales pour les premières semaines.',
      'Suivi régulier pour prévenir la rechute et consolider vos acquis.',
    ],
    cta: 'Démarrez votre voyage vers la sobriété.',
  },

  sugar: {
    metaTitle: 'Gestion du sucre — Stop aux fringales naturellement',
    metaDescription:
      "Méthode RESET pour la gestion des fringales sucrées : laser de photobiomodulation pour neutraliser les centres d'addiction au sucre et faciliter la perte de poids.",
    eyebrow: 'Gestion du sucre',
    title: 'Brisez le cycle du sucre.',
    tagline: 'Stop aux fringales, stabilisez votre énergie.',
    intro:
      "Notre thérapie laser cible les centres d'addiction de votre cerveau pour neutraliser le « besoin » de sucre. Elle vous aide à gérer votre poids et à prévenir le diabète sans la lutte de la seule volonté.",
    benefits: [
      {
        title: 'Neutralisation des fringales',
        description:
          "Le laser cible les zones cérébrales liées à l'envie de sucre, réduisant les pulsions compulsives qui sabotent vos efforts.",
      },
      {
        title: "Stabilisation de l'énergie",
        description:
          'Fini les pics et chutes de glycémie. Vous retrouvez une énergie stable tout au long de la journée.',
      },
      {
        title: 'Perte de poids naturelle',
        description:
          'En neutralisant les envies, vous réduisez naturellement votre apport calorique sans frustration ni régime strict.',
      },
      {
        title: 'Prévention du diabète',
        description:
          "Réduire l'addiction au sucre est l'un des leviers les plus puissants pour prévenir le diabète de type 2.",
      },
    ],
    process: [
      'Consultation initiale pour comprendre vos habitudes alimentaires et objectifs.',
      "Application du laser sur les points auriculaires liés à la régulation de l'appétit.",
      "Conseils nutritionnels simples pour soutenir votre nouvelle relation à l'alimentation.",
      'Suivi pour ajuster et maintenir vos progrès dans le temps.',
    ],
    cta: 'Reprenez le contrôle de votre alimentation.',
  },

  stress: {
    metaTitle: 'Stress & anxiété — Régulation neuronale naturelle',
    metaDescription:
      "Méthode RESET pour la gestion du stress et de l'anxiété : laser de photobiomodulation qui régule cortisol et endorphines pour un sommeil et un calme profonds.",
    eyebrow: 'Stress & anxiété',
    title: 'Apaisez votre système nerveux.',
    tagline: 'Calmez le bruit du quotidien.',
    intro:
      "Notre régulation neuronale non-invasive abaisse naturellement le cortisol et stimule les endorphines, vous aidant à gérer l'anxiété et à améliorer la qualité du sommeil sans médicaments.",
    benefits: [
      {
        title: 'Réduction du cortisol',
        description:
          "Le laser stimule la production naturelle d'endorphines, qui contrebalance l'hormone du stress et apaise le corps.",
      },
      {
        title: 'Sommeil profond',
        description:
          "Régulation du système nerveux pour s'endormir plus vite, dormir plus profondément et se réveiller reposé(e).",
      },
      {
        title: 'Concentration retrouvée',
        description:
          'Sans la charge mentale constante du stress, vous regagnez la clarté nécessaire pour vous concentrer et performer.',
      },
      {
        title: 'Sans médicament',
        description:
          'Aucun anxiolytique, aucun somnifère. Une approche 100 % naturelle qui complète parfaitement vos autres pratiques (sport, méditation, etc.).',
      },
    ],
    process: [
      'Consultation initiale pour identifier les sources de stress et vos objectifs personnels.',
      'Application du laser sur les points auriculaires de la régulation parasympathique.',
      'Conseils de respiration et de routine pour entretenir le bénéfice de la séance.',
      'Séances de consolidation possibles pour les profils très tendus.',
    ],
    cta: 'Retrouvez votre calme intérieur.',
  },
};

// ============================================================================
// ENGLISH
// ============================================================================
const en: ServicesDict = {
  smoking: {
    metaTitle: 'Quit Smoking — Stop in a single session',
    metaDescription:
      'RESET method: auriculotherapy + photobiomodulation laser to quit smoking in a single session. No patches, no gum, no medication. RESET Centre Cairo.',
    eyebrow: 'Smoking cessation',
    title: 'Quit smoking in a single session.',
    tagline: 'Forget the patches and the gum.',
    intro:
      'Our photobiomodulation technology targets the addiction at its source to neutralize withdrawal symptoms instantly. A single session is enough in the vast majority of cases — no pain, no medication, no side effects.',
    benefits: [
      {
        title: 'Neutralizes physical cravings',
        description:
          'The laser stimulates precise neural points that cancel the physical craving. You leave the session as a non-smoker.',
      },
      {
        title: 'Reduces withdrawal stress',
        description:
          'Photobiomodulation calms the nervous system, preventing the irritability and anxiety that typically come with quitting.',
      },
      {
        title: 'One session works for 80% of clients',
        description:
          'For most of our clients, a single primary session is enough. A follow-up consolidation can be scheduled based on your profile.',
      },
      {
        title: 'No nicotine substitutes',
        description:
          'No patches, no gum, no e-cigarettes. A 100% natural and non-invasive method.',
      },
    ],
    process: [
      'Initial consultation to understand your smoking profile and motivation (15 minutes).',
      'Precise laser application on the auricular points linked to nicotine addiction (20 to 30 minutes).',
      'Personalized recommendations for the first hours and days without tobacco.',
      'Long-term follow-up by our team to consolidate your new smoke-free life.',
    ],
    cta: 'Become a non-smoker today.',
  },

  drugs: {
    metaTitle: 'Drug withdrawal — Non-medical recovery support',
    metaDescription:
      'RESET program for drug withdrawal: a non-medical, non-invasive approach based on photobiomodulation laser and auriculotherapy.',
    eyebrow: 'Drug withdrawal',
    title: 'Take back control of your life.',
    tagline: 'Break the cycle of chemical dependency.',
    intro:
      'Our private, non-invasive laser therapy helps reduce the physical pain of withdrawal and stabilize your nervous system during recovery. Begin your journey toward a clean future in a safe, judgment-free environment.',
    benefits: [
      {
        title: 'Reduces withdrawal symptoms',
        description:
          'The laser stimulates the release of natural endorphins that ease the physical pain and discomfort of quitting.',
      },
      {
        title: 'Stabilizes the nervous system',
        description:
          'Photobiomodulation helps regulate mood, anxiety and sleep disturbances during the critical recovery phase.',
      },
      {
        title: 'Confidential environment',
        description:
          'Your sessions take place in private, in a judgment-free centre, with a dedicated practitioner committed to your journey.',
      },
      {
        title: 'Long-term support',
        description:
          'Regular follow-ups to prevent relapse and consolidate your new clean life.',
      },
    ],
    process: [
      'Confidential initial consultation to assess your situation and goals.',
      'Laser application on the auricular points linked to addiction and emotional regulation.',
      'Practical guidance to manage the first 72 hours after the session.',
      'Regular follow-up to consolidate your new path.',
    ],
    cta: 'Start your new life.',
  },

  alcohol: {
    metaTitle: 'Alcohol withdrawal — Regain control naturally',
    metaDescription:
      'RESET method for alcohol withdrawal: photobiomodulation laser to neutralize physical cravings and stabilize the nervous system. Non-medical, non-invasive.',
    eyebrow: 'Alcohol withdrawal',
    title: 'Free yourself from alcohol.',
    tagline: 'Reclaim your life and your health.',
    intro:
      'Our specialized laser protocol helps neutralize physical cravings and withdrawal symptoms, giving you the mental clarity needed to maintain lasting sobriety. Begin your journey toward a clearer future today.',
    benefits: [
      {
        title: 'Neutralizes physical cravings',
        description:
          'The laser targets the neural points that regulate the urge for alcohol, significantly reducing the compulsive pull.',
      },
      {
        title: 'Restores mental clarity',
        description:
          'By stabilizing the nervous system, you regain the focus and self-mastery needed for lasting change.',
      },
      {
        title: 'Emotional regulation',
        description:
          'Photobiomodulation helps ease the stress, anxiety and depression often associated with quitting.',
      },
      {
        title: 'Long-term sobriety',
        description:
          'Personalized follow-up to support you as you consolidate your new way of living.',
      },
    ],
    process: [
      'Initial consultation to assess your consumption and motivations (confidential).',
      'Laser application on the auricular points of dependency and emotional regulation.',
      'Behavioural recommendations for the first weeks.',
      'Regular follow-up to prevent relapse and consolidate your progress.',
    ],
    cta: 'Begin your journey to sobriety.',
  },

  sugar: {
    metaTitle: 'Sugar management — Stop cravings naturally',
    metaDescription:
      'RESET method to manage sugar cravings: photobiomodulation laser to neutralize the brain centres of sugar addiction and support weight loss.',
    eyebrow: 'Sugar management',
    title: 'Break the sugar cycle.',
    tagline: 'Stop cravings, stabilize your energy.',
    intro:
      "Our laser therapy targets the addiction centres of your brain to neutralize the 'need' for sugar. It helps you manage your weight and prevent diabetes without relying on willpower alone.",
    benefits: [
      {
        title: 'Neutralizes cravings',
        description:
          'The laser targets the brain areas linked to sugar urges, reducing the compulsive impulses that sabotage your efforts.',
      },
      {
        title: 'Stable energy',
        description:
          'No more blood-sugar spikes and crashes. You regain a steady level of energy throughout the day.',
      },
      {
        title: 'Natural weight loss',
        description:
          'By neutralizing cravings, you naturally reduce your calorie intake without frustration or strict dieting.',
      },
      {
        title: 'Diabetes prevention',
        description:
          'Reducing sugar addiction is one of the most powerful levers for preventing type 2 diabetes.',
      },
    ],
    process: [
      'Initial consultation to understand your eating habits and goals.',
      'Laser application on the auricular points linked to appetite regulation.',
      'Simple nutritional guidance to support your new relationship with food.',
      'Follow-up to adjust and maintain your progress over time.',
    ],
    cta: 'Take back control of your eating.',
  },

  stress: {
    metaTitle: 'Stress & anxiety — Natural neural regulation',
    metaDescription:
      'RESET method for managing stress and anxiety: photobiomodulation laser that regulates cortisol and endorphins for deep calm and quality sleep.',
    eyebrow: 'Stress & anxiety',
    title: 'Soothe your nervous system.',
    tagline: 'Quiet the noise of daily life.',
    intro:
      'Our non-invasive neural regulation naturally lowers cortisol and stimulates endorphins, helping you manage anxiety and improve sleep quality without medication.',
    benefits: [
      {
        title: 'Lowers cortisol',
        description:
          'The laser stimulates the natural production of endorphins, which counterbalance the stress hormone and soothe the body.',
      },
      {
        title: 'Deep sleep',
        description:
          'Nervous-system regulation to fall asleep faster, sleep more deeply, and wake up rested.',
      },
      {
        title: 'Renewed focus',
        description:
          'Without the constant mental load of stress, you regain the clarity needed to concentrate and perform.',
      },
      {
        title: 'No medication',
        description:
          'No anxiolytics, no sleeping pills. A 100% natural approach that perfectly complements your other practices (sport, meditation, etc.).',
      },
    ],
    process: [
      'Initial consultation to identify your sources of stress and personal goals.',
      'Laser application on the auricular points of parasympathetic regulation.',
      'Breathing and routine advice to maintain the benefits of the session.',
      'Consolidation sessions available for highly stressed profiles.',
    ],
    cta: 'Reconnect with your inner calm.',
  },
};

// ============================================================================
// العربية (Arabic — MSA, registre médical/bien-être)
// ⚠️ À faire relire par un locuteur natif avant publication grand public.
// ============================================================================
const ar: ServicesDict = {
  smoking: {
    metaTitle: 'الإقلاع عن التدخين — توقّف في جلسة واحدة',
    metaDescription:
      'منهج RESET: العلاج بالأذن مع ليزر التحفيز الضوئي للإقلاع عن التدخين في جلسة واحدة. بدون لاصقات أو علكات أو أدوية. مركز RESET بالقاهرة.',
    eyebrow: 'الإقلاع عن التدخين',
    title: 'أقلع عن التدخين في جلسة واحدة.',
    tagline: 'انسَ اللاصقات والعلكة.',
    intro:
      'تقنيتنا في التحفيز الضوئي تستهدف الإدمان من جذوره وتُخفّف أعراض الانسحاب فورًا. في غالبية الحالات تكفي جلسة واحدة — بلا ألم ولا دواء ولا آثار جانبية.',
    benefits: [
      {
        title: 'تحييد الرغبة الجسدية',
        description:
          'يحفّز الليزر نقاطًا عصبية دقيقة تُلغي الشعور بالحاجة الجسدية للنيكوتين. تخرج من الجلسة وأنت غير مدخّن.',
      },
      {
        title: 'تخفيف توتر الإقلاع',
        description:
          'يهدّئ التحفيز الضوئي الجهاز العصبي ويمنع الانفعال والقلق المعتاد عند ترك التدخين.',
      },
      {
        title: 'جلسة واحدة تكفي 80٪ من الحالات',
        description:
          'لمعظم العملاء تكفي جلسة أولية واحدة. ويمكن جدولة جلسة تثبيت لاحقة حسب الحالة.',
      },
      {
        title: 'بدون بدائل نيكوتين',
        description:
          'لا لاصقات ولا علكات ولا سجائر إلكترونية. منهج طبيعي 100٪ وغير جراحي.',
      },
    ],
    process: [
      'استشارة أولية لفهم نمط التدخين ومستوى الدافعية (15 دقيقة).',
      'تطبيق دقيق لليزر على النقاط الأذنية المرتبطة بإدمان النيكوتين (20 إلى 30 دقيقة).',
      'إرشادات مخصّصة للساعات والأيام الأولى بعد الإقلاع.',
      'متابعة طويلة الأمد من فريقنا لتثبيت حياتك الجديدة بلا تدخين.',
    ],
    cta: 'كن غير مدخّن منذ اليوم.',
  },

  drugs: {
    metaTitle: 'التعافي من المخدّرات — مرافقة غير دوائية',
    metaDescription:
      'برنامج RESET للتعافي من المخدّرات: مقاربة غير دوائية وغير جراحية تعتمد على ليزر التحفيز الضوئي والعلاج بالأذن.',
    eyebrow: 'التعافي من المخدّرات',
    title: 'استعِد زمام حياتك.',
    tagline: 'اكسر دائرة الإدمان الكيميائي.',
    intro:
      'علاجنا الليزري الخاص وغير الجراحي يساعد على تخفيف الألم الجسدي لمرحلة الانسحاب وعلى استقرار الجهاز العصبي خلال التعافي. ابدأ مسارك نحو مستقبل نظيف في بيئة آمنة بلا حكم مسبق.',
    benefits: [
      {
        title: 'تقليل أعراض الانسحاب',
        description:
          'يحفّز الليزر إفراز الإندورفينات الطبيعية التي تُلطّف الألم الجسدي والإحساس بالضيق المرافق للإقلاع.',
      },
      {
        title: 'استقرار الجهاز العصبي',
        description:
          'يساعد التحفيز الضوئي على تنظيم المزاج والقلق واضطرابات النوم خلال المرحلة الحرجة من التعافي.',
      },
      {
        title: 'بيئة سرّية',
        description:
          'تجري الجلسات في إطار خاص داخل مركز بلا حكم مسبق، مع ممارس مكرَّس لمسارك.',
      },
      {
        title: 'دعم طويل الأمد',
        description:
          'متابعة منتظمة للوقاية من الانتكاسة وتثبيت حياتك الجديدة النظيفة.',
      },
    ],
    process: [
      'استشارة أولية سرّية لتقييم وضعك وأهدافك.',
      'تطبيق الليزر على النقاط الأذنية المرتبطة بالإدمان وضبط الانفعال.',
      'إرشادات عملية لتجاوز الـ72 ساعة الأولى بعد الجلسة.',
      'متابعة منتظمة لتثبيت مسارك الجديد.',
    ],
    cta: 'ابدأ حياتك الجديدة.',
  },

  alcohol: {
    metaTitle: 'الإقلاع عن الكحول — استعِد التحكّم طبيعيًا',
    metaDescription:
      'منهج RESET للإقلاع عن الكحول: ليزر التحفيز الضوئي لتحييد الرغبة الجسدية وتثبيت الجهاز العصبي. غير دوائي وغير جراحي.',
    eyebrow: 'الإقلاع عن الكحول',
    title: 'تحرّر من الكحول.',
    tagline: 'استعِد حياتك وصحّتك.',
    intro:
      'بروتوكولنا الليزري المتخصّص يساعد على تحييد الرغبة الجسدية وأعراض الانسحاب، ويمنحك الصفاء الذهني اللازم للحفاظ على استدامة الإقلاع. ابدأ رحلتك نحو مستقبل أوضح اليوم.',
    benefits: [
      {
        title: 'تحييد الرغبة الجسدية',
        description:
          'يستهدف الليزر النقاط العصبية التي تنظّم الرغبة في الكحول ويُخفّض الاندفاع القسري تخفيضًا ملحوظًا.',
      },
      {
        title: 'استعادة الصفاء الذهني',
        description:
          'باستقرار الجهاز العصبي تستعيد التركيز وضبط النفس اللازمَين لتغيير مستدام.',
      },
      {
        title: 'تنظيم الانفعال',
        description:
          'يساعد التحفيز الضوئي على تلطيف التوتر والقلق والاكتئاب التي ترافق الإقلاع غالبًا.',
      },
      {
        title: 'الاستدامة طويلة الأمد',
        description:
          'متابعة شخصية لمرافقتك في تثبيت نمط حياتك الجديد.',
      },
    ],
    process: [
      'استشارة أولية لتقييم استهلاكك ودوافعك (سرّية).',
      'تطبيق الليزر على النقاط الأذنية للإدمان وضبط الانفعال.',
      'توصيات سلوكية للأسابيع الأولى.',
      'متابعة منتظمة لمنع الانتكاسة وتثبيت ما حقّقته.',
    ],
    cta: 'ابدأ رحلتك نحو الإقلاع.',
  },

  sugar: {
    metaTitle: 'إدارة السكّر — أوقف الاشتهاء طبيعيًا',
    metaDescription:
      'منهج RESET لإدارة الاشتهاء للسكّريات: ليزر التحفيز الضوئي لتحييد مراكز إدمان السكّر في الدماغ وتيسير إنقاص الوزن.',
    eyebrow: 'إدارة السكّر',
    title: 'اكسر دائرة السكّر.',
    tagline: 'أوقف الاشتهاء واستقرّ في طاقتك.',
    intro:
      'علاجنا الليزري يستهدف مراكز الإدمان في دماغك لتحييد «الحاجة» إلى السكّر. يساعدك على ضبط وزنك والوقاية من السكّري دون صراع الإرادة وحدها.',
    benefits: [
      {
        title: 'تحييد الاشتهاء',
        description:
          'يستهدف الليزر مناطق الدماغ المرتبطة بالرغبة في السكّر ويُخفّف الاندفاعات القسرية التي تُحبط جهودك.',
      },
      {
        title: 'استقرار الطاقة',
        description:
          'لا مزيد من ارتفاعات وانخفاضات سكّر الدم. تستعيد طاقة ثابتة طوال اليوم.',
      },
      {
        title: 'فقدان وزن طبيعي',
        description:
          'بتحييد الاشتهاء تُقلّل تلقائيًا سعراتك الحرارية دون إحباط أو حِمية صارمة.',
      },
      {
        title: 'الوقاية من السكّري',
        description:
          'تخفيف الإدمان على السكّر من أقوى وسائل الوقاية من السكّري من النوع الثاني.',
      },
    ],
    process: [
      'استشارة أولية لفهم عاداتك الغذائية وأهدافك.',
      'تطبيق الليزر على النقاط الأذنية المرتبطة بضبط الشهية.',
      'إرشادات تغذوية بسيطة لدعم علاقتك الجديدة بالطعام.',
      'متابعة لضبط تقدّمك والحفاظ عليه عبر الزمن.',
    ],
    cta: 'استعِد التحكّم في طعامك.',
  },

  stress: {
    metaTitle: 'التوتّر والقلق — تنظيم عصبي طبيعي',
    metaDescription:
      'منهج RESET لإدارة التوتّر والقلق: ليزر التحفيز الضوئي الذي ينظّم الكورتيزول والإندورفينات من أجل نوم عميق وهدوء داخلي.',
    eyebrow: 'التوتّر والقلق',
    title: 'هدّئ جهازك العصبي.',
    tagline: 'أسكِت ضجيج اليوم.',
    intro:
      'تنظيمنا العصبي غير الجراحي يخفّض الكورتيزول طبيعيًا ويُحفّز الإندورفينات، فيساعدك على إدارة القلق وتحسين جودة النوم دون أدوية.',
    benefits: [
      {
        title: 'تخفيض الكورتيزول',
        description:
          'يحفّز الليزر الإنتاج الطبيعي للإندورفينات التي توازن هرمون التوتّر وتُهدّئ الجسد.',
      },
      {
        title: 'نوم عميق',
        description:
          'تنظيم الجهاز العصبي لتنام أسرع وأعمق وتستيقظ مُستريحًا.',
      },
      {
        title: 'استعادة التركيز',
        description:
          'بدون الحِمل الذهني الدائم للتوتّر تستعيد الصفاء اللازم للتركيز والأداء.',
      },
      {
        title: 'بدون أدوية',
        description:
          'لا مضادات قلق ولا منوّمات. مقاربة طبيعية 100٪ تتكامل تمامًا مع ممارساتك الأخرى (رياضة، تأمّل...).',
      },
    ],
    process: [
      'استشارة أولية لتحديد مصادر التوتّر وأهدافك الشخصية.',
      'تطبيق الليزر على النقاط الأذنية لتنظيم الجهاز نظير الودّي.',
      'نصائح حول التنفّس والروتين للحفاظ على فائدة الجلسة.',
      'جلسات تثبيت ممكنة للحالات شديدة التوتّر.',
    ],
    cta: 'استعِد هدوءك الداخلي.',
  },
};

// ============================================================================
// Export
// ============================================================================
const CONTENT: Record<Locale, ServicesDict> = { fr, en, ar };

export function getServiceContent(locale: Locale, key: ServiceKey): ServiceContent {
  return CONTENT[locale]?.[key] ?? fr[key];
}
