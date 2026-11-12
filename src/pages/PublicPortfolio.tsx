import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Award, BadgeCheck, Briefcase, Building2, Calendar, Code2,
  Cpu, Dribbble, ExternalLink, Github, Globe, Instagram, Linkedin, Lock, Mail, MapPin,
  Menu, Phone, Search, Send, Sparkles, Star, Twitter, X,
} from 'lucide-react';
import type { Certificate, Experience, Profile, Project, Skill } from '../types';
import { apiGetCertificates, apiGetExperiences, apiGetProfile, apiGetProjects, apiGetSkills, apiSendMessage } from '../lib/api';
import { EmptyState, SectionHead, Spinner, Toasts, formatDateID, formatPeriod, useToasts } from '../components/ui';

const ROLES = ['Full-Stack Developer', 'Blockchain Developer', 'Digital Marketing'];
const MARQUEE = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Supabase', 'PostgreSQL', 'Vercel', 'Docker', 'GraphQL', 'Stripe', 'Framer Motion'];
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop';

function socialLinks(socials: Profile['socials'] | undefined) {
  const s = socials || {};
  return [
    { key: 'github', icon: Github, url: s.github },
    { key: 'linkedin', icon: Linkedin, url: s.linkedin },
    { key: 'twitter', icon: Twitter, url: s.twitter },
    { key: 'instagram', icon: Instagram, url: s.instagram },
    { key: 'dribbble', icon: Dribbble, url: s.dribbble },
    { key: 'website', icon: Globe, url: s.website },
  ].filter((x) => !!x.url) as { key: string; icon: typeof Github; url: string }[];
}

function useTypedRole() {
  const [text, setText] = useState('');
  useEffect(() => {
    let role = 0, ch = 0, del = false, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = ROLES[role];
      setText(word.slice(0, ch));
      if (!del) { ch++; if (ch > word.length) { del = true; timer = setTimeout(tick, 1600); return; } }
      else { ch--; if (ch === 0) { del = false; role = (role + 1) % ROLES.length; } }
      timer = setTimeout(tick, del ? 36 : 70);
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, []);
  return text;
}

export default function PublicPortfolio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const { toasts, notify } = useToasts();
  const typed = useTypedRole();

  useEffect(() => {
    (async () => {
      try {
        const [p, e, pr, c, s] = await Promise.all([
          apiGetProfile(), apiGetExperiences(), apiGetProjects(), apiGetCertificates(), apiGetSkills(),
        ]);
        setProfile(p);
        setExperiences(e);
        setProjects(pr);
        setCertificates(c);
        setSkills(s);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    })();
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const hard = useMemo(() => skills.filter((s) => s.category !== 'soft'), [skills]);
  const soft = useMemo(() => skills.filter((s) => s.category === 'soft'), [skills]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.category) set.add(p.category); });
    return ['Semua', ...Array.from(set)];
  }, [projects]);
  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'Semua' && p.category !== filter) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [projects, filter, query]);

  const name = profile?.full_name || 'Portofolio';
  const socials = socialLinks(profile?.socials);

  const nav = [
    { href: '#beranda', label: 'Beranda' },
    { href: '#tentang', label: 'Tentang' },
    { href: '#skills', label: 'Skills' },
    { href: '#pengalaman', label: 'Pengalaman' },
    { href: '#proyek', label: 'Proyek' },
    { href: '#sertifikat', label: 'Sertifikat' },
    { href: '#kontak', label: 'Kontak' },
  ];

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      notify('error', 'Nama, email, dan pesan wajib diisi.');
      return;
    }
    setSending(true);
    try {
      await apiSendMessage({ name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim() });
      setForm({ name: '', email: '', subject: '', message: '' });
      notify('success', 'Pesan terkirim! Terima kasih, saya akan segera membalas.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-ink text-white antialiased">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="grid-bg absolute inset-0" />
        <div className="orb left-[-120px] top-[-80px] h-[420px] w-[420px] bg-indigo-600/60" />
        <div className="orb right-[-140px] top-[30%] h-[380px] w-[380px] bg-fuchsia-600/50" />
        <div className="orb bottom-[-160px] left-[20%] h-[360px] w-[360px] bg-pink-600/40" />
      </div>

      <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'glass shadow-lg shadow-black/30' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#beranda" className="font-display flex items-center gap-2.5 text-lg font-bold">
            <span className="grad-bg flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              {(name || 'R').charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{name.split(' ')[0]}<span className="grad-text">.dev</span></span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-[13px] font-medium text-white/65 transition hover:bg-white/5 hover:text-white">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/75 transition hover:border-indigo-400/40 hover:text-white sm:inline-flex">
              <Lock size={13} /> Admin
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-white/10 bg-white/5 p-2.5 lg:hidden" aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="glass mx-4 mb-3 rounded-2xl p-2 lg:hidden">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white">{n.label}</a>
            ))}
            <Link to="/admin" className="mt-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold">
              <Lock size={14} /> Dashboard Admin
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {loading ? (
          <div className="mx-auto max-w-6xl px-4 pt-28"><Spinner label="Memuat portofolio..." /></div>
        ) : loadError ? (
          <div className="mx-auto max-w-xl px-4 pt-32 text-center">
            <p className="font-display text-xl font-bold">Gagal memuat data</p>
            <p className="mt-2 text-sm text-white/50">{loadError}</p>
            <button onClick={() => window.location.reload()} className="grad-bg mt-5 rounded-full px-6 py-2.5 text-sm font-semibold">Muat Ulang</button>
          </div>
        ) : (
          <>
            <section id="beranda" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-28 pb-14 sm:px-6 sm:pt-36">
              <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  {profile?.availability && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
                      <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></span>
                      {profile.availability}
                    </span>
                  )}
                  <h1 className="font-display mt-5 text-4xl leading-[1.08] font-bold sm:text-6xl">
                    Halo, saya <span className="grad-text">{profile?.full_name?.split(' ')[0] || 'Developer'}</span>
                    <br />
                    <span className="text-white/90">{typed}</span>
                    <span className="animate-blink text-pink-400">|</span>
                  </h1>
                  {profile?.headline && <p className="font-display mt-3 text-base font-medium text-indigo-200/90 sm:text-lg">{profile.headline}</p>}
                  {profile?.about && <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-[15px]">{profile.about.split('.').slice(0, 2).join('.')}.</p>}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <a href="#proyek" className="grad-bg group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-xl shadow-indigo-500/30 transition hover:opacity-95">
                      Lihat Proyek <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </a>
                    <a href="#kontak" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                      Hubungi Saya
                    </a>
                  </div>
                  {socials.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {socials.map((s) => (
                        <a key={s.key} href={s.url} target="_blank" rel="noreferrer" aria-label={s.key} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-indigo-400/50 hover:text-white">
                          <s.icon size={16} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                    {[
                      { v: `${profile?.years_experience ?? experiences.length}+`, l: 'Tahun Pengalaman' },
                      { v: `${projects.length}+`, l: 'Proyek Selesai' },
                      { v: `${certificates.length}+`, l: 'Sertifikat' },
                    ].map((s) => (
                      <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
                        <p className="font-display grad-text text-2xl font-bold">{s.v}</p>
                        <p className="mt-1 text-[11px] font-medium text-white/50">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative mx-auto w-full max-w-sm">
                  <div className="grad-border animate-floaty overflow-hidden rounded-[2rem] shadow-2xl shadow-indigo-500/20">
                    <img
                      src={profile?.avatar_url || FALLBACK_AVATAR}
                      alt={name}
                      className="aspect-[4/5] w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-16">
                      <p className="font-display text-lg font-bold">{name}</p>
                      <p className="text-xs text-white/65">{profile?.location || ''}</p>
                    </div>
                  </div>
                  <div className="glass animate-floaty absolute -left-3 top-8 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold shadow-xl sm:-left-8" style={{ animationDelay: '0.8s' }}>
                    <span className="grad-bg flex h-8 w-8 items-center justify-center rounded-xl"><Briefcase size={14} /></span>
                    {experiences.length}+ Pengalaman
                  </div>
                  <div className="glass animate-floaty absolute -right-2 bottom-16 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold shadow-xl sm:-right-6" style={{ animationDelay: '1.6s' }}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300"><Star size={14} /></span>
                    {projects.filter((p) => p.featured).length} Featured
                  </div>
                </motion.div>
              </div>
            </section>

            <div className="overflow-hidden border-y border-white/10 bg-white/[0.02] py-4">
              <div className="animate-marquee flex w-max items-center gap-3 pr-3">
                {[...MARQUEE, ...MARQUEE].map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-xs text-white/60">
                    <Sparkles size={12} className="text-fuchsia-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            <section id="tentang" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
              <SectionHead index="01" eyebrow="Tentang Saya" title={<>Mengenal <span className="grad-text">lebih dekat</span></>} />
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grad-border overflow-hidden rounded-3xl">
                  <img src={profile?.avatar_url || FALLBACK_AVATAR} alt={name} className="aspect-square w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                    <h3 className="font-display text-xl font-bold">{profile?.headline || 'Developer'}</h3>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-white/60">{profile?.about || 'Belum ada deskripsi.'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Mail, label: 'Email', value: profile?.email || '-', href: profile?.email ? `mailto:${profile.email}` : undefined },
                      { icon: Phone, label: 'Telepon', value: profile?.phone || '-', href: undefined },
                      { icon: MapPin, label: 'Lokasi', value: profile?.location || '-', href: undefined },
                      { icon: Calendar, label: 'Pengalaman', value: `${profile?.years_experience ?? 0} tahun`, href: undefined },
                    ].map((c) => {
                      const inner = (
                        <>
                          <span className="grad-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><c.icon size={15} /></span>
                          <span className="min-w-0"><span className="block text-[11px] font-semibold tracking-wider text-white/40 uppercase">{c.label}</span><span className="block truncate text-[13px] font-medium text-white/85">{c.value}</span></span>
                        </>
                      );
                      return c.href
                        ? <a key={c.label} href={c.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-indigo-400/40">{inner}</a>
                        : <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">{inner}</div>;
                    })}
                  </div>
                </motion.div>
              </div>
            </section>

            <section id="skills" className="scroll-mt-24 border-y border-white/10 bg-white/[0.015] py-20">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead index="02" eyebrow="Keahlian" title={<>Hard skills <span className="grad-text">& soft power</span></>} desc="Tingkat kemahiran dikelola dinamis dari dashboard admin." />
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-card/60 p-6 sm:p-7">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-display flex items-center gap-2 text-base font-bold"><Code2 size={17} className="text-indigo-400" /> Hard Skills</h3>
                      <span className="rounded-full bg-indigo-400/10 px-3 py-1 font-mono text-[11px] text-indigo-300">{hard.length} skills</span>
                    </div>
                    {hard.length === 0 ? <EmptyState title="Belum ada hard skills" /> : (
                      <div className="flex flex-col gap-4">
                        {hard.map((s, i) => (
                          <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                            <div className="mb-1.5 flex items-center justify-between text-[13px]">
                              <span className="font-semibold text-white/85">{s.name}</span>
                              <span className="font-mono text-xs text-indigo-300">{s.level}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.level}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 }} className="grad-bg h-full rounded-full" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-card/60 p-6 sm:p-7">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-display flex items-center gap-2 text-base font-bold"><Sparkles size={17} className="text-pink-400" /> Soft Skills</h3>
                      <span className="rounded-full bg-pink-400/10 px-3 py-1 font-mono text-[11px] text-pink-300">{soft.length} skills</span>
                    </div>
                    {soft.length === 0 ? <EmptyState title="Belum ada soft skills" /> : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {soft.map((s, i) => (
                          <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.4) }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm font-bold text-white/90">{s.name}</p>
                            {s.description && <p className="mt-1 text-xs leading-relaxed text-white/50">{s.description}</p>}
                            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.level}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-400" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section id="pengalaman" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-20 sm:px-6">
              <SectionHead index="03" eyebrow="Perjalanan Karier" title={<>Pengalaman <span className="grad-text">kerja</span></>} />
              {experiences.length === 0 ? <EmptyState title="Belum ada pengalaman" /> : (
                <div className="relative pl-8 sm:pl-10">
                  <div className="timeline-line absolute top-1 bottom-1 left-[9px] w-[2px] rounded-full opacity-70 sm:left-[11px]" />
                  <div className="flex flex-col gap-5">
                    {experiences.map((e, i) => (
                      <motion.article key={e.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45 }} className="relative">
                        <span className={`absolute top-6 -left-8 flex h-5 w-5 items-center justify-center rounded-full border-2 sm:-left-10 ${e.is_current ? 'border-emerald-400 bg-emerald-400/20' : 'border-indigo-400 bg-ink'}`}>
                          <span className={`h-2 w-2 rounded-full ${e.is_current ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                        </span>
                        <div className="grad-border rounded-3xl bg-card/70 p-5 sm:p-6">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-base font-bold text-white sm:text-lg">{e.position}</h3>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-indigo-300">
                                <Building2 size={13} /> {e.company}
                                {e.location && <span className="text-white/40">• {e.location}</span>}
                              </p>
                            </div>
                            {e.is_current
                              ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-300">Saat ini</span>
                              : <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-white/50">#{String(i + 1).padStart(2, '0')}</span>}
                          </div>
                          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-white/45">
                            <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatPeriod(e.start_period)} — {e.is_current ? 'Sekarang' : formatPeriod(e.end_period) || '?'}</span>
                            {e.employment_type && <span className="rounded-full border border-white/10 px-2 py-0.5">{e.employment_type}</span>}
                          </p>
                          {e.description && <p className="mt-3 text-[13px] leading-relaxed text-white/60">{e.description}</p>}
                          {Array.isArray(e.responsibilities) && e.responsibilities.length > 0 && (
                            <ul className="mt-3 flex flex-col gap-1.5">
                              {e.responsibilities.map((r, j) => (
                                <li key={j} className="flex items-start gap-2 text-[13px] leading-relaxed text-white/60">
                                  <BadgeCheck size={14} className="mt-0.5 shrink-0 text-indigo-400" /> {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section id="proyek" className="scroll-mt-24 border-y border-white/10 bg-white/[0.015] py-20">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead index="04" eyebrow="Portofolio" title={<>Proyek <span className="grad-text">pilihan</span></>} desc="Cari dan filter berdasarkan kategori atau teknologi." />
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === c ? 'grad-bg text-white shadow-lg shadow-indigo-500/30' : 'border border-white/10 bg-white/[0.04] text-white/60 hover:text-white'}`}>{c}</button>
                    ))}
                  </div>
                  <div className="relative lg:w-72">
                    <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-white/35" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari proyek atau teknologi..." className="field-input pl-10" />
                  </div>
                </div>
                {filteredProjects.length === 0 ? <EmptyState title="Tidak ada proyek ditemukan" subtitle="Coba kata kunci atau kategori lain." /> : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((p, i) => (
                      <motion.article key={p.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, delay: Math.min((i % 3) * 0.08, 0.2) }} className="group grad-border cursor-pointer overflow-hidden rounded-3xl bg-card/80" onClick={() => setActiveProject(p)}>
                        <div className="relative overflow-hidden">
                          {p.image_url
                            ? <img src={p.image_url} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <div className="grad-bg aspect-[16/10] w-full opacity-60" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                          {p.featured && <span className="grad-bg absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"><Star size={10} /> FEATURED</span>}
                          {p.category && <span className="glass absolute top-3 right-3 rounded-full px-2.5 py-1 font-mono text-[10px] text-white/80">{p.category}</span>}
                        </div>
                        <div className="p-5">
                          <h3 className="font-display text-[15px] leading-snug font-bold transition group-hover:text-indigo-200">{p.title}</h3>
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/55">{p.description}</p>
                          {(p.tags?.length ?? 0) > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(p.tags || []).slice(0, 4).map((t) => (
                                <span key={t} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] text-indigo-200/80">{t}</span>
                              ))}
                            </div>
                          )}
                          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">Lihat Detail <ArrowUpRight size={14} /></span>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section id="sertifikat" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
              <SectionHead index="05" eyebrow="Kredensial" title={<>Sertifikat <span className="grad-text">& lisensi</span></>} />
              {certificates.length === 0 ? <EmptyState title="Belum ada sertifikat" /> : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {certificates.map((c, i) => (
                    <motion.article key={c.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, delay: Math.min((i % 3) * 0.08, 0.2) }} className="grad-border rounded-3xl bg-card/70 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grad-bg flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/25"><Award size={19} /></span>
                        {c.credential_url && (
                          <a href={c.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-indigo-400/50 hover:text-white">
                            Kredensial <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <h3 className="font-display mt-4 text-[15px] leading-snug font-bold">{c.title}</h3>
                      <p className="mt-1 text-xs font-medium text-indigo-300">{c.issuer}</p>
                      {c.description && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-white/55">{c.description}</p>}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 font-mono text-[11px] text-white/45">
                        {c.issue_date && <span className="inline-flex items-center gap-1"><Calendar size={11} /> {formatDateID(c.issue_date)}</span>}
                        {c.credential_id && <span className="rounded bg-white/5 px-2 py-0.5">ID: {c.credential_id}</span>}
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>

            <section id="kontak" className="scroll-mt-24 border-t border-white/10 bg-white/[0.015] py-20">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead index="06" eyebrow="Kontak" title={<>Mari bangun sesuatu yang <span className="grad-text">hebat</span></>} desc="Punya proyek, tawaran kerja, atau sekadar menyapa? Pesan Anda langsung masuk ke inbox dashboard admin." />
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: Mail, label: 'Email', value: profile?.email || '-', href: profile?.email ? `mailto:${profile.email}` : undefined },
                      { icon: Phone, label: 'Telepon / WA', value: profile?.phone || '-', href: undefined },
                      { icon: MapPin, label: 'Lokasi', value: profile?.location || '-', href: undefined },
                    ].map((c) => {
                      const inner = (
                        <>
                          <span className="grad-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"><c.icon size={16} /></span>
                          <span><span className="block text-[11px] font-semibold tracking-wider text-white/40 uppercase">{c.label}</span><span className="block text-sm font-semibold text-white/90">{c.value}</span></span>
                        </>
                      );
                      return c.href
                        ? <a key={c.label} href={c.href} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-card/70 p-4 transition hover:border-indigo-400/40">{inner}</a>
                        : <div key={c.label} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-card/70 p-4">{inner}</div>;
                    })}
                    {socials.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
                        <p className="mb-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase">Media Sosial</p>
                        <div className="flex flex-wrap gap-2">
                          {socials.map((s) => (
                            <a key={s.key} href={s.url} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/65 capitalize transition hover:border-indigo-400/50 hover:text-white" title={s.key}>
                              <s.icon size={16} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grad-border flex items-center gap-3 rounded-2xl bg-card/70 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Cpu size={17} /></span>
                      <p className="text-xs leading-relaxed text-white/60">Rata-rata merespons dalam <span className="font-bold text-white">1x24 jam</span> pada hari kerja.</p>
                    </div>
                  </div>
                  <form onSubmit={submitContact} className="grad-border rounded-3xl bg-card/70 p-6 sm:p-7">
                    <h3 className="font-display text-lg font-bold">Kirim pesan</h3>
                    <p className="mt-1 text-xs text-white/50">Formulir tersimpan ke database dan muncul di Inbox admin.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div><span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">Nama *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" className="field-input" maxLength={120} /></div>
                      <div><span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">Email *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" className="field-input" maxLength={160} /></div>
                    </div>
                    <div className="mt-4"><span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">Subjek</span><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Contoh: Tawaran proyek website" className="field-input" maxLength={200} /></div>
                    <div className="mt-4"><span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">Pesan *</span><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Ceritakan kebutuhan Anda..." rows={5} className="field-input resize-none" maxLength={5000} /></div>
                    <button type="submit" disabled={sending} className="grad-bg mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-xl shadow-indigo-500/25 transition hover:opacity-95 disabled:opacity-50 sm:w-auto">
                      <Send size={15} /> {sending ? 'Mengirim...' : 'Kirim Pesan'}
                    </button>
                  </form>
                </div>
              </div>
            </section>

            <footer className="border-t border-white/10 py-10">
              <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
                <p className="font-display text-lg font-bold">{name}<span className="grad-text">.dev</span></p>
                <div className="flex gap-2">
                  {socials.map((s) => (
                    <a key={s.key} href={s.url} target="_blank" rel="noreferrer" aria-label={s.key} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:text-white"><s.icon size={15} /></a>
                  ))}
                </div>
                <p className="text-xs text-white/35">© 2026 {name}. Dibangun dengan React, Tailwind & Supabase — dikelola via CMS Admin.</p>
              </div>
            </footer>
          </>
        )}
      </main>

      {activeProject && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setActiveProject(null)}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="glass max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl">
            {activeProject.image_url && <img src={activeProject.image_url} alt={activeProject.title} className="aspect-[16/8] w-full object-cover" />}
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {activeProject.category && <span className="font-mono text-[11px] tracking-widest text-indigo-300 uppercase">{activeProject.category}</span>}
                  <h3 className="font-display mt-1 text-xl font-bold sm:text-2xl">{activeProject.title}</h3>
                </div>
                <button onClick={() => setActiveProject(null)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white" aria-label="Tutup"><X size={16} /></button>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-white/65">{activeProject.description}</p>
              {(activeProject.tags?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(activeProject.tags || []).map((t) => (
                    <span key={t} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-indigo-200/85">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {activeProject.demo_url && <a href={activeProject.demo_url} target="_blank" rel="noreferrer" className="grad-bg inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold"><ExternalLink size={14} /> Live Demo</a>}
                {activeProject.repo_url && <a href={activeProject.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[13px] font-semibold hover:border-white/30"><Github size={14} /> Source Code</a>}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}