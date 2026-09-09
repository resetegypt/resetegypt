'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Globe,
  Lock,
  Sparkles,
  Stethoscope,
  Users,
  Wrench,
} from 'lucide-react';

// ============================================================================
// Traductions FR / EN / AR
// ============================================================================
type Locale = 'fr' | 'en' | 'ar';
type Level = 'foundation' | 'intermediate' | 'advanced';

const DICT: Record<
  Locale,
  {
    brand: string;
    hero: {
      h1a: string;
      h1b: string;
      h1c: string;
      lede: string;
      modules: string;
      duration: string;
      languages: string;
      langsLabel: string;
      lock: string;
      lockLabel: string;
    };
    section: {
      eyebrow: string;
      title1: string;
      title2: string;
      sub: string;
    };
    card: {
      availableStatus: string;
      comingStatus: string;
      chapters: (n: number) => string;
      openModule: string;
      comingSoon: string;
    };
    upcoming: {
      eyebrow: string;
      title: string;
      sub: string;
      comingBadge: string;
      categories: Array<{ title: string; blurb: string }>;
    };
    footer: {
      label: string;
      text: string;
    };
    levels: Record<Level, string>;
    modules: Array<{
      title: string;
      eyebrow: string;
      blurb: string;
      chapters: string[];
      duration: string;
    }>;
  }
> = {
  fr: {
    brand: 'Formation praticien',
    hero: {
      h1a: 'Le parcours ',
      h1b: 'praticien',
      h1c: 'Reset',
      lede: "Du socle théorique à la relation client, deux modules à suivre dans l'ordre — trilingues (français · مصري · english). Contenu métier confidentiel réservé aux praticiens certifiés Reset.",
      modules: 'modules',
      duration: 'de contenu',
      languages: '3 langues',
      langsLabel: 'FR · AR · EN',
      lock: 'Privé',
      lockLabel: 'praticiens',
    },
    section: {
      eyebrow: 'Le parcours',
      title1: "D'abord le savoir,",
      title2: 'puis le savoir-faire.',
      sub: "Deux modules pensés pour se suivre dans l'ordre, mais indépendants.",
    },
    card: {
      availableStatus: 'Disponible',
      comingStatus: 'Bientôt',
      chapters: (n) => `Au sommaire — ${n} chapitre${n > 1 ? 's' : ''}`,
      openModule: 'Ouvrir le module',
      comingSoon: 'Bientôt disponible',
    },
    upcoming: {
      eyebrow: 'Bientôt',
      title: 'Les prochaines catégories',
      sub: "La structure est prête pour recevoir les modules spécialisés à mesure qu'ils sont produits.",
      comingBadge: 'Bientôt',
      categories: [
        {
          title: 'Techniques par addiction',
          blurb: 'Protocoles tabac, drogues, alcool, sucre, stress — un module par service.',
        },
        {
          title: 'Clinique & suivi',
          blurb: 'Contre-indications, cas complexes, gestion des rechutes.',
        },
        {
          title: 'Cabinet & relation client',
          blurb: 'Accueil, tarifs, communication patient, éthique, marketing.',
        },
      ],
    },
    footer: {
      label: 'Confidentialité.',
      text: "Le contenu de cette section est destiné aux praticiens certifiés Reset. Ne le partagez pas hors équipe, ne copiez pas les URLs à l'extérieur : c'est votre savoir-faire métier et notre différenciation clinique.",
    },
    levels: { foundation: 'Fondamental', intermediate: 'Intermédiaire', advanced: 'Avancé' },
    modules: [
      {
        title: 'Manuel Laser Anti-Tabac',
        eyebrow: 'Le socle théorique',
        blurb:
          "Le manuel de référence complet, réorganisé en quatre parties qui se suivent : comprendre la méthode auriculothérapique, connaître l'anatomie et la cartographie de l'oreille, maîtriser les outils et les protocoles, et accompagner le fumeur au quotidien.",
        chapters: [
          'Comprendre la méthode',
          "L'oreille : anatomie et cartographie",
          'Outils et protocoles',
          "Le tabac et l'accompagnement",
        ],
        duration: '2 h',
      },
      {
        title: 'Le discours praticien',
        eyebrow: 'La relation client',
        blurb:
          "Trois chapitres du premier regard échangé au démarrage de la séance : accueil et règle des cinq sens, définition de l'addiction avec ses images pédagogiques (tétine, faux capteur, tagine), et le sevrage psychologique en trois appuis — cœur, corps, esprit.",
        chapters: [
          "Recevoir le client & expliquer l'addiction",
          'Établir le sevrage psychologique',
          'La récompense et la séance',
        ],
        duration: '45 min',
      },
    ],
  },
  en: {
    brand: 'Practitioner training',
    hero: {
      h1a: 'The Reset ',
      h1b: 'practitioner',
      h1c: 'programme',
      lede: 'From the theoretical foundation to the client relationship, two modules to follow in order — trilingual (français · مصري · english). Confidential professional content, reserved for Reset-certified practitioners.',
      modules: 'modules',
      duration: 'of content',
      languages: '3 languages',
      langsLabel: 'FR · AR · EN',
      lock: 'Private',
      lockLabel: 'practitioners',
    },
    section: {
      eyebrow: 'The programme',
      title1: 'First the knowledge,',
      title2: 'then the practice.',
      sub: 'Two modules built to be followed in order, but each stands on its own.',
    },
    card: {
      availableStatus: 'Available',
      comingStatus: 'Soon',
      chapters: (n) => `Contents — ${n} chapter${n > 1 ? 's' : ''}`,
      openModule: 'Open module',
      comingSoon: 'Coming soon',
    },
    upcoming: {
      eyebrow: 'Coming soon',
      title: 'Upcoming categories',
      sub: 'The structure is ready to receive specialised modules as they are produced.',
      comingBadge: 'Soon',
      categories: [
        {
          title: 'Techniques by addiction',
          blurb: 'Protocols for tobacco, drugs, alcohol, sugar, stress — one module per service.',
        },
        {
          title: 'Clinical & follow-up',
          blurb: 'Contra-indications, complex cases, managing relapse.',
        },
        {
          title: 'Practice & client relationship',
          blurb: 'Welcoming, pricing, patient communication, ethics, marketing.',
        },
      ],
    },
    footer: {
      label: 'Confidentiality.',
      text: 'The content in this section is intended for Reset-certified practitioners. Do not share it outside your team, do not copy URLs externally: this is your professional know-how and our clinical differentiation.',
    },
    levels: { foundation: 'Foundation', intermediate: 'Intermediate', advanced: 'Advanced' },
    modules: [
      {
        title: 'Anti-Tobacco Laser Manual',
        eyebrow: 'Theoretical foundation',
        blurb:
          'The complete reference manual, reorganised into four sequential parts: understanding the auriculotherapy method, knowing the anatomy and cartography of the ear, mastering the tools and protocols, and supporting the smoker day-to-day.',
        chapters: [
          'Understanding the method',
          'The ear: anatomy and cartography',
          'Tools and protocols',
          'Tobacco and support',
        ],
        duration: '2 h',
      },
      {
        title: 'The practitioner script',
        eyebrow: 'Client relationship',
        blurb:
          'Three chapters from the first look exchanged to the start of the session: welcome and the five-senses rule, definition of addiction with its pedagogical images (pacifier, false sensor, tagine), and psychological withdrawal in three supports — heart, body, mind.',
        chapters: [
          'Welcoming the client & explaining addiction',
          'Establishing psychological withdrawal',
          'The reward and the session',
        ],
        duration: '45 min',
      },
    ],
  },
  ar: {
    brand: 'تدريب الممارس',
    hero: {
      h1a: 'مسار ',
      h1b: 'الممارس',
      h1c: 'Reset',
      lede: 'من الأساس النظري إلى العلاقة مع العميل، وحدتان للمتابعة بالترتيب — بثلاث لغات (فرنساوي · مصري · إنجليزي). محتوى مهني سري مخصص للممارسين المعتمدين من Reset.',
      modules: 'وحدات',
      duration: 'من المحتوى',
      languages: '٣ لغات',
      langsLabel: 'FR · AR · EN',
      lock: 'خاص',
      lockLabel: 'للممارسين',
    },
    section: {
      eyebrow: 'المسار',
      title1: 'الأول المعرفة،',
      title2: 'وبعدين المهارة.',
      sub: 'وحدتان مصممتان للمتابعة بالترتيب، لكن كل واحدة قائمة بذاتها.',
    },
    card: {
      availableStatus: 'متاح',
      comingStatus: 'قريبا',
      chapters: (n) => `المحتويات — ${n} ${n > 1 ? 'فصول' : 'فصل'}`,
      openModule: 'فتح الوحدة',
      comingSoon: 'قريبا',
    },
    upcoming: {
      eyebrow: 'قريبا',
      title: 'الفئات القادمة',
      sub: 'البنية جاهزة لاستقبال الوحدات المتخصصة عند إنتاجها.',
      comingBadge: 'قريبا',
      categories: [
        {
          title: 'التقنيات حسب الإدمان',
          blurb: 'بروتوكولات التبغ، المخدرات، الكحول، السكر، التوتر — وحدة لكل خدمة.',
        },
        { title: 'الطب والمتابعة', blurb: 'موانع الاستخدام، الحالات المعقدة، إدارة الانتكاسات.' },
        {
          title: 'العيادة وعلاقة العميل',
          blurb: 'الاستقبال، الأسعار، تواصل المرضى، الأخلاقيات، التسويق.',
        },
      ],
    },
    footer: {
      label: 'السرية.',
      text: 'محتوى هذا القسم مخصص للممارسين المعتمدين من Reset. لا تشاركه خارج الفريق، لا تنسخ الروابط للخارج: ده معرفتك المهنية وتميّزنا الطبي.',
    },
    levels: { foundation: 'أساسي', intermediate: 'متوسط', advanced: 'متقدم' },
    modules: [
      {
        title: 'دليل الليزر لمكافحة التدخين',
        eyebrow: 'الأساس النظري',
        blurb:
          'الدليل المرجعي الكامل، معاد تنظيمه في أربعة أجزاء متتالية: فهم منهجية العلاج بالأذن، معرفة تشريح ورسم الأذن، إتقان الأدوات والبروتوكولات، ومرافقة المدخن يوميا.',
        chapters: [
          'فهم المنهجية',
          'الأذن: التشريح والرسم',
          'الأدوات والبروتوكولات',
          'التبغ والمرافقة',
        ],
        duration: '٢ ساعة',
      },
      {
        title: 'كلام الممارس',
        eyebrow: 'العلاقة مع العميل',
        blurb:
          'ثلاث فصول من أول نظرة بينك وبين العميل لحد بداية الجلسة: الاستقبال وقاعدة الحواس الخمسة، تعريف الإدمان بصوره التعليمية (التتينة، الحساس الزيادة، الطاجن)، والإقلاع النفسي في ثلاث ركايز — القلب، الجسم، العقل.',
        chapters: ['استقبال العميل وشرح الإدمان', 'وضع خطة الإقلاع النفسي', 'المكافأة والجلسة'],
        duration: '٤٥ دقيقة',
      },
    ],
  },
};

const LANG_LABEL: Record<Locale, string> = { fr: 'FR', en: 'EN', ar: 'AR' };
const EMOJIS = ['📚', '💬'];
const HREFS = ['/formation/manuel-laser-anti-tabac.html', '/formation/discours-praticien.html'];

function detectLocale(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg === 'fr' || seg === 'en' || seg === 'ar') return seg;
  // Aucun préfixe = AR (default du site, cohérent avec Header/LangSwitcher).
  // Le LangSwitcher redirige AR vers /formation (car AR = default), FR vers
  // /fr/formation, EN vers /en/formation.
  return 'ar';
}

export function FormationClient() {
  const pathname = usePathname() ?? '/';
  const locale = detectLocale(pathname);
  const t = DICT[locale];
  const rtl = locale === 'ar';

  // Sync <html lang/dir> pour cette page (indépendant de Header/LocaleHtmlSync qui override sinon)
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  });

  const totalModules = t.modules.length;
  const upcomingIcons = [Wrench, Stethoscope, Users];
  const upcomingEmojis = ['🎯', '🩺', '💼'];
  const upcomingBg = ['bg-primary-lightest', 'bg-pink/10', 'bg-secondary/20'];

  return (
    <div className="bg-bg min-h-screen overflow-hidden">
      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#160A99] to-[#100090] text-white">
        <div
          aria-hidden
          className="absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-secondary/20 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '5s' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-32 w-[460px] h-[460px] rounded-full bg-pink/15 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '7s', animationDelay: '1s' }}
        />
        <div
          aria-hidden
          className="absolute top-1/3 left-1/4 w-[220px] h-[220px] rounded-full bg-white/5 blur-2xl pointer-events-none"
        />

        <div
          aria-hidden
          className="absolute top-16 right-16 w-2 h-2 rounded-full bg-secondary animate-bounce"
          style={{ animationDuration: '3s' }}
        />
        <div
          aria-hidden
          className="absolute top-24 right-32 w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
          style={{ animationDuration: '4s', animationDelay: '0.5s' }}
        />
        <div
          aria-hidden
          className="absolute bottom-32 left-20 w-3 h-3 rounded-full bg-pink/60 animate-bounce"
          style={{ animationDuration: '3.5s', animationDelay: '1s' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs font-bold tracking-wider uppercase text-white mb-6">
            <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{t.brand}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.02] max-w-4xl">
            {t.hero.h1a}
            <span className="relative inline-block">
              <span className="relative z-10 text-secondary">{t.hero.h1b}</span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 right-0 h-3 bg-pink/40 -z-0 -skew-x-6"
              />
            </span>
            <br />
            {t.hero.h1c} <span className="inline-block animate-pulse">🎓</span>
          </h1>

          <p className="mt-8 text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed font-medium">
            {t.hero.lede}
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <StatChip emoji="📖" value={String(totalModules)} label={t.hero.modules} />
            <StatChip emoji="⏱️" value="≈ 3h" label={t.hero.duration} />
            <StatChip emoji="🌍" value={t.hero.langsLabel} label={t.hero.languages} />
            <StatChip emoji="🔒" value={t.hero.lock} label={t.hero.lockLabel} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-bg" />
      </section>

      {/* ============================================================
          PARCOURS
      ============================================================ */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.28em] text-primary uppercase mb-3 bg-primary-lightest px-4 py-1.5 rounded-full">
            <span>✨</span>
            <span>{t.section.eyebrow}</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-black text-text tracking-tight leading-tight max-w-3xl mx-auto">
            {t.section.title1}
            <br />
            {t.section.title2}
          </h2>
          <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto">{t.section.sub}</p>
        </div>

        <ol className="relative space-y-16 lg:space-y-24">
          <div
            aria-hidden
            className="absolute left-8 lg:left-10 top-8 bottom-8 w-1 bg-gradient-to-b from-primary via-secondary to-primary-light rounded-full pointer-events-none opacity-40"
          />
          {t.modules.map((m, i) => (
            <li key={i} className="relative">
              <ModuleStep
                order={i + 1}
                emoji={EMOJIS[i]!}
                href={HREFS[i]!}
                title={m.title}
                eyebrow={m.eyebrow}
                blurb={m.blurb}
                chapters={m.chapters}
                duration={m.duration}
                levelLabel={t.levels.foundation}
                languages={['fr', 'ar', 'en']}
                availableStatus={t.card.availableStatus}
                chaptersLabel={t.card.chapters(m.chapters.length)}
                openLabel={t.card.openModule}
                isPrimary={i === 0}
              />
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================
          À VENIR
      ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="mb-8 lg:mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.28em] text-text-tertiary uppercase mb-3 bg-bg-secondary px-4 py-1.5 rounded-full">
            <span>🚀</span>
            <span>{t.upcoming.eyebrow}</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-text tracking-tight leading-tight">
            {t.upcoming.title}
          </h2>
          <p className="mt-3 text-sm text-text-secondary max-w-xl mx-auto">{t.upcoming.sub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.upcoming.categories.map((cat, i) => {
            const Icon = upcomingIcons[i]!;
            return (
              <div
                key={i}
                className="group rounded-2xl border-2 border-dashed border-border bg-surface/50 p-6 flex flex-col gap-4 hover:border-primary/40 hover:bg-primary-lightest/30 transition-all"
                style={{ animation: `float 6s ease-in-out ${i * 0.5}s infinite` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${upcomingBg[i]} group-hover:scale-110 transition-transform`}
                >
                  {upcomingEmojis[i]}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-text tracking-tight leading-tight mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{cat.blurb}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg-secondary text-text-tertiary self-start">
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
                  {t.upcoming.comingBadge}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <section className="border-t border-border-light bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-2xl bg-primary-lightest flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-primary" strokeWidth={2.5} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text font-black">{t.footer.label}</strong> {t.footer.text}
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function StatChip({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 hover:bg-white/15 transition-colors">
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="text-base font-black leading-none whitespace-nowrap">{value}</div>
        <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

interface ModuleStepProps {
  order: number;
  emoji: string;
  href: string;
  title: string;
  eyebrow: string;
  blurb: string;
  chapters: string[];
  duration: string;
  levelLabel: string;
  languages: Locale[];
  availableStatus: string;
  chaptersLabel: string;
  openLabel: string;
  isPrimary: boolean;
}

function ModuleStep(p: ModuleStepProps) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 lg:gap-8">
      <div className="relative">
        <div
          className={`w-16 h-16 lg:w-20 lg:h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10 rotate-3 hover:rotate-0 transition-transform ${
            p.isPrimary
              ? 'bg-gradient-to-br from-primary to-primary-dark shadow-primary/30'
              : 'bg-gradient-to-br from-secondary to-primary-light shadow-secondary/30'
          }`}
        >
          <span className="font-black text-white text-2xl lg:text-3xl tabular-nums">
            {String(p.order).padStart(2, '0')}
          </span>
        </div>
      </div>

      <article className="group relative rounded-3xl bg-surface border-2 transition-all overflow-hidden border-border-light hover:border-primary hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15">
        <div
          className={`h-2 ${
            p.isPrimary
              ? 'bg-gradient-to-r from-primary via-secondary to-primary-light'
              : 'bg-gradient-to-r from-secondary via-pink to-primary'
          }`}
        />

        <div
          aria-hidden
          className="absolute -top-2 -right-4 text-8xl opacity-5 pointer-events-none rotate-12 group-hover:opacity-10 transition-opacity"
        >
          {p.emoji}
        </div>

        <div className="relative p-6 lg:p-8 flex flex-col gap-5">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-2 bg-primary-lightest px-3 py-1 rounded-full">
                <span>{p.emoji}</span>
                <span>{p.eyebrow}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-text tracking-tight leading-tight">
                {p.title}
              </h3>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
              {p.availableStatus}
            </span>
          </header>

          <p className="text-sm lg:text-base text-text-secondary leading-relaxed">{p.blurb}</p>

          <div className="bg-gradient-to-br from-primary-lightest/50 to-bg-secondary/30 rounded-2xl p-5 border border-primary-lightest">
            <div className="text-[10px] tracking-wider font-black text-primary uppercase mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>{p.chaptersLabel}</span>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {p.chapters.map((c, i) => (
                <li key={c} className="flex items-baseline gap-2.5 text-sm">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-text font-medium">{c}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                {p.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                {p.levelLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Globe className="w-3.5 h-3.5" strokeWidth={2.5} />
                {p.languages.map((l) => LANG_LABEL[l]).join(' · ')}
              </span>
            </div>

            <Link
              href={p.href}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-100 transition-all shadow-lg shadow-primary/25 group/cta"
            >
              {p.openLabel}
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover/cta:translate-x-1 rtl:rotate-180"
                strokeWidth={3}
              />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
