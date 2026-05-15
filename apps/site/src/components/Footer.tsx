'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Instagram, Clock } from 'lucide-react';
import { getDict, localizedPath, DEFAULT_LOCALE, type Locale } from '../lib/i18n';

function detectLocale(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg === 'fr' || seg === 'en' || seg === 'ar') return seg;
  return DEFAULT_LOCALE;
}

export function Footer() {
  const pathname = usePathname() ?? '/';
  const locale = detectLocale(pathname);
  const dict = getDict(locale);

  const SERVICES = [
    { href: '/services/smoking', label: dict.services.smoking.title },
    { href: '/services/drugs', label: dict.services.drugs.title },
    { href: '/services/alcohol', label: dict.services.alcohol.title },
    { href: '/services/sugar', label: dict.services.sugar.title },
    { href: '/services/stress', label: dict.services.stress.title },
  ];

  const COMPANY = [
    { href: '/about', label: dict.nav.about },
    { href: '/contact', label: dict.nav.contact },
    { href: 'https://book.reset-egypt.com', label: dict.nav.book, external: true },
  ];

  return (
    <footer className="mt-20 lg:mt-32 bg-gradient-to-br from-primary via-[#160A99] to-[#100090] text-white relative overflow-hidden">
      {/* Halos décoratifs pour la profondeur */}
      <div aria-hidden className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-danger/8 blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                <Image src="/logo.svg" alt="RESET" width={56} height={56} className="block" />
              </div>
              <div>
                <div className="text-[10px] tracking-[0.28em] font-semibold text-white/85">
                  BRANCH CAIRO EAST CMC
                </div>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{dict.footer.description}</p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/reset_eg"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="text-[10px] tracking-[0.28em] font-bold text-white/85 uppercase mb-3">
              {dict.footer.services}
            </div>
            <ul className="space-y-2">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    href={localizedPath(s.href, locale)}
                    className="text-sm text-white/90 hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Centre & contact */}
          <div>
            <div className="text-[10px] tracking-[0.28em] font-bold text-white/85 uppercase mb-3">
              {dict.footer.centre}
            </div>
            <ul className="space-y-2 mb-5">
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.external ? c.href : localizedPath(c.href, locale)}
                    className="text-sm text-white/90 hover:text-white transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/80" />
                <span>
                  CMC, Teseen, New Cairo
                  <br />
                  Le Caire, Égypte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0 text-white/80" />
                <span>11h – 22h, 7/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-white/80" />
                <a href="mailto:hello@reset-egypt.com" className="hover:text-white transition-colors">
                  hello@reset-egypt.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/20 flex flex-col sm:flex-row sm:justify-between gap-3 text-xs text-white/75">
          <div>
            © {new Date().getFullYear()} {dict.footer.copyright}
          </div>
          <div>{dict.footer.legal}</div>
        </div>
      </div>
    </footer>
  );
}
