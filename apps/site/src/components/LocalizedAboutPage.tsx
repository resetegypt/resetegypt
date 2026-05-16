// ============================================================================
// LocalizedAboutPage — page À propos avec contenu i18n FR/EN/AR.
// ============================================================================

import Image from 'next/image';
import Link from 'next/link';
import { Microscope, Zap, HeartHandshake, ArrowRight, Sparkles, Award, Shield } from 'lucide-react';
import { Section } from './Section';
import type { Locale } from '../lib/i18n';
import { getAboutContent } from '../lib/page-content';

const PILLAR_ICONS = [Microscope, Zap, HeartHandshake];

export function LocalizedAboutPage({ locale }: { locale: Locale }) {
  const c = getAboutContent(locale);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-20 -right-20 w-[24rem] h-[24rem] rounded-full bg-secondary/15 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-12 lg:pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
            <Sparkles className="w-3 h-3" />
            {c.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
            {c.hero.title1}
            <span className="block text-primary">{c.hero.title2}</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {c.hero.description}
          </p>
        </div>
      </section>

      {/* KPI */}
      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8 text-center">
          <KpiBlock value="90%" label={c.kpis.successRate} />
          <KpiBlock value="∞" label={c.kpis.livesReshaped} />
          <KpiBlock value="★★★★★" label={c.kpis.excellence} stars />
        </div>
      </section>

      {/* STORY */}
      <Section eyebrow={c.story.eyebrow} title={c.story.title}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-4 text-base text-text-secondary leading-relaxed">
            <p>
              {c.story.paragraph1.lead}
              <strong className="text-text">{c.story.paragraph1.emphasis1}</strong>
              <strong className="text-text"> {c.story.paragraph1.emphasis2}</strong>
              {c.story.paragraph1.tail}
            </p>
            <p>
              {c.story.paragraph2.lead}
              <strong className="text-text">{c.story.paragraph2.emphasis1}</strong>
              <strong className="text-text"> {c.story.paragraph2.emphasis2}</strong>
              {c.story.paragraph2.tail}
            </p>
            <p>
              {c.story.paragraph3.lead}
              <strong className="text-text">{c.story.paragraph3.emphasis}</strong>
              {c.story.paragraph3.tail}
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-2xl shadow-primary/20">
              <Image
                src="/photos/practitioner.webp"
                alt="RESET certified practitioner"
                width={569}
                height={749}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface shadow-xl border border-border-light text-sm font-semibold">
              <Award className="w-4 h-4 text-primary" />
              {c.story.badgeCertified}
            </div>
            <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white shadow-xl text-sm font-semibold">
              <Shield className="w-4 h-4" />
              {c.story.badgeNonInvasive}
            </div>
          </div>
        </div>
      </Section>

      {/* 3 PILLARS */}
      <Section
        eyebrow={c.pillars.eyebrow}
        title={c.pillars.title}
        subtitle={c.pillars.subtitle}
        align="center"
        className="bg-bg-secondary/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {c.pillars.items.map((p, idx) => {
            const Icon = PILLAR_ICONS[idx] ?? Microscope;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-surface border border-border-light p-7 hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-extrabold text-primary/30 tabular-nums leading-none">
                    0{idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-primary-lightest text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-text leading-tight">{p.title}</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 lg:py-28 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
            {c.cta.titleLead}
            <span className="text-primary">{c.cta.titleEmphasis}</span>
            {c.cta.titleTail}
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">{c.cta.description}</p>
          <Link
            href="https://book.reset-egypt.com"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/25"
          >
            {c.cta.button}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function KpiBlock({ value, label, stars }: { value: string; label: string; stars?: boolean }) {
  return (
    <div>
      <div
        className={`font-extrabold tracking-tight leading-none tabular-nums ${
          stars
            ? 'text-base sm:text-3xl lg:text-5xl tracking-tighter'
            : 'text-2xl sm:text-4xl lg:text-6xl'
        }`}
      >
        {value}
      </div>
      <div className="text-[9px] sm:text-[10px] lg:text-xs tracking-[0.18em] sm:tracking-[0.28em] font-bold text-primary-light/80 uppercase mt-2 sm:mt-3 leading-tight">
        {label}
      </div>
    </div>
  );
}
