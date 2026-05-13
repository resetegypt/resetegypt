import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Microscope,
  Zap,
  Calendar,
  Phone,
} from 'lucide-react';
import { Section } from './Section';
import { ServicesTabs } from './ServicesTabs';
import type { Dict, Locale } from '../lib/i18n';
import { localizedPath } from '../lib/i18n';

interface Props {
  dict: Dict;
  locale: Locale;
}

export function HomeContent({ dict, locale }: Props) {
  return (
    <>
      <Hero dict={dict} locale={locale} />
      <ServicesSection dict={dict} locale={locale} />
      <RegisteredSection dict={dict} />
      <VisitCenterSection dict={dict} locale={locale} />
      <MethodSection dict={dict} locale={locale} />
      <ProcessSection dict={dict} />
      <TestimonialsSection dict={dict} />
      <FaqSection dict={dict} />
      <FinalCta dict={dict} />
    </>
  );
}

// === HERO ===================================================================

function Hero({ dict, locale }: Props) {
  const d = dict.hero;
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden">
        <Image
          src="/photos/hero-bg.png"
          alt=""
          fill
          priority
          quality={85}
          className="object-cover object-center -z-10"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/60 to-primary/30 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/40 to-transparent -z-10" />

        <div className="relative px-6 sm:px-10 lg:px-16 py-16 sm:py-20 lg:py-28 min-h-[560px] lg:min-h-[640px] flex flex-col justify-center">
          <div className="text-[11px] sm:text-xs tracking-[0.32em] font-bold text-secondary uppercase mb-5">
            {d.eyebrow}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] font-extrabold text-white tracking-tight leading-[1.05] max-w-3xl">
            {d.title1}
            <span className="block">{d.title2}</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
            {d.description}
          </p>

          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 max-w-2xl text-sm sm:text-[15px] text-white/95">
            {[d.bullets.tobacco, d.bullets.drugs, d.bullets.sugar, d.bullets.alcohol, d.bullets.stress].map((label) => (
              <li key={label} className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" strokeWidth={2.25} />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              href={localizedPath('/services', locale)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] bg-white text-primary rounded-md hover:bg-primary-lightest transition-all"
            >
              {d.ctaServices}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://book.reset-egypt.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] bg-primary-dark text-white border border-white/20 rounded-md hover:bg-primary transition-all"
            >
              {d.ctaBook}
              <Calendar className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/40 hidden sm:block">
          <Image
            src="/logo.svg"
            alt="RESET"
            width={64}
            height={64}
            className="block w-14 h-14 lg:w-16 lg:h-16"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { value: '90%', label: d.kpi.successRate },
          { value: '0', label: d.kpi.medication },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-surface border border-border-light p-4 sm:p-5 text-center"
          >
            <div className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight tabular-nums">
              {m.value}
            </div>
            <div className="text-[10px] sm:text-xs text-text-secondary mt-1 tracking-wide">
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// === SERVICES ==============================================================

function ServicesSection({ dict, locale }: Props) {
  const s = dict.services;
  return (
    <Section eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} align="center">
      <ServicesTabs dict={dict} locale={locale} />
    </Section>
  );
}

// === REGISTERED ============================================================

function RegisteredSection({ dict }: { dict: Dict }) {
  const r = dict.registered;
  return (
    <Section eyebrow={r.eyebrow} title={r.title} subtitle={r.subtitle} align="center">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6 max-w-3xl mx-auto">
        <BadgeCard
          src="/photos/badge-moh.png"
          alt="Ministry of Health Registration"
          title={r.moh}
          subtitle={r.inProcess}
        />
        <BadgeCard
          src="/photos/badge-eda.png"
          alt="EDA — Egyptian Drug Authority"
          title={r.eda}
          subtitle={r.inProcess}
        />
      </div>
    </Section>
  );
}

function BadgeCard({ src, alt, title, subtitle }: { src: string; alt: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-3 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
      <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
        <Image src={src} alt={alt} width={200} height={200} className="object-contain max-w-full max-h-full" />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <h3 className="text-xs sm:text-sm font-bold text-text leading-tight">{title}</h3>
        <p className="text-[9px] sm:text-[10px] text-primary font-semibold mt-1 tracking-wider uppercase">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// === VISIT CENTER ===========================================================

function VisitCenterSection({ dict, locale }: Props) {
  const v = dict.visit;
  return (
    <section className="px-4 sm:px-6 lg:px-8 my-16 lg:my-24">
      <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative">
        <Image src="/photos/center-bg.jpeg" alt="" fill className="object-cover -z-10" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary/75 to-primary/30 -z-10" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 p-8 sm:p-12 lg:p-16">
          <div>
            <div className="text-[11px] tracking-[0.32em] font-bold text-secondary uppercase mb-4">
              {v.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {v.title1}
              <br />
              {v.title2}
            </h2>
            <p className="mt-5 text-white/85 leading-relaxed max-w-md">{v.description}</p>
            <div className="mt-6 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">📍</span>
                <span>
                  CMC, N Teseen, New Cairo 1
                  <br />
                  Le Caire 11835, Égypte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">🕐</span>
                <span>{v.hours}</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="https://book.reset-egypt.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] bg-secondary text-primary rounded-md hover:bg-white transition-all"
              >
                {v.ctaBook}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={localizedPath('/contact', locale)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white border border-white/40 rounded-md hover:bg-white/10 transition-all"
              >
                {v.ctaContact}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-2xl">
              <Image
                src="/photos/about-method.png"
                alt={v.title1}
                width={600}
                height={750}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-primary shadow-xl text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              {v.photoBadge}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === METHOD =================================================================

function MethodSection({ dict, locale }: Props) {
  const m = dict.method;
  const pillars = [
    { Icon: Microscope, ...m.pillar1 },
    { Icon: Zap, ...m.pillar2 },
    { Icon: HeartHandshake, ...m.pillar3 },
  ];
  return (
    <Section eyebrow={m.eyebrow} title={m.title} subtitle={m.subtitle}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center mb-12">
        <div className="lg:col-span-2 relative">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-xl shadow-primary/15 bg-bg-secondary">
            <Image
              src="/photos/dr-nogier.webp"
              alt="Dr. Paul Nogier"
              width={600}
              height={800}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 lg:-bottom-6 lg:-right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white shadow-xl text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {m.badge}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-4 text-base text-text-secondary leading-relaxed">
          <p>{m.p1}</p>
          <p>{m.p2}</p>
          <Link
            href={localizedPath('/about', locale)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            {m.linkMore}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="text-[10px] tracking-[0.32em] font-bold text-primary uppercase">
          {m.pillarsEyebrow}
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mt-2">
          {m.pillarsTitle}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {pillars.map((p, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 lg:p-8 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary-lightest text-primary flex items-center justify-center">
                <p.Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <span className="text-5xl font-extrabold text-primary/15 tabular-nums leading-none">
                0{idx + 1}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text leading-tight">{p.title}</h3>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-8">
        <div className="flex items-start gap-4 flex-col sm:flex-row">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-text">{m.noteTitle}</h4>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{m.noteBody}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// === PROCESS ================================================================

function ProcessSection({ dict }: { dict: Dict }) {
  const p = dict.process;
  const steps = [
    { Icon: HeartHandshake, ...p.step1, duration: '15 min' },
    { Icon: Zap, ...p.step2, duration: '20–30 min' },
    { Icon: CheckCircle2, ...p.step3, duration: '5 min' },
  ];
  return (
    <Section eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 lg:p-8 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                <s.Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <span className="text-5xl font-extrabold text-primary/15 tabular-nums leading-none">
                0{idx + 1}
              </span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.28em] text-primary uppercase mb-1.5">
              {p.step} 0{idx + 1}
            </div>
            <h3 className="text-base font-bold text-text leading-tight">{s.title}</h3>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">{s.description}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-text-tertiary border border-border-light px-2.5 py-1 rounded-md">
              <Sparkles className="w-3 h-3 text-primary" />
              {s.duration}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-7 flex items-start gap-4 flex-col sm:flex-row">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.28em] text-primary uppercase mb-1">
            {p.step4.eyebrow}
          </div>
          <h3 className="text-base font-bold text-text">{p.step4.title}</h3>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{p.step4.description}</p>
        </div>
      </div>
    </Section>
  );
}

// === TESTIMONIALS ===========================================================

function TestimonialsSection({ dict }: { dict: Dict }) {
  const t = dict.testimonials;
  return (
    <Section eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} className="bg-bg-secondary/40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {t.items.map((item, idx) => (
          <figure
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-0.5 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-sm text-text-secondary leading-relaxed">{item.quote}</blockquote>
            <figcaption className="mt-5 pt-5 border-t border-border-light flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md shadow-primary/15">
                {item.name
                  .split(' ')
                  .map((p) => p.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-bold text-text">{item.name}</div>
                <div className="text-xs text-text-tertiary">{item.role}</div>
              </div>
              <div className="ms-auto inline-flex items-center gap-1 text-[10px] font-semibold text-primary-dark bg-primary-lightest px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {t.verified}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

// === FAQ ====================================================================

function FaqSection({ dict }: { dict: Dict }) {
  const f = dict.faq;
  return (
    <Section eyebrow={f.eyebrow} title={f.title} subtitle={f.subtitle}>
      <div className="max-w-3xl mx-auto">
        <div className="space-y-3">
          {f.items.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl bg-surface border border-border-light overflow-hidden hover:border-primary/40 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                <h3 className="text-base font-semibold text-text leading-tight pr-4">{item.q}</h3>
                <span className="w-8 h-8 rounded-full bg-primary-lightest text-primary flex items-center justify-center text-lg font-bold transition-transform group-open:rotate-45 shrink-0">
                  +
                </span>
              </summary>
              <div className="px-6 pb-6 text-sm text-text-secondary leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

// === FINAL CTA ==============================================================

function FinalCta({ dict }: { dict: Dict }) {
  const c = dict.finalCta;
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {c.pill}
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
          {c.title1}
          <span className="block text-primary">{c.title2}</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {c.description}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center justify-center">
          <Link
            href="https://book.reset-egypt.com"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 hover:-translate-y-0.5"
          >
            {c.ctaBook}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/201234567890"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-text hover:text-primary border border-border-light rounded-xl hover:border-primary/40 transition-all"
          >
            <Phone className="w-4 h-4" />
            {c.ctaPhone}
          </a>
        </div>

        <div className="mt-10 text-xs text-text-tertiary">{c.address}</div>
      </div>
    </section>
  );
}
