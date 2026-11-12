import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Inbox, X } from 'lucide-react';

export function Spinner({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
      <p className="text-sm text-white/50">{label}</p>
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40">
        <Inbox size={22} />
      </span>
      <p className="font-display text-sm font-semibold text-white/80">{title}</p>
      {subtitle && <p className="max-w-sm text-xs leading-relaxed text-white/40">{subtitle}</p>}
    </div>
  );
}

export function SectionHead({ index, eyebrow, title, desc }: { index: string; eyebrow: string; title: ReactNode; desc?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
      className="mx-auto mb-12 max-w-2xl text-center"
    >
      <p className="font-mono text-xs tracking-[0.3em] text-indigo-300/80 uppercase">
        <span className="text-pink-400">{index}.</span> {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-sm leading-relaxed text-white/55">{desc}</p>}
    </motion.div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className={`glass max-h-[92vh] w-full overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-7 ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                {subtitle && <p className="mt-1 text-xs text-white/50">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

export type ToastKind = 'success' | 'error';
export interface ToastData { id: number; kind: ToastKind; text: string }

export function Toasts({ toasts }: { toasts: ToastData[] }) {
  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className="glass pointer-events-auto flex items-start gap-2.5 rounded-2xl p-3.5 text-sm shadow-2xl"
          >
            {t.kind === 'success'
              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              : <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />}
            <p className="text-[13px] leading-snug text-white/85">{t.text}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const push = (kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  };
  return { toasts, notify: push };
}

export function formatDateID(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPeriod(p: string | null | undefined): string {
  if (!p) return '';
  if (/^\d{4}-\d{2}$/.test(p)) {
    const [y, m] = p.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(m, 10) - 1] || m} ${y}`;
  }
  return p;
}
