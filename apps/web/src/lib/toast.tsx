import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

// ============================================================================
// Toast — système de notifications transitoires, brandé Reset.
//
// API :
//   const toast = useToast();
//   toast.success("Patient ajouté");
//   toast.error("Échec");
//   toast.info("Info");
//   toast.loading("Envoi…");        // retourne un id, à fermer manuellement
//   toast.dismiss(id);
//
// Le ToastProvider doit être monté à la racine de l'app (au-dessus du Router).
// On utilise framer-motion pour les transitions slide+fade.
// ============================================================================

export type ToastKind = 'success' | 'error' | 'info' | 'loading';

export interface ToastEntry {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  durationMs: number; // 0 = ne se ferme pas tout seul (loading)
}

interface ToastContextValue {
  show: (entry: Omit<ToastEntry, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (message: string, opts?: { title?: string; durationMs?: number }) => string;
  error: (message: string, opts?: { title?: string; durationMs?: number }) => string;
  info: (message: string, opts?: { title?: string; durationMs?: number }) => string;
  loading: (message: string, opts?: { title?: string }) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${Date.now()}-${idCounter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (entry: Omit<ToastEntry, 'id'>) => {
      const id = nextId();
      const full: ToastEntry = { id, ...entry };
      setEntries((list) => [...list, full]);
      if (full.durationMs > 0) {
        const tm = setTimeout(() => dismiss(id), full.durationMs);
        timers.current.set(id, tm);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, opts: { title?: string; durationMs?: number } = {}) =>
      show({
        kind: 'success',
        message,
        title: opts.title,
        durationMs: opts.durationMs ?? 3500,
      }),
    [show],
  );
  const error = useCallback(
    (message: string, opts: { title?: string; durationMs?: number } = {}) =>
      show({
        kind: 'error',
        message,
        title: opts.title,
        durationMs: opts.durationMs ?? 6000,
      }),
    [show],
  );
  const info = useCallback(
    (message: string, opts: { title?: string; durationMs?: number } = {}) =>
      show({
        kind: 'info',
        message,
        title: opts.title,
        durationMs: opts.durationMs ?? 3500,
      }),
    [show],
  );
  const loading = useCallback(
    (message: string, opts: { title?: string } = {}) =>
      show({
        kind: 'loading',
        message,
        title: opts.title,
        durationMs: 0,
      }),
    [show],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const ctx: ToastContextValue = { show, dismiss, success, error, info, loading };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(<ToastViewport entries={entries} onClose={dismiss} />, document.body)
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return ctx;
}

// === Viewport ===============================================================

function ToastViewport({
  entries,
  onClose,
}: {
  entries: ToastEntry[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[60] flex flex-col gap-2 pointer-events-none max-w-sm w-[90vw] sm:w-auto">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <ToastCard key={e.id} entry={e} onClose={() => onClose(e.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const KIND_STYLE: Record<
  ToastKind,
  { Icon: typeof CheckCircle2; ring: string; iconBg: string; iconColor: string }
> = {
  success: {
    Icon: CheckCircle2,
    ring: 'ring-1 ring-primary/30',
    iconBg: 'bg-primary-lightest',
    iconColor: 'text-primary-dark',
  },
  error: {
    Icon: AlertTriangle,
    ring: 'ring-1 ring-danger/40',
    iconBg: 'bg-danger-light',
    iconColor: 'text-danger-dark',
  },
  info: {
    Icon: Info,
    ring: 'ring-1 ring-info/30',
    iconBg: 'bg-info-light',
    iconColor: 'text-info-dark',
  },
  loading: {
    Icon: Loader2,
    ring: 'ring-1 ring-primary/30',
    iconBg: 'bg-primary-lightest',
    iconColor: 'text-primary-dark',
  },
};

function ToastCard({ entry, onClose }: { entry: ToastEntry; onClose: () => void }) {
  const s = KIND_STYLE[entry.kind];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={`pointer-events-auto rounded-xl bg-surface shadow-xl border border-border ${s.ring} px-4 py-3 flex items-start gap-3 min-w-[280px]`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.iconBg} ${s.iconColor}`}
      >
        <s.Icon
          className={`w-4 h-4 ${entry.kind === 'loading' ? 'animate-spin' : ''}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        {entry.title && (
          <div className="text-sm font-semibold text-text leading-tight">{entry.title}</div>
        )}
        <div className="text-sm text-text-secondary leading-snug">{entry.message}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-text-tertiary hover:text-text shrink-0 p-0.5"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
