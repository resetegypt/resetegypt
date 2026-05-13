import type { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function Section({
  children,
  className = '',
  id,
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: SectionProps) {
  return (
    <section id={id} className={`py-16 lg:py-24 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || subtitle) && (
          <header className={`mb-10 lg:mb-14 ${align === 'center' ? 'text-center' : ''} max-w-3xl ${align === 'center' ? 'mx-auto' : ''}`}>
            {eyebrow && (
              <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.32em] font-bold text-primary uppercase mb-3">
                <span className="w-6 h-px bg-primary" />
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight leading-[1.1]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
