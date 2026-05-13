import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, ResetLogo } from '@reset/ui';
import { useAuthStore } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  Users,
  Wallet,
  BarChart3,
  ShieldCheck,
  ScrollText,
  LogOut,
  Search,
  UserCircle,
  CalendarPlus,
  Stethoscope,
  CornerDownLeft,
  ArrowUpDown,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

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
    to: '/waiting-list',
    label: 'nav.waitingList',
    Icon: Bell,
    roles: ['SECRETARY', 'ADMIN'],
    section: 'work',
  },
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
        {/* Brand band — logo officiel + branch label + user card */}
        <div className="px-3 pt-3 space-y-2">
          {/* Logo officiel (SVG du graphiste) */}
          <div className="rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(30,15,186,0.2)]">
            <ResetLogo variant="full" className="block w-full h-auto" />
          </div>

          {/* Branch label + user info, sur fond bleu pour cohérence */}
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-light px-4 pt-3 pb-4 relative overflow-hidden shadow-[0_4px_12px_rgba(30,15,186,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full bg-primary-light/10 blur-2xl pointer-events-none" />
            <div className="relative text-center mb-3">
              <div className="text-[10px] text-primary-light/75 tracking-[0.28em] font-semibold">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
            <div className="relative flex items-center gap-3">
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

      {cmdkOpen && (
        <CommandPalette
          onClose={() => setCmdkOpen(false)}
          items={visibleNav}
          role={user.role}
        />
      )}
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

// === Command palette élargi ============================================
// Trois sources fusionnées :
//   1. Pages (navigation)
//   2. Patients (debounced search par nom/téléphone)
//   3. Actions rapides ("Encaisser pour…", "Nouveau RDV pour…")
//
// Quand l'utilisateur sélectionne un patient on propose les actions
// associées. Quand il sélectionne une action sans patient (ex: "Nouveau
// patient"), on navigue directement.

interface CmdkPatient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  primaryAddiction: string;
  tags: string[];
}

type CmdkResult =
  | { kind: 'page'; id: string; label: string; to: string; Icon: LucideIcon; meta?: string }
  | { kind: 'patient'; id: string; patient: CmdkPatient }
  | {
      kind: 'action';
      id: string;
      label: string;
      Icon: LucideIcon;
      meta?: string;
      run: () => void;
    };

function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function CommandPalette({
  onClose,
  items,
  role,
}: {
  onClose: () => void;
  items: NavItem[];
  role: 'ADMIN' | 'PRACTITIONER' | 'SECRETARY';
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query);
  const trimmedQuery = debouncedQuery.trim();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Patient search (3+ chars to trigger query)
  const { data: patientsData, isFetching: patientsLoading } = useQuery({
    queryKey: ['cmdk-patients', trimmedQuery],
    queryFn: () =>
      apiGet<{ patients: CmdkPatient[] }>(
        `/patients?search=${encodeURIComponent(trimmedQuery)}&status=all`,
      ),
    enabled: trimmedQuery.length >= 2,
    staleTime: 5_000,
  });
  const patients = patientsData?.patients ?? [];

  const results: CmdkResult[] = useMemo(() => {
    const out: CmdkResult[] = [];
    const q = trimmedQuery.toLowerCase();

    // 1) Pages
    const pageItems = items.filter((it) =>
      q.length === 0 ? true : t(it.label).toLowerCase().includes(q),
    );
    pageItems.forEach((it) =>
      out.push({
        kind: 'page',
        id: `page:${it.to}`,
        label: t(it.label),
        to: it.to,
        Icon: it.Icon,
        meta: it.to,
      }),
    );

    // 2) Actions globales (filtrées par rôle)
    const globalActions: Array<{
      id: string;
      label: string;
      Icon: LucideIcon;
      keywords: string;
      run: () => void;
      allowed: boolean;
    }> = [
      {
        id: 'action:new-patient',
        label: t('cmdk.actions.newPatient', 'Nouveau patient (fiche d\'accueil)'),
        Icon: UserCircle,
        keywords: 'patient nouveau accueil intake',
        run: () => navigate('/patients/intake'),
        allowed: role !== 'PRACTITIONER',
      },
      {
        id: 'action:new-appointment',
        label: t('cmdk.actions.newAppointment', 'Nouveau rendez-vous'),
        Icon: CalendarPlus,
        keywords: 'rdv rendez-vous appointment nouveau',
        run: () => navigate('/appointments/new'),
        allowed: role !== 'PRACTITIONER',
      },
      {
        id: 'action:waiting-list',
        label: t('cmdk.actions.waitingList', "Voir la liste d'attente"),
        Icon: Users,
        keywords: 'attente waiting list file',
        run: () => navigate('/waiting-list'),
        allowed: true,
      },
    ];
    const matchingGlobals = globalActions.filter(
      (a) =>
        a.allowed &&
        (q.length === 0 ||
          a.label.toLowerCase().includes(q) ||
          a.keywords.includes(q)),
    );
    matchingGlobals.forEach((a) =>
      out.push({
        kind: 'action',
        id: a.id,
        label: a.label,
        Icon: a.Icon,
        meta: t('cmdk.actionTag', 'Action'),
        run: a.run,
      }),
    );

    // 3) Patients (uniquement si on a tapé qqch)
    if (q.length >= 2) {
      patients.slice(0, 8).forEach((p) =>
        out.push({ kind: 'patient', id: `patient:${p.id}`, patient: p }),
      );
    }

    return out;
  }, [items, t, trimmedQuery, patients, role, navigate]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [trimmedQuery]);

  const activate = (r: CmdkResult): void => {
    if (r.kind === 'page') {
      navigate(r.to);
      onClose();
    } else if (r.kind === 'action') {
      r.run();
      onClose();
    } else if (r.kind === 'patient') {
      navigate(`/patients/${r.patient.id}`);
      onClose();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIdx]) {
        activate(results[selectedIdx]!);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selectedIdx, navigate, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-text/30 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'cmdk.placeholderExtended',
              'Rechercher un patient, une action, une page…',
            )}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-tertiary"
          />
          {patientsLoading && trimmedQuery.length >= 2 && (
            <span className="text-[10px] text-text-tertiary animate-pulse">…</span>
          )}
          <kbd className="text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 border border-border rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-sm text-text-tertiary text-center">
              {t('cmdk.empty', 'Aucun résultat')}
              {trimmedQuery.length === 1 && (
                <div className="text-[11px] text-text-tertiary/70 mt-2">
                  {t('cmdk.minChars', 'Tapez au moins 2 caractères pour rechercher.')}
                </div>
              )}
            </div>
          ) : (
            <CmdkList
              results={results}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              onActivate={activate}
              onPatientAction={(p, action) => {
                if (action === 'open') navigate(`/patients/${p.id}`);
                if (action === 'appointment') navigate(`/appointments/new?patientId=${p.id}`);
                if (action === 'clinical') navigate(`/patients/${p.id}/clinical`);
                if (action === 'addToWaiting')
                  navigate(`/waiting-list?prefillPatientId=${p.id}`);
                onClose();
              }}
            />
          )}
        </div>

        {/* Footer keymap */}
        <div className="px-4 py-2 border-t border-border bg-bg-secondary/30 flex items-center justify-between text-[10px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> {t('cmdk.navigate', 'Naviguer')}
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> {t('cmdk.select', 'Sélectionner')}
            </span>
          </div>
          <span>{t('cmdk.results', '{{n}} résultat(s)', { n: results.length })}</span>
        </div>
      </div>
    </div>
  );
}

function CmdkList({
  results,
  selectedIdx,
  setSelectedIdx,
  onActivate,
  onPatientAction,
}: {
  results: CmdkResult[];
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
  onActivate: (r: CmdkResult) => void;
  onPatientAction: (
    p: CmdkPatient,
    action: 'open' | 'appointment' | 'clinical' | 'addToWaiting',
  ) => void;
}) {
  // Group results by kind for visual sections
  const pages = results.filter((r) => r.kind === 'page');
  const actions = results.filter((r) => r.kind === 'action');
  const patients = results.filter((r) => r.kind === 'patient');

  let runningIdx = 0;
  const renderRow = (r: CmdkResult) => {
    const idx = runningIdx++;
    const isSelected = idx === selectedIdx;
    if (r.kind === 'patient') {
      const p = r.patient;
      const initials =
        (p.firstName.charAt(0) ?? '') + (p.lastName.charAt(0) ?? '');
      return (
        <div
          key={r.id}
          onMouseEnter={() => setSelectedIdx(idx)}
          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
            isSelected ? 'bg-primary/10' : 'hover:bg-bg-secondary'
          }`}
          onClick={() => onActivate(r)}
        >
          <Avatar className="w-8 h-8">
            {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} /> : null}
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary-light to-secondary text-primary-dark font-bold">
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text truncate flex items-center gap-1.5">
              {p.firstName} {p.lastName}
              {p.tags.includes('vip') && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-px rounded">VIP</span>
              )}
            </div>
            <div className="text-[11px] text-text-secondary font-mono">{p.phone}</div>
          </div>
          {isSelected && (
            <div className="hidden md:flex items-center gap-1">
              <CmdkInlineAction
                label="Fiche"
                onClick={(e) => {
                  e.stopPropagation();
                  onPatientAction(p, 'open');
                }}
              />
              <CmdkInlineAction
                Icon={CalendarPlus}
                label="RDV"
                onClick={(e) => {
                  e.stopPropagation();
                  onPatientAction(p, 'appointment');
                }}
              />
              <CmdkInlineAction
                Icon={Stethoscope}
                label="Clinique"
                onClick={(e) => {
                  e.stopPropagation();
                  onPatientAction(p, 'clinical');
                }}
              />
            </div>
          )}
        </div>
      );
    }
    const Icon = r.Icon;
    return (
      <button
        key={r.id}
        type="button"
        onMouseEnter={() => setSelectedIdx(idx)}
        onClick={() => onActivate(r)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-start ${
          isSelected ? 'bg-primary/10 text-primary' : 'text-text hover:bg-bg-secondary'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{r.label}</span>
        {r.meta && (
          <span className="ms-auto text-[10px] text-text-tertiary font-mono">{r.meta}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {actions.length > 0 && (
        <CmdkSection label="Actions rapides">{actions.map(renderRow)}</CmdkSection>
      )}
      {patients.length > 0 && (
        <CmdkSection label="Patients">{patients.map(renderRow)}</CmdkSection>
      )}
      {pages.length > 0 && (
        <CmdkSection label="Navigation">{pages.map(renderRow)}</CmdkSection>
      )}
    </>
  );
}

function CmdkSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-text-tertiary">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function CmdkInlineAction({
  Icon,
  label,
  onClick,
}: {
  Icon?: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border border-border bg-surface text-text-secondary hover:border-primary hover:text-primary transition-colors"
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
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
