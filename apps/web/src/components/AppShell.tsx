import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, Badge, BrandMark, Button } from '@reset/ui';
import { useAuthStore } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Array<'ADMIN' | 'PRACTITIONER' | 'SECRETARY'>;
}

const NAV: NavItem[] = [
  { to: '/', label: 'nav.dashboard', icon: '📊' },
  { to: '/agenda', label: 'nav.agenda', icon: '📅' },
  { to: '/appointments/new', label: 'nav.newAppointment', icon: '➕', roles: ['SECRETARY', 'ADMIN'] },
  { to: '/inbox', label: 'nav.inbox', icon: '📥', roles: ['SECRETARY', 'ADMIN'] },
  { to: '/patients', label: 'nav.patients', icon: '👥' },
  { to: '/patients/intake', label: 'nav.intake', icon: '📝', roles: ['SECRETARY', 'ADMIN'] },
  { to: '/accounting', label: 'nav.accounting', icon: '💰', roles: ['SECRETARY', 'ADMIN'] },
  { to: '/stats', label: 'nav.stats', icon: '📈', roles: ['ADMIN'] },
  { to: '/admin/users', label: 'nav.adminUsers', icon: '🛡️', roles: ['ADMIN'] },
  { to: '/admin/audit', label: 'nav.auditLogs', icon: '📜', roles: ['ADMIN'] },
];

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();

  if (!user) return null;

  const initials =
    (user.firstName.charAt(0) ?? '') + (user.lastName.charAt(0) ?? '');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="bg-surface border-r border-border h-screen sticky top-0 overflow-y-auto flex flex-col">
        {/* Bandeau bleu royal — identité de marque + infos utilisateur connecté */}
        <div className="bg-primary text-primary-light px-5 pt-5 pb-4 border-b border-primary-dark">
          <div className="flex items-center justify-between">
            <BrandMark variant="wordmark" size="md" />
            <span className="text-[9px] text-primary-light/60 tracking-[0.3em] font-medium ml-2">YOURSELF</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="ring-2 ring-primary-light/30">
              <AvatarFallback className="bg-primary-light/20 text-primary-light font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[11px] text-primary-light/80 truncate">{user.email}</div>
              <div className="mt-1"><RoleBadge role={user.role} /></div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 mx-2 my-0.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary-dark font-medium'
                    : 'text-text hover:bg-bg-secondary'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex gap-1">
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng as Language)}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  i18n.language === lng
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-border-light'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            🚪 {t('nav.logout')}
          </Button>
        </div>
      </aside>
      <main className="overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: 'ADMIN' | 'PRACTITIONER' | 'SECRETARY' }) {
  const { t } = useTranslation();
  const variant =
    role === 'ADMIN' ? 'danger' : role === 'PRACTITIONER' ? 'success' : 'info';
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
    <div className="px-7 py-5 border-b border-border bg-surface flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
