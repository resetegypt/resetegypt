'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Cigarette, Pill, Wine, Candy, Brain, ArrowRight, type LucideIcon } from 'lucide-react';
import type { Dict, Locale } from '../lib/i18n';
import { localizedPath } from '../lib/i18n';

interface Service {
  id: 'smoking' | 'drugs' | 'alcohol' | 'sugar' | 'stress';
  href: string;
  Icon: LucideIcon;
  photo: string;
}

const SERVICES: Service[] = [
  { id: 'smoking', href: '/services/smoking', Icon: Cigarette, photo: '/photos/service-smoking.jpeg' },
  { id: 'drugs', href: '/services/drugs', Icon: Pill, photo: '/photos/service-drugs.jpeg' },
  { id: 'alcohol', href: '/services/alcohol', Icon: Wine, photo: '/photos/service-alcohol.jpeg' },
  { id: 'sugar', href: '/services/sugar', Icon: Candy, photo: '/photos/service-sugar.jpeg' },
  { id: 'stress', href: '/services/stress', Icon: Brain, photo: '/photos/service-stress.jpeg' },
];

export function ServicesTabs({ dict, locale }: { dict: Dict; locale: Locale }) {
  const [activeId, setActiveId] = useState<Service['id']>(SERVICES[0]!.id);
  const active = SERVICES.find((s) => s.id === activeId) ?? SERVICES[0]!;
  const activeDict = dict.services[active.id];
  const d = dict.services;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center snap-x snap-mandatory">
        {SERVICES.map((s) => {
          const isActive = s.id === activeId;
          const tab = dict.services[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`shrink-0 snap-start inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-text'
              }`}
              aria-pressed={isActive}
            >
              <s.Icon
                className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`}
                strokeWidth={1.75}
              />
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-3xl overflow-hidden bg-surface border border-border-light shadow-xl shadow-primary/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[400px] overflow-hidden bg-bg-secondary">
            <Image
              src={active.photo}
              alt={activeDict.title}
              fill
              key={active.id}
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-sm text-primary flex items-center justify-center shadow-lg">
              <active.Icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
          </div>

          <div className="p-7 lg:p-10 flex flex-col justify-center">
            <div className="text-[10px] tracking-[0.32em] font-bold text-primary uppercase mb-3">
              {d.eyebrowDetail}
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text tracking-tight leading-tight">
              {activeDict.title}
            </h3>
            <p className="mt-3 text-base lg:text-lg text-primary font-semibold">
              {activeDict.tagline}
            </p>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed">{d.description}</p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href={localizedPath(active.href, locale)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
              >
                {d.ctaMore}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://book.reset-egypt.com"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-text hover:text-primary border border-border rounded-lg hover:border-primary/40 transition-all"
              >
                {d.ctaBook}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
