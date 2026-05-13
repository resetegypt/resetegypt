import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Instagram, Clock } from 'lucide-react';

const SERVICES = [
  { href: '/services/smoking', label: 'Sevrage tabagique' },
  { href: '/services/drugs', label: 'Sevrage drogues' },
  { href: '/services/alcohol', label: 'Sevrage alcool' },
  { href: '/services/sugar', label: 'Gestion du sucre' },
  { href: '/services/stress', label: 'Stress & anxiété' },
];

const COMPANY = [
  { href: '/about', label: 'La méthode RESET' },
  { href: '/contact', label: 'Contact' },
  { href: 'https://book.reset-egypt.com', label: 'Réserver une séance', external: true },
];

export function Footer() {
  return (
    <footer className="mt-20 lg:mt-32 bg-primary text-primary-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                <Image src="/logo.svg" alt="RESET" width={56} height={56} className="block" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">RESET</div>
                <div className="text-[10px] tracking-[0.28em] font-semibold text-primary-light/70">
                  BRANCH CAIRO EAST CMC
                </div>
              </div>
            </div>
            <p className="text-sm text-primary-light/80 leading-relaxed">
              Méthode française non-invasive combinant auriculothérapie et laser de
              photobiomodulation pour neutraliser naturellement les addictions et le stress.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/resetegypt"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="text-[10px] tracking-[0.28em] font-bold text-primary-light/60 uppercase mb-3">
              Services
            </div>
            <ul className="space-y-2">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-sm text-primary-light/80 hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens & contact */}
          <div>
            <div className="text-[10px] tracking-[0.28em] font-bold text-primary-light/60 uppercase mb-3">
              Centre
            </div>
            <ul className="space-y-2 mb-5">
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-primary-light/80 hover:text-white transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm text-primary-light/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  N Teseen, New Cairo 1<br />
                  Le Caire 11835, Égypte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>11h – 22h, 7/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <a
                  href="mailto:hello@reset-egypt.com"
                  className="hover:text-white transition-colors"
                >
                  hello@reset-egypt.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between gap-3 text-xs text-primary-light/60">
          <div>© {new Date().getFullYear()} RESET Yourself — Branch Cairo East CMC</div>
          <div>Centre non-médical · Conforme décret 188/2020 (ETA) · Loi 151/2020</div>
        </div>
      </div>
    </footer>
  );
}
