'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import {
  LOCALES,
  LOCALE_LABEL,
  DEFAULT_LOCALE,
  type Locale,
  getDict,
  localizedPath,
  isRtl,
} from '../lib/i18n';

function detectLocale(pathname: string): Locale {
  // Pathname formats: '/', '/fr', '/fr/about', '/en/services/smoking', '/ar/about'
  // AR est la langue par défaut (pas de préfixe). FR et EN sont préfixés.
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg === 'fr' || seg === 'en' || seg === 'ar') return seg;
  return DEFAULT_LOCALE;
}

function stripLocale(pathname: string): string {
  // Retire le préfixe /fr, /en ou /ar pour récupérer le chemin "neutre"
  const segs = pathname.split('/').filter(Boolean);
  if (segs[0] === 'fr' || segs[0] === 'en' || segs[0] === 'ar') segs.shift();
  return '/' + segs.join('/');
}

export function Header() {
  const pathname = usePathname() ?? '/';
  const locale = detectLocale(pathname);
  const dict = getDict(locale);
  const rtl = isRtl(locale);
  const neutralPath = stripLocale(pathname);

  const NAV = [
    { href: '/', label: dict.nav.home },
    { href: '/about', label: dict.nav.about },
    { href: '/services', label: dict.nav.services },
    { href: '/contact', label: dict.nav.contact },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync l'attribut dir du document avec la locale courante (RTL pour AR)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    }
  }, [locale, rtl]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? 'bg-surface/95 backdrop-blur-md border-b border-border-light shadow-sm'
          : 'bg-surface border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          {/* Brand */}
          <Link href={localizedPath('/', locale)} className="flex items-center gap-3 group shrink-0">
            <Image
              src="/logo-yourself.png"
              alt="Reset Yourself"
              width={988}
              height={300}
              priority
              className="block h-12 sm:h-12 lg:h-14 w-auto transition-transform group-hover:scale-105"
            />
            <div className="leading-tight hidden md:block ms-1">
              <div className="text-[9px] lg:text-[10px] tracking-[0.28em] font-semibold text-text-tertiary">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={localizedPath(item.href, locale)}
                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + langues + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <LangSwitcher current={locale} neutralPath={neutralPath} />
            <Link
              href="https://book.reset-egypt.com"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
            >
              {dict.nav.book}
              <span aria-hidden>→</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 -mr-1 rounded-md text-text hover:bg-bg-secondary transition-colors"
              aria-label={dict.nav.menu}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border-light bg-surface">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={localizedPath(item.href, locale)}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://book.reset-egypt.com"
              className="block px-3 py-3 text-sm font-semibold bg-primary text-white rounded-lg text-center mt-3"
              onClick={() => setMobileOpen(false)}
            >
              {dict.nav.bookSession}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function LangSwitcher({ current, neutralPath }: { current: Locale; neutralPath: string }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-0.5">
      {LOCALES.map((lng) => {
        const isActive = lng === current;
        return (
          <Link
            key={lng}
            href={localizedPath(neutralPath, lng)}
            style={isActive ? { backgroundColor: '#100090', color: '#fff' } : undefined}
            className={`px-2 sm:px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              isActive
                ? 'shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {LOCALE_LABEL[lng]}
          </Link>
        );
      })}
    </div>
  );
}
