import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, Badge, Button } from '@reset/ui';
import { useAuthStore } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  Inbox,
  Users,
  ClipboardPlus,
  Wallet,
  BarChart3,
  ShieldCheck,
  ScrollText,
  LogOut,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  roles?: Array<'ADMIN' | 'PRACTITIONER' | 'SECRETARY'>;
  section: 'work' | 'admin';
}

const NAV: NavItem[] = [
  { to: '/', label: 'nav.dashboard', Icon: LayoutDashboard, section: 'work' },
  { to: '/agenda', label: 'nav.agenda', Icon: Calendar, section: 'work' },
  { to: '/inbox', label: 'nav.inbox', Icon: Inbox, roles: ['SECRETARY', 'ADMIN'], section: 'work' },
  { to: '/patients', label: 'nav.patients', Icon: Users, section: 'work' },
  {
    to: '/accounting',
    label: 'nav.accounting',
    Icon: Wallet,
    roles: ['SECRETARY', 'ADMIN'],
    section: 'work',
  },
  { to: '/stats', label: 'nav.stats', Icon: BarChart3, roles: ['ADMIN'], section: 'admin' },
  {
    to: '/admin/users',
    label: 'nav.adminUsers',
    Icon: ShieldCheck,
    roles: ['ADMIN'],
    section: 'admin',
  },
  {
    to: '/admin/audit',
    label: 'nav.auditLogs',
    Icon: ScrollText,
    roles: ['ADMIN'],
    section: 'admin',
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [cmdkOpen, setCmdkOpen] = useState(false);

  // Ouverture du command palette via Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!user) return null;

  const initials = (user.firstName.charAt(0) ?? '') + (user.lastName.charAt(0) ?? '');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user.role));
  const workNav = visibleNav.filter((n) => n.section === 'work');
  const adminNav = visibleNav.filter((n) => n.section === 'admin');

  return (
    <div className="min-h-screen grid grid-cols-[264px_1fr] bg-bg">
      <aside className="bg-surface border-r border-border h-screen sticky top-0 overflow-y-auto flex flex-col">
        {/* Brand band — carte arrondie premium avec marge sur les côtés */}
        <div className="px-3 pt-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-light px-4 pt-4 pb-4 relative overflow-hidden shadow-[0_4px_12px_rgba(30,15,186,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute -top-20 -right-12 w-48 h-48 rounded-full bg-secondary/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full bg-primary-light/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-white">Reset</span>
              <span className="text-[10px] text-primary-light/70 tracking-[0.3em] font-semibold">EGYPT</span>
            </div>
            <div className="relative mt-4 flex items-center gap-3">
              <Avatar className="ring-2 ring-white/20 h-10 w-10">
                <AvatarFallback className="bg-white/15 text-white font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[11px] text-primary-light/80 truncate leading-tight">{user.email}</div>
                <div className="mt-1.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Command-K hint */}
        <button
          type="button"
          onClick={() => setCmdkOpen(true)}
          className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-secondary/50 hover:bg-bg-secondary px-3 py-2 text-xs text-text-secondary transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t('nav.search', 'Rechercher')}…</span>
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-text-tertiary">
            ⌘K
          </kbd>
        </button>

        {/* Nav sections */}
        <nav className="flex-1 py-3 px-2 space-y-5">
          <NavSection label={t('nav.sectionWork', 'WORKSPACE')} items={workNav} t={t} />
          {adminNav.length > 0 && (
            <NavSection label={t('nav.sectionAdmin', 'ADMINISTRATION')} items={adminNav} t={t} />
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-2 bg-bg-secondary/30">
          <div className="flex gap-1">
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng as Language)}
                className={`flex-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                  i18n.language === lng
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-secondary hover:border-primary/40'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-text-secondary hover:text-danger-dark"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 me-2" />
            {t('nav.logout')}
          </Button>
        </div>
      </aside>
      <main className="overflow-x-hidden">
        <Outlet />
      </main>

      {cmdkOpen && <CommandPalette onClose={() => setCmdkOpen(false)} items={visibleNav} />}
    </div>
  );
}

function NavSection({
  label,
  items,
  t,
}: {
  label: string;
  items: NavItem[];
  t: (k: string) => string;
}) {
  return (
    <div>
      <div className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em] text-text-tertiary uppercase">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute start-0 top-1 bottom-1 w-1 rounded-e-full bg-primary" />
                )}
                <item.Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                />
                <span className="truncate">{t(item.label)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function CommandPalette({ onClose, items }: { onClose: () => void; items: NavItem[] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = items.filter((it) =>
    t(it.label).toLowerCase().includes(query.toLowerCase()),
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selectedIdx]) {
        navigate(filtered[selectedIdx]!.to);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedIdx, navigate, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-text/30 backdrop-blur-sm flex items-start justify-center pt-32 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmdk.placeholder', 'Tapez pour rechercher…')}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-tertiary"
          />
          <kbd className="text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 border border-border rounded">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-sm text-text-tertiary text-center">
              {t('cmdk.empty', 'Aucun résultat')}
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.to}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => {
                  navigate(item.to);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  idx === selectedIdx
                    ? 'bg-primary/10 text-primary'
                    : 'text-text hover:bg-bg-secondary'
                }`}
              >
                <item.Icon className="w-4 h-4 shrink-0" />
                <span>{t(item.label)}</span>
                <span className="ms-auto text-[10px] text-text-tertiary font-mono">{item.to}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: 'ADMIN' | 'PRACTITIONER' | 'SECRETARY' }) {
  const { t } = useTranslation();
  const variant = role === 'ADMIN' ? 'danger' : role === 'PRACTITIONER' ? 'success' : 'info';
  return <Badge variant={variant}>{t(`roles.${role}`)}</Badge>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="px-7 py-6 border-b border-border bg-surface flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
