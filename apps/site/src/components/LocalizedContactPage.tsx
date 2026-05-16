// ============================================================================
// LocalizedContactPage — page Contact avec contenu i18n FR/EN/AR.
// ============================================================================

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, ArrowRight, Instagram } from 'lucide-react';
import { Section } from './Section';
import type { Locale } from '../lib/i18n';
import { getContactContent } from '../lib/page-content';

export function LocalizedContactPage({ locale }: { locale: Locale }) {
  const c = getContactContent(locale);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-primary/12 blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
            <Phone className="w-3 h-3" />
            {c.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
            {c.hero.title}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {c.hero.description}
          </p>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <Section className="pt-4 pb-12 lg:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ContactCard
            Icon={MessageCircle}
            title={c.cards.whatsapp.title}
            value="+20 1xx xxx xxxx"
            href="https://wa.me/201234567890"
            cta={c.cards.whatsapp.cta}
            primary
          />
          <ContactCard
            Icon={Phone}
            title={c.cards.phone.title}
            value="+20 1xx xxx xxxx"
            href="tel:+201234567890"
            cta={c.cards.phone.cta}
          />
          <ContactCard
            Icon={Mail}
            title={c.cards.email.title}
            value="secretary@reset-egypt.com"
            href="mailto:secretary@reset-egypt.com"
            cta={c.cards.email.cta}
          />
        </div>
      </Section>

      {/* CENTRE + HOURS */}
      <section className="py-16 lg:py-20 bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Address */}
          <div className="rounded-2xl bg-surface border border-border-light p-7 lg:p-8">
            <div className="w-12 h-12 rounded-xl bg-primary-lightest text-primary flex items-center justify-center mb-5">
              <MapPin className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="text-[10px] font-bold tracking-[0.32em] text-primary uppercase mb-2">
              {c.center.eyebrow}
            </div>
            <h2 className="text-2xl font-bold text-text leading-tight">{c.center.title}</h2>
            <p className="mt-4 text-base text-text-secondary leading-relaxed">
              {c.center.addressLine1}
              <br />
              {c.center.addressLine2}
            </p>
            <p className="mt-4 text-sm text-text-tertiary">{c.center.description}</p>
            <a
              href="https://maps.google.com/?q=CMC+Teseen+New+Cairo+Cairo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-primary hover:gap-2 transition-all"
            >
              {c.center.mapsLink}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hours */}
          <div className="rounded-2xl bg-surface border border-border-light p-7 lg:p-8">
            <div className="w-12 h-12 rounded-xl bg-primary-lightest text-primary flex items-center justify-center mb-5">
              <Clock className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="text-[10px] font-bold tracking-[0.32em] text-primary uppercase mb-2">
              {c.hours.eyebrow}
            </div>
            <h2 className="text-2xl font-bold text-text leading-tight">{c.hours.title}</h2>
            <dl className="mt-5 space-y-2.5">
              {[
                { day: c.hours.monThu, time: '11:00 – 22:00' },
                { day: c.hours.fri, time: '11:00 – 22:00' },
                { day: c.hours.satSun, time: '11:00 – 22:00' },
              ].map((h, idx) => (
                <div key={idx} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-text-secondary">{h.day}</dt>
                  <dd className="font-mono tabular-nums text-text font-semibold">{h.time}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-lightest text-primary text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {c.hours.flexibleBadge}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <Section eyebrow={c.social.eyebrow} title={c.social.title} align="center">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-base text-text-secondary leading-relaxed">{c.social.description}</p>
          <a
            href="https://instagram.com/reset_eg"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold bg-text text-white rounded-xl hover:bg-text/90 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            {c.social.button}
          </a>
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 lg:py-28 text-center px-4 bg-primary text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            {c.cta.title}
          </h2>
          <p className="mt-4 text-base text-primary-light leading-relaxed">{c.cta.description}</p>
          <Link
            href="https://book.reset-egypt.com"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 text-base font-semibold bg-white text-primary rounded-xl hover:bg-primary-lightest transition-all shadow-xl"
          >
            {c.cta.button}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  Icon,
  title,
  value,
  href,
  cta,
  primary,
}: {
  Icon: typeof Phone;
  title: string;
  value: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className={`group rounded-2xl p-6 lg:p-7 transition-all hover:-translate-y-1 ${
        primary
          ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/20'
          : 'bg-surface border border-border-light hover:border-primary/40 hover:shadow-lg'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          primary ? 'bg-white/15 text-white' : 'bg-primary-lightest text-primary'
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div
        className={`text-[10px] font-bold tracking-[0.28em] uppercase mb-1.5 ${primary ? 'text-white/70' : 'text-primary'}`}
      >
        {title}
      </div>
      <div className={`text-base font-bold tabular-nums ${primary ? 'text-white' : 'text-text'}`}>
        {value}
      </div>
      <div
        className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all ${primary ? 'text-white' : 'text-primary'}`}
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}
