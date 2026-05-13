'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Accueil' },
  { href: '/about', label: 'La méthode' },
  { href: '/services', label: 'Services', submenu: [
    { href: '/services/smoking', label: 'Sevrage tabagique' },
    { href: '/services/drugs', label: 'Sevrage drogues' },
    { href: '/services/alcohol', label: 'Sevrage alcool' },
    { href: '/services/sugar', label: 'Gestion du sucre' },
    { href: '/services/stress', label: 'Stress & anxiété' },
  ]},
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(30,15,186,0.2)] transition-transform group-hover:scale-105">
              <Image
                src="/logo.svg"
                alt="RESET"
                width={48}
                height={48}
                priority
                className="block w-10 h-10 lg:w-12 lg:h-12"
              />
            </div>
            <div className="leading-tight hidden xs:block">
              <div className="text-base lg:text-lg font-bold text-primary tracking-tight">
                RESET
              </div>
              <div className="text-[9px] lg:text-[10px] tracking-[0.28em] font-semibold text-text-tertiary">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) =>
              item.submenu ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                    {item.label}
                  </button>
                  {servicesOpen && (
                    <div className="absolute top-full left-0 pt-1 w-64">
                      <div className="bg-surface rounded-xl shadow-xl border border-border-light overflow-hidden py-2">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-4 py-2.5 text-sm text-text hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/201234567890"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <Link
              href="https://book.reset-egypt.com"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
            >
              Réserver
              <span aria-hidden>→</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 -mr-1 rounded-md text-text hover:bg-bg-secondary transition-colors"
              aria-label="Menu"
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
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
                {item.submenu && (
                  <div className="ms-3 ps-3 border-s border-border-light">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="https://book.reset-egypt.com"
              className="block px-3 py-3 text-sm font-semibold bg-primary text-white rounded-lg text-center mt-3"
              onClick={() => setMobileOpen(false)}
            >
              Réserver une séance →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
