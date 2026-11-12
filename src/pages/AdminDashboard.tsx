import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Award, Briefcase, CheckCircle2, Download, Eye, EyeOff,
  FolderKanban, Inbox, LayoutDashboard, Lock, LogOut, Mail, Pencil, Plus, Search,
  ShieldCheck, Trash2, Upload, User, Wrench,
} from 'lucide-react';
import type { Certificate, Experience, Message, Profile, Project, Skill } from '../types';
import {
  apiCreateCertificate, apiCreateExperience, apiCreateProject, apiCreateSkill,
  apiDeleteCertificate, apiDeleteExperience, apiDeleteMessage, apiDeleteProject, apiDeleteSkill,
  apiGetCertificates, apiGetExperiences, apiGetMessages, apiGetProfile, apiGetProjects, apiGetSkills,
  apiMarkMessage, apiUpdateCertificate, apiUpdateExperience, apiUpdateProfile, apiUpdateProject,
  apiUpdateSkill, apiUploadImage,
} from '../lib/api';
import { EmptyState, Field, Modal, Spinner, Toasts, formatDateID, useToasts } from '../components/ui';

type Tab = 'dashboard' | 'profile' | 'experience' | 'projects' | 'certificates' | 'skills' | 'inbox';

const PASS_KEY = 'cms_admin_pass';
const SESSION_KEY = 'cms_admin_auth';
const DEFAULT_PASS = 'admin123';
const getPass = () => localStorage.getItem(PASS_KEY) || DEFAULT_PASS;

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Data Diri', icon: User },
  { id: 'experience', label: 'Pengalaman', icon: Briefcase },
  { id: 'projects', label: 'Proyek', icon: FolderKanban },
  { id: 'certificates', label: 'Sertifikat', icon: Award },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
];

const TAB_META: Record<Tab, [string, string]> = {
  dashboard: ['Dashboard Overview', 'Semua konten tersinkron ke halaman publik secara instan.'],
  profile: ['Data Diri & Profil', 'Foto, nama, headline, bio, kontak & media sosial.'],
  experience: ['Kelola Pengalaman', 'CRUD riwayat pekerjaan & organisasi.'],
  projects: ['Kelola Proyek', 'CRUD portofolio: gambar, tautan, & tech tags.'],
  certificates: ['Kelola Sertifikat', 'CRUD lisensi & kredensial.'],
  skills: ['Kelola Skills', 'Hard skills & soft skills + level kemahiran.'],
  inbox: ['Inbox Pesan', 'Pesan dari formulir kontak publik.'],
};

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, notify } = useToasts();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saving, setSaving] = useState(false);

  const [pf, setPf] = useState({ full_name: '', headline: '', about: '', email: '', phone: '', location: '', avatar_url: '', availability: '', years_experience: 0, resume_url: '', github: '', linkedin: '', twitter: '', instagram: '', dribbble: '', website: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [expModal, setExpModal] = useState<{ open: boolean; editing: Experience | null }>({ open: false, editing: null });
  const [projModal, setProjModal] = useState<{ open: boolean; editing: Project | null }>({ open: false, editing: null });
  const [certModal, setCertModal] = useState<{ open: boolean; editing: Certificate | null }>({ open: false, editing: null });
  const [skillModal, setSkillModal] = useState<{ open: boolean; editing: Skill | null; preset: 'hard' | 'soft' }>({ open: false, editing: null, preset: 'hard' });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; label: string; action: () => Promise<void> }>({ open: false, label: '', action: async () => {} });
  const [inboxSearch, setInboxSearch] = useState('');
  const [openMsg, setOpenMsg] = useState<number | null>(null);
  const [newPass, setNewPass] = useState('');

  const unread = useMemo(() => messages.filter((m) => !m.is_read).length, [messages]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, e, pr, c, s, m] = await Promise.all([
        apiGetProfile(), apiGetExperiences(), apiGetProjects(), apiGetCertificates(), apiGetSkills(), apiGetMessages(),
      ]);
      setProfile(p);
      setExperiences(e);
      setProjects(pr);
      setCertificates(c);
      setSkills(s);
      setMessages(m);
      if (p) {
        const sc = (p.socials || {}) as Record<string, string>;
        setPf({
          full_name: p.full_name || '', headline: p.headline || '', about: p.about || '',
          email: p.email || '', phone: p.phone || '', location: p.location || '',
          avatar_url: p.avatar_url || '', availability: p.availability || '',
          years_experience: p.years_experience ?? 0, resume_url: p.resume_url || '',
          github: sc.github || '', linkedin: sc.linkedin || '', twitter: sc.twitter || '',
          instagram: sc.instagram || '', dribbble: sc.dribbble || '', website: sc.website || '',
        });
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authed) refresh(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === getPass()) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setLoginError('');
      setPass('');
    } else {
      setLoginError('Kata sandi salah. Coba lagi.');
    }
  };
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); };

  const askDelete = (label: string, action: () => Promise<void>) => setConfirmDelete({ open: true, label, action });
  const runDelete = async () => {
    try { await confirmDelete.action(); notify('success', 'Data berhasil dihapus.'); }
    catch (err) { notify('error', err instanceof Error ? err.message : 'Gagal menghapus'); }
    finally { setConfirmDelete({ open: false, label: '', action: async () => {} }); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pf.full_name.trim()) { notify('error', 'Nama lengkap wajib diisi.'); return; }
    setSaving(true);
    try {
      const updated = await apiUpdateProfile({
        full_name: pf.full_name.trim(), headline: pf.headline.trim(), about: pf.about,
        email: pf.email.trim(), phone: pf.phone.trim(), location: pf.location.trim(),
        avatar_url: pf.avatar_url.trim() || null, availability: pf.availability.trim(),
        years_experience: Number(pf.years_experience) || 0, resume_url: pf.resume_url.trim() || null,
        socials: { github: pf.github.trim(), linkedin: pf.linkedin.trim(), twitter: pf.twitter.trim(), instagram: pf.instagram.trim(), dribbble: pf.dribbble.trim(), website: pf.website.trim() },
      });
      setProfile(updated);
      notify('success', 'Profil berhasil disimpan & tampil di halaman publik.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally { setSaving(false); }
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('error', 'File harus berupa gambar.'); return; }
    setUploadingAvatar(true);
    try {
      const url = await apiUploadImage(file);
      setPf((p) => ({ ...p, avatar_url: url }));
      notify('success', 'Foto berhasil diunggah. Klik Simpan untuk menerapkan.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload gagal');
    } finally { setUploadingAvatar(false); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ profile, experiences, projects, certificates, skills, messages }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'portofolio-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const changePassword = () => {
    if (newPass.trim().length < 6) { notify('error', 'Kata sandi baru minimal 6 karakter.'); return; }
    localStorage.setItem(PASS_KEY, newPass.trim());
    setNewPass('');
    notify('success', 'Kata sandi admin berhasil diubah.');
  };

  const filteredInbox = useMemo(() => {
    const q = inboxSearch.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => `${m.name} ${m.email} ${m.subject || ''} ${m.message}`.toLowerCase().includes(q));
  }, [messages, inboxSearch]);

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="orb left-[-100px] top-[-80px] h-[380px] w-[380px] bg-indigo-600/60" />
          <div className="orb right-[-100px] bottom-[-100px] h-[380px] w-[380px] bg-pink-600/50" />
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass relative z-10 w-full max-w-md rounded-3xl p-7 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-white"><ArrowLeft size={13} /> Kembali ke portofolio</Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grad-bg flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/30"><Lock size={20} /></span>
            <div>
              <h1 className="font-display text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-white/50">Masuk untuk mengelola konten portofolio</p>
            </div>
          </div>
          <form onSubmit={doLogin} className="mt-6">
            <Field label="Kata Sandi Admin">
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className="field-input pr-11" autoFocus />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white" aria-label="Lihat sandi">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </Field>
            {loginError && <p className="mt-2.5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs text-rose-300">{loginError}</p>}
            <button type="submit" className="grad-bg mt-4 w-full rounded-2xl py-3 text-sm font-bold shadow-xl shadow-indigo-500/25 transition hover:opacity-95">Masuk Dashboard</button>
            <p className="mt-3 text-center font-mono text-[11px] text-white/35">Demo — kata sandi: <span className="text-indigo-300">admin123</span></p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white lg:flex">
      <div className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <span className="font-display text-sm font-bold">Admin<span className="grad-text">.panel</span></span>
        <div className="flex items-center gap-2">
          <Link to="/" className="rounded-full border border-white/10 bg-white/5 p-2.5" aria-label="Lihat situs"><Eye size={15} /></Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold">{sidebarOpen ? 'Tutup' : 'Menu'}</button>
        </div>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-panel/95 backdrop-blur-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 p-5">
          <img src={profile?.avatar_url || pf.avatar_url || AVATAR_FALLBACK} alt="avatar" className="h-10 w-10 rounded-2xl object-cover ring-2 ring-indigo-500/50" onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_FALLBACK; }} />
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold">{profile?.full_name || 'Admin'}</p>
            <p className="truncate text-[11px] text-white/45">Content Manager</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition ${tab === t.id ? 'grad-bg shadow-lg shadow-indigo-500/25' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <t.icon size={16} /> {t.label}
              {t.id === 'experience' && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px]">{experiences.length}</span>}
              {t.id === 'projects' && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px]">{projects.length}</span>}
              {t.id === 'certificates' && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px]">{certificates.length}</span>}
              {t.id === 'inbox' && unread > 0 && <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 font-mono text-[10px] font-bold">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="space-y-2 p-3">
          <Link to="/" className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-white/70 transition hover:text-white"><Eye size={15} /> Lihat Situs Publik</Link>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-2.5 text-[13px] font-semibold text-rose-300 transition hover:bg-rose-400/20"><LogOut size={15} /> Keluar</button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 hidden border-b border-white/10 bg-ink/80 backdrop-blur-xl lg:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="font-display text-lg font-bold">{TAB_META[tab][0]}</h1>
              <p className="text-xs text-white/45">{TAB_META[tab][1]}</p>
            </div>
            <button onClick={refresh} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition hover:text-white">Muat Ulang Data</button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-5 lg:hidden">
            <h1 className="font-display text-lg font-bold">{TAB_META[tab][0]}</h1>
            <p className="text-xs text-white/45">{TAB_META[tab][1]}</p>
          </div>

          {loading ? <Spinner label="Memuat data CMS..." /> : (
            <>
              {tab === 'dashboard' && (
                <DashboardTab
                  profile={profile} experiences={experiences} projects={projects}
                  certificates={certificates} skills={skills} messages={messages}
                  onGo={setTab} onExport={exportJSON}
                />
              )}

              {tab === 'profile' && (
                <form onSubmit={saveProfile} className="grid gap-5 xl:grid-cols-[1fr_320px]">
                  <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Nama Lengkap *"><input value={pf.full_name} onChange={(e) => setPf({ ...pf, full_name: e.target.value })} className="field-input" placeholder="Nama lengkap" /></Field>
                      <Field label="Headline Profesional"><input value={pf.headline} onChange={(e) => setPf({ ...pf, headline: e.target.value })} className="field-input" placeholder="cth: Senior Full-Stack Developer" /></Field>
                    </div>
                    <Field label="Ringkasan Tentang Saya"><textarea value={pf.about} onChange={(e) => setPf({ ...pf, about: e.target.value })} rows={5} className="field-input resize-none" placeholder="Ceritakan latar belakang, keahlian, dan nilai jual Anda..." /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Email"><input type="email" value={pf.email} onChange={(e) => setPf({ ...pf, email: e.target.value })} className="field-input" placeholder="nama@email.com" /></Field>
                      <Field label="Nomor Telepon"><input value={pf.phone} onChange={(e) => setPf({ ...pf, phone: e.target.value })} className="field-input" placeholder="+62 ..." /></Field>
                      <Field label="Lokasi"><input value={pf.location} onChange={(e) => setPf({ ...pf, location: e.target.value })} className="field-input" placeholder="Jakarta, Indonesia" /></Field>
                      <Field label="Status Ketersediaan"><input value={pf.availability} onChange={(e) => setPf({ ...pf, availability: e.target.value })} className="field-input" placeholder="Available for freelance..." /></Field>
                      <Field label="Tahun Pengalaman"><input type="number" min={0} max={60} value={pf.years_experience} onChange={(e) => setPf({ ...pf, years_experience: Number(e.target.value) })} className="field-input" /></Field>
                      <Field label="URL Resume / CV"><input value={pf.resume_url} onChange={(e) => setPf({ ...pf, resume_url: e.target.value })} className="field-input" placeholder="https://..." /></Field>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="mb-3 text-xs font-bold tracking-wider text-white/60 uppercase">Tautan Media Sosial</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(['github', 'linkedin', 'twitter', 'instagram', 'dribbble', 'website'] as const).map((k) => (
                          <Field key={k} label={k}><input value={pf[k]} onChange={(e) => setPf({ ...pf, [k]: e.target.value })} className="field-input font-mono text-xs" placeholder={`https://... (${k})`} /></Field>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="grad-bg rounded-2xl py-3 text-sm font-bold shadow-xl shadow-indigo-500/25 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
                  </div>
                  <div className="h-fit rounded-3xl border border-white/10 bg-card/60 p-5">
                    <p className="mb-3 text-xs font-bold tracking-wider text-white/60 uppercase">Foto Profil</p>
                    <img src={pf.avatar_url || AVATAR_FALLBACK} alt="preview" className="aspect-square w-full rounded-2xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_FALLBACK; }} />
                    <div className="mt-3"><Field label="URL Foto"><input value={pf.avatar_url} onChange={(e) => setPf({ ...pf, avatar_url: e.target.value })} className="field-input mt-1.5 font-mono text-xs" placeholder="https://..." /></Field></div>
                    <label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-3 text-xs font-bold text-white/70 transition hover:border-indigo-400/50 hover:text-white ${uploadingAvatar ? 'pointer-events-none opacity-50' : ''}`}>
                      <Upload size={14} /> {uploadingAvatar ? 'Mengunggah...' : 'Unggah Foto Baru'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
                    </label>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-[11px] leading-relaxed text-white/45">
                      Foto tersimpan di Supabase Storage dan langsung tampil di hero, halaman tentang, dan sidebar.
                    </div>
                  </div>
                </form>
              )}

              {tab === 'experience' && (
                <CrudList
                  addLabel="Tambah Pengalaman"
                  onAdd={() => setExpModal({ open: true, editing: null })}
                  emptyTitle="Belum ada pengalaman"
                  isEmpty={experiences.length === 0}
                  items={experiences.map((e) => (
                    <div key={e.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold">{e.position}</p>
                        <p className="mt-0.5 text-xs text-indigo-300">{e.company}{e.location ? ` • ${e.location}` : ''}</p>
                        <p className="mt-1 font-mono text-[11px] text-white/40">{e.start_period || '?'} — {e.is_current ? 'Sekarang' : e.end_period || '?'} {e.is_current && <span className="ml-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Aktif</span>}</p>
                      </div>
                      <RowActions
                        onEdit={() => setExpModal({ open: true, editing: e })}
                        onDelete={() => askDelete(`pengalaman "${e.position}"`, async () => { await apiDeleteExperience(e.id); setExperiences(await apiGetExperiences()); })}
                      />
                    </div>
                  ))}
                />
              )}

              {tab === 'projects' && (
                <CrudList
                  addLabel="Tambah Proyek"
                  onAdd={() => setProjModal({ open: true, editing: null })}
                  emptyTitle="Belum ada proyek"
                  isEmpty={projects.length === 0}
                  items={projects.map((p) => (
                    <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 sm:flex-row sm:items-center">
                      {p.image_url
                        ? <img src={p.image_url} alt="" className="h-16 w-full rounded-xl object-cover sm:w-24" />
                        : <div className="grad-bg h-16 w-full rounded-xl opacity-60 sm:w-24" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-display flex flex-wrap items-center gap-2 text-sm font-bold">{p.title}{p.featured && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">FEATURED</span>}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-white/40">{p.category || '-'} • {(p.tags || []).slice(0, 4).join(', ')}</p>
                      </div>
                      <RowActions
                        onEdit={() => setProjModal({ open: true, editing: p })}
                        onDelete={() => askDelete(`proyek "${p.title}"`, async () => { await apiDeleteProject(p.id); setProjects(await apiGetProjects()); })}
                      />
                    </div>
                  ))}
                />
              )}

              {tab === 'certificates' && (
                <CrudList
                  addLabel="Tambah Sertifikat"
                  onAdd={() => setCertModal({ open: true, editing: null })}
                  emptyTitle="Belum ada sertifikat"
                  isEmpty={certificates.length === 0}
                  items={certificates.map((c) => (
                    <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 sm:flex-row sm:items-center">
                      <span className="grad-bg flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"><Award size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold">{c.title}</p>
                        <p className="mt-0.5 text-xs text-indigo-300">{c.issuer} • {formatDateID(c.issue_date)}</p>
                      </div>
                      <RowActions
                        onEdit={() => setCertModal({ open: true, editing: c })}
                        onDelete={() => askDelete(`sertifikat "${c.title}"`, async () => { await apiDeleteCertificate(c.id); setCertificates(await apiGetCertificates()); })}
                      />
                    </div>
                  ))}
                />
              )}

              {tab === 'skills' && (
                <div className="flex flex-col gap-5">
                  <SkillGroup
                    title="Hard Skills" color="indigo" skills={skills.filter((s) => s.category !== 'soft')}
                    onAdd={() => setSkillModal({ open: true, editing: null, preset: 'hard' })}
                    onEdit={(s) => setSkillModal({ open: true, editing: s, preset: s.category })}
                    onDelete={(s) => askDelete(`skill "${s.name}"`, async () => { await apiDeleteSkill(s.id); setSkills(await apiGetSkills()); })}
                  />
                  <SkillGroup
                    title="Soft Skills" color="pink" skills={skills.filter((s) => s.category === 'soft')}
                    onAdd={() => setSkillModal({ open: true, editing: null, preset: 'soft' })}
                    onEdit={(s) => setSkillModal({ open: true, editing: s, preset: s.category })}
                    onDelete={(s) => askDelete(`skill "${s.name}"`, async () => { await apiDeleteSkill(s.id); setSkills(await apiGetSkills()); })}
                  />
                  <SecurityCard newPass={newPass} setNewPass={setNewPass} onChange={changePassword} onExport={exportJSON} />
                </div>
              )}

              {tab === 'inbox' && (
                <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold">Semua Pesan <span className="ml-1 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px]">{messages.length}</span>{unread > 0 && <span className="ml-1.5 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">{unread} belum dibaca</span>}</p>
                    <div className="relative sm:w-64">
                      <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/35" />
                      <input value={inboxSearch} onChange={(e) => setInboxSearch(e.target.value)} placeholder="Cari pesan..." className="field-input pl-9" />
                    </div>
                  </div>
                  {filteredInbox.length === 0 ? <EmptyState title="Tidak ada pesan" subtitle="Pesan dari formulir kontak publik akan muncul di sini." /> : (
                    <div className="flex flex-col gap-3">
                      {filteredInbox.map((m) => (
                        <div key={m.id} className={`rounded-2xl border p-4 transition ${m.is_read ? 'border-white/10 bg-white/[0.02]' : 'border-indigo-400/30 bg-indigo-400/[0.06]'}`}>
                          <button onClick={() => setOpenMsg(openMsg === m.id ? null : m.id)} className="flex w-full items-start justify-between gap-3 text-left">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">{m.name}{!m.is_read && <span className="h-2 w-2 rounded-full bg-indigo-400" />}</p>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-white/45">{m.email} • {formatDateID(m.created_at)}</p>
                              <p className="mt-1 text-xs font-semibold text-indigo-200/90">{m.subject || '(Tanpa subjek)'}</p>
                            </div>
                          </button>
                          {openMsg === m.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                              <p className="mt-3 rounded-xl bg-white/[0.04] p-3.5 text-[13px] leading-relaxed whitespace-pre-line text-white/70">{m.message}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Pesan Anda')}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold hover:bg-white/15"><Mail size={12} /> Balas Email</a>
                                <button onClick={async () => { await apiMarkMessage(m.id, !m.is_read); setMessages(await apiGetMessages()); }} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold hover:bg-white/15"><CheckCircle2 size={12} /> {m.is_read ? 'Tandai Belum Dibaca' : 'Tandai Dibaca'}</button>
                                <button onClick={() => askDelete(`pesan dari "${m.name}"`, async () => { await apiDeleteMessage(m.id); setMessages(await apiGetMessages()); })} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25"><Trash2 size={12} /> Hapus</button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ExperienceModal
        state={expModal} onClose={() => setExpModal({ open: false, editing: null })}
        notify={notify}
        onSaved={async () => { setExperiences(await apiGetExperiences()); }}
      />
      <ProjectModal
        state={projModal} onClose={() => setProjModal({ open: false, editing: null })}
        notify={notify}
        onSaved={async () => { setProjects(await apiGetProjects()); }}
      />
      <CertificateModal
        state={certModal} onClose={() => setCertModal({ open: false, editing: null })}
        notify={notify}
        onSaved={async () => { setCertificates(await apiGetCertificates()); }}
      />
      <SkillModal
        state={skillModal} onClose={() => setSkillModal({ open: false, editing: null, preset: 'hard' })}
        notify={notify}
        onSaved={async () => { setSkills(await apiGetSkills()); }}
      />

      <Modal open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, label: '', action: async () => {} })} title="Hapus Data?" subtitle="Tindakan ini tidak dapat dibatalkan.">
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3.5 text-[13px] text-rose-200">Anda akan menghapus {confirmDelete.label} secara permanen dari database.</p>
        <div className="mt-4 flex gap-2.5">
          <button onClick={() => setConfirmDelete({ open: false, label: '', action: async () => {} })} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold">Batal</button>
          <button onClick={runDelete} className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-sm font-bold hover:bg-rose-600">Ya, Hapus</button>
        </div>
      </Modal>

      <Toasts toasts={toasts} />
    </div>
  );
}

function DashboardTab({ profile, experiences, projects, certificates, skills, messages, onGo, onExport }: {
  profile: Profile | null; experiences: Experience[]; projects: Project[]; certificates: Certificate[]; skills: Skill[]; messages: Message[];
  onGo: (t: Tab) => void; onExport: () => void;
}) {
  const unread = messages.filter((m) => !m.is_read).length;
  const stats = [
    { icon: FolderKanban, label: 'Total Proyek', value: projects.length, tab: 'projects' as Tab, grad: 'from-indigo-500 to-violet-500' },
    { icon: Briefcase, label: 'Pengalaman', value: experiences.length, tab: 'experience' as Tab, grad: 'from-fuchsia-500 to-pink-500' },
    { icon: Award, label: 'Sertifikat', value: certificates.length, tab: 'certificates' as Tab, grad: 'from-amber-500 to-orange-500' },
    { icon: Inbox, label: 'Pesan Belum Dibaca', value: unread, tab: 'inbox' as Tab, grad: 'from-emerald-500 to-teal-500' },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onGo(s.tab)} className="group rounded-3xl border border-white/10 bg-card/60 p-5 text-left transition hover:border-white/20">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${s.grad} shadow-lg`}><s.icon size={18} /></span>
            <p className="font-display mt-3 text-3xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-white/50">{s.label}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">Pesan Terbaru</h3>
            <button onClick={() => onGo('inbox')} className="text-xs font-bold text-indigo-300 hover:text-indigo-200">Lihat Semua →</button>
          </div>
          {messages.length === 0 ? <EmptyState title="Belum ada pesan masuk" /> : (
            <div className="flex flex-col gap-2.5">
              {messages.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${m.is_read ? 'bg-white/10 text-white/50' : 'bg-indigo-500/20 text-indigo-200'}`}>{m.name.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{m.name}</p>
                    <p className="truncate text-xs text-white/45">{m.subject || m.message}</p>
                  </div>
                  {!m.is_read && <span className="shrink-0 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">Baru</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-bold">Profil Aktif</h3>
            <div className="flex items-center gap-3">
              <img src={profile?.avatar_url || AVATAR_FALLBACK} alt="" className="h-12 w-12 rounded-2xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_FALLBACK; }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{profile?.full_name || '-'}</p>
                <p className="truncate text-xs text-white/45">{profile?.headline || '-'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.04] p-2.5"><p className="font-display text-lg font-bold">{skills.filter((s) => s.category !== 'soft').length}</p><p className="text-[10px] text-white/45">Hard</p></div>
              <div className="rounded-xl bg-white/[0.04] p-2.5"><p className="font-display text-lg font-bold">{skills.filter((s) => s.category === 'soft').length}</p><p className="text-[10px] text-white/45">Soft</p></div>
              <div className="rounded-xl bg-white/[0.04] p-2.5"><p className="font-display text-lg font-bold">{projects.filter((p) => p.featured).length}</p><p className="text-[10px] text-white/45">Featured</p></div>
            </div>
            <button onClick={() => onGo('profile')} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold hover:bg-white/10">Edit Profil</button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-bold">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onGo('projects')} className="rounded-2xl bg-white/[0.05] p-3 text-left text-xs font-bold hover:bg-white/10"><Plus size={14} className="mb-1.5 text-indigo-300" /><br />Proyek Baru</button>
              <button onClick={() => onGo('experience')} className="rounded-2xl bg-white/[0.05] p-3 text-left text-xs font-bold hover:bg-white/10"><Plus size={14} className="mb-1.5 text-fuchsia-300" /><br />Pengalaman Baru</button>
              <button onClick={() => onGo('skills')} className="rounded-2xl bg-white/[0.05] p-3 text-left text-xs font-bold hover:bg-white/10"><Plus size={14} className="mb-1.5 text-emerald-300" /><br />Skill Baru</button>
              <button onClick={onExport} className="rounded-2xl bg-white/[0.05] p-3 text-left text-xs font-bold hover:bg-white/10"><Download size={14} className="mb-1.5 text-amber-300" /><br />Backup JSON</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrudList({ addLabel, onAdd, items, isEmpty, emptyTitle }: { addLabel: string; onAdd: () => void; items: React.ReactNode[]; isEmpty: boolean; emptyTitle: string }) {
  return (
    <div className="flex flex-col gap-3">
      <button onClick={onAdd} className="grad-bg flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold shadow-xl shadow-indigo-500/20 transition hover:opacity-95"><Plus size={16} /> {addLabel}</button>
      {isEmpty ? <EmptyState title={emptyTitle} /> : items}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold hover:border-indigo-400/40"><Pencil size={12} /> Edit</button>
      <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20"><Trash2 size={12} /> Hapus</button>
    </div>
  );
}

function SkillGroup({ title, color, skills, onAdd, onEdit, onDelete }: {
  title: string; color: 'indigo' | 'pink'; skills: Skill[];
  onAdd: () => void; onEdit: (s: Skill) => void; onDelete: (s: Skill) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">{title} <span className={`ml-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] ${color === 'indigo' ? 'bg-indigo-400/15 text-indigo-300' : 'bg-pink-400/15 text-pink-300'}`}>{skills.length}</span></h3>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold hover:bg-white/15"><Plus size={12} /> Tambah</button>
      </div>
      {skills.length === 0 ? <EmptyState title={`Belum ada ${title.toLowerCase()}`} /> : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white/[0.03] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold">{s.name}</p>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => onEdit(s)} className="rounded-lg bg-white/10 p-1.5 hover:bg-white/15" aria-label="Edit"><Pencil size={12} /></button>
                  <button onClick={() => onDelete(s)} className="rounded-lg bg-rose-500/15 p-1.5 text-rose-300 hover:bg-rose-500/25" aria-label="Hapus"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-violet-400' : 'bg-gradient-to-r from-fuchsia-500 to-pink-400'}`} style={{ width: `${s.level}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-white/40">{s.level}%{s.description ? ` • ${s.description}` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityCard({ newPass, setNewPass, onChange, onExport }: { newPass: string; setNewPass: (v: string) => void; onChange: () => void; onExport: () => void }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-6">
      <h3 className="font-display flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} className="text-emerald-400" /> Keamanan & Data</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Field label="Ubah Kata Sandi Admin">
            <div className="flex gap-2">
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" className="field-input" />
              <button onClick={onChange} className="shrink-0 rounded-xl bg-white/10 px-4 text-xs font-bold hover:bg-white/15">Ubah</button>
            </div>
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">Backup Data</span>
          <button onClick={onExport} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-xs font-bold hover:bg-white/15"><Download size={13} /> Unduh Backup JSON</button>
        </div>
      </div>
    </div>
  );
}

type Notify = (kind: 'success' | 'error', text: string) => void;

function ExperienceModal({ state, onClose, notify, onSaved }: {
  state: { open: boolean; editing: Experience | null }; onClose: () => void; notify: Notify; onSaved: () => Promise<void>;
}) {
  const ed = state.editing;
  const [f, setF] = useState({ position: '', company: '', location: '', employment_type: 'Full-time', start_period: '', end_period: '', is_current: false, description: '', responsibilities: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.open) {
      setF(ed ? {
        position: ed.position, company: ed.company, location: ed.location || '',
        employment_type: ed.employment_type || 'Full-time', start_period: ed.start_period || '',
        end_period: ed.end_period || '', is_current: ed.is_current, description: ed.description || '',
        responsibilities: (ed.responsibilities || []).join('\n'),
      } : { position: '', company: '', location: '', employment_type: 'Full-time', start_period: '', end_period: '', is_current: false, description: '', responsibilities: '' });
    }
  }, [state.open, ed]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.position.trim() || !f.company.trim()) { notify('error', 'Posisi dan perusahaan wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = {
        position: f.position.trim(), company: f.company.trim(), location: f.location.trim() || null,
        employment_type: f.employment_type, start_period: f.start_period || null,
        end_period: f.is_current ? null : (f.end_period || null), is_current: f.is_current,
        description: f.description || null,
        responsibilities: f.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      if (ed) await apiUpdateExperience({ id: ed.id, ...payload });
      else await apiCreateExperience(payload);
      await onSaved();
      onClose();
      notify('success', 'Pengalaman berhasil disimpan.');
    } catch (err) { notify('error', err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open={state.open} onClose={onClose} title={ed ? 'Edit Pengalaman' : 'Tambah Pengalaman'} subtitle="Posisi, perusahaan, periode & pencapaian." wide>
      <form onSubmit={save} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Posisi / Jabatan *"><input value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} className="field-input" placeholder="Senior Frontend Developer" /></Field>
          <Field label="Perusahaan / Organisasi *"><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="field-input" placeholder="PT Maju Bersama" /></Field>
          <Field label="Lokasi"><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className="field-input" placeholder="Jakarta / Remote" /></Field>
          <Field label="Tipe Pekerjaan">
            <select value={f.employment_type} onChange={(e) => setF({ ...f, employment_type: e.target.value })} className="field-input">
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Freelance</option><option>Internship</option>
            </select>
          </Field>
          <Field label="Periode Mulai"><input type="month" value={f.start_period} onChange={(e) => setF({ ...f, start_period: e.target.value })} className="field-input" /></Field>
          <Field label="Periode Selesai">
            <input type="month" value={f.end_period} onChange={(e) => setF({ ...f, end_period: e.target.value })} className="field-input" disabled={f.is_current} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-white/75">
          <input type="checkbox" checked={f.is_current} onChange={(e) => setF({ ...f, is_current: e.target.checked })} className="h-4 w-4 rounded" /> Saya masih bekerja di sini
        </label>
        <Field label="Deskripsi Pekerjaan"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className="field-input resize-none" placeholder="Gambaran umum peran dan tanggung jawab..." /></Field>
        <Field label="Pencapaian / Tanggung Jawab" hint="Satu poin per baris — tampil sebagai daftar checklist di halaman publik."><textarea value={f.responsibilities} onChange={(e) => setF({ ...f, responsibilities: e.target.value })} rows={4} className="field-input resize-none font-mono text-xs" placeholder="Memimpin tim 6 engineer" /></Field>
        <button type="submit" disabled={saving} className="grad-bg rounded-2xl py-3 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : ed ? 'Simpan Perubahan' : 'Tambah Pengalaman'}</button>
      </form>
    </Modal>
  );
}

function ProjectModal({ state, onClose, notify, onSaved }: {
  state: { open: boolean; editing: Project | null }; onClose: () => void; notify: Notify; onSaved: () => Promise<void>;
}) {
  const ed = state.editing;
  const [f, setF] = useState({ title: '', category: 'Web App', description: '', image_url: '', demo_url: '', repo_url: '', tags: '', featured: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (state.open) {
      setF(ed ? {
        title: ed.title, category: ed.category || 'Web App', description: ed.description || '',
        image_url: ed.image_url || '', demo_url: ed.demo_url || '', repo_url: ed.repo_url || '',
        tags: (ed.tags || []).join(', '), featured: ed.featured,
      } : { title: '', category: 'Web App', description: '', image_url: '', demo_url: '', repo_url: '', tags: '', featured: false });
    }
  }, [state.open, ed]);
  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('error', 'File harus berupa gambar.'); return; }
    setUploading(true);
    try { const url = await apiUploadImage(file); setF((p) => ({ ...p, image_url: url })); notify('success', 'Screenshot berhasil diunggah.'); }
    catch (err) { notify('error', err instanceof Error ? err.message : 'Upload gagal'); }
    finally { setUploading(false); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) { notify('error', 'Judul proyek wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: f.title.trim(), category: f.category.trim() || 'Web App', description: f.description || null,
        image_url: f.image_url.trim() || null, demo_url: f.demo_url.trim() || null, repo_url: f.repo_url.trim() || null,
        tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean), featured: f.featured,
      };
      if (ed) await apiUpdateProject({ id: ed.id, ...payload });
      else await apiCreateProject(payload);
      await onSaved();
      onClose();
      notify('success', 'Proyek berhasil disimpan.');
    } catch (err) { notify('error', err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open={state.open} onClose={onClose} title={ed ? 'Edit Proyek' : 'Tambah Proyek'} subtitle="Judul, kategori, deskripsi, visual, tautan & tech tags." wide>
      <form onSubmit={save} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul Proyek *"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="field-input" placeholder="Nama proyek" /></Field>
          <Field label="Kategori / Tipe">
            <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="field-input" list="cat-list" placeholder="Web App" />
            <datalist id="cat-list"><option value="Web App" /><option value="Mobile App" /><option value="E-Commerce" /><option value="AI / ML" /><option value="Dashboard" /><option value="Landing Page" /></datalist>
          </Field>
        </div>
        <Field label="Deskripsi Detail"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} className="field-input resize-none" placeholder="Fitur utama, tantangan, hasil..." /></Field>
        <Field label="Screenshot / Gambar">
          <input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} className="field-input font-mono text-xs" placeholder="https://... atau unggah di bawah" />
          <label className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] py-2.5 text-xs font-bold text-white/70 hover:border-indigo-400/50 hover:text-white ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload size={13} /> {uploading ? 'Mengunggah...' : 'Unggah Gambar'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          {f.image_url && <img src={f.image_url} alt="preview" className="mt-2 aspect-[16/9] w-full rounded-xl object-cover" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tautan Demo Live"><input value={f.demo_url} onChange={(e) => setF({ ...f, demo_url: e.target.value })} className="field-input font-mono text-xs" placeholder="https://demo..." /></Field>
          <Field label="Tautan Repository"><input value={f.repo_url} onChange={(e) => setF({ ...f, repo_url: e.target.value })} className="field-input font-mono text-xs" placeholder="https://github.com/..." /></Field>
        </div>
        <Field label="Tag Teknologi" hint="Pisahkan dengan koma. Contoh: React, Supabase, Tailwind"><input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} className="field-input font-mono text-xs" placeholder="React, Next.js, Supabase" /></Field>
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-white/75">
          <input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} className="h-4 w-4 rounded" /> Tandai sebagai Featured
        </label>
        <button type="submit" disabled={saving} className="grad-bg rounded-2xl py-3 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : ed ? 'Simpan Perubahan' : 'Tambah Proyek'}</button>
      </form>
    </Modal>
  );
}

function CertificateModal({ state, onClose, notify, onSaved }: {
  state: { open: boolean; editing: Certificate | null }; onClose: () => void; notify: Notify; onSaved: () => Promise<void>;
}) {
  const ed = state.editing;
  const [f, setF] = useState({ title: '', issuer: '', issue_date: '', description: '', credential_url: '', credential_id: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.open) {
      setF(ed ? {
        title: ed.title, issuer: ed.issuer, issue_date: (ed.issue_date || '').slice(0, 10),
        description: ed.description || '', credential_url: ed.credential_url || '', credential_id: ed.credential_id || '',
      } : { title: '', issuer: '', issue_date: '', description: '', credential_url: '', credential_id: '' });
    }
  }, [state.open, ed]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.issuer.trim()) { notify('error', 'Judul dan penerbit wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: f.title.trim(), issuer: f.issuer.trim(), issue_date: f.issue_date || null,
        description: f.description || null, credential_url: f.credential_url.trim() || null,
        credential_id: f.credential_id.trim() || null,
      };
      if (ed) await apiUpdateCertificate({ id: ed.id, ...payload });
      else await apiCreateCertificate(payload);
      await onSaved();
      onClose();
      notify('success', 'Sertifikat berhasil disimpan.');
    } catch (err) { notify('error', err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open={state.open} onClose={onClose} title={ed ? 'Edit Sertifikat' : 'Tambah Sertifikat'} subtitle="Judul, penerbit, tanggal & kredensial." wide>
      <form onSubmit={save} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul Sertifikasi *"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="field-input" placeholder="AWS Certified Solutions Architect" /></Field>
          <Field label="Penerbit / Kredensial *"><input value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} className="field-input" placeholder="Amazon Web Services" /></Field>
          <Field label="Tanggal Terbit"><input type="date" value={f.issue_date} onChange={(e) => setF({ ...f, issue_date: e.target.value })} className="field-input" /></Field>
          <Field label="ID Kredensial"><input value={f.credential_id} onChange={(e) => setF({ ...f, credential_id: e.target.value })} className="field-input font-mono text-xs" placeholder="cth: AWS-SA-88412" /></Field>
        </div>
        <Field label="Deskripsi Singkat"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className="field-input resize-none" placeholder="Kompetensi yang divalidasi sertifikasi ini..." /></Field>
        <Field label="File / Tautan Lisensi"><input value={f.credential_url} onChange={(e) => setF({ ...f, credential_url: e.target.value })} className="field-input font-mono text-xs" placeholder="https://... (URL verifikasi kredensial)" /></Field>
        <button type="submit" disabled={saving} className="grad-bg rounded-2xl py-3 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : ed ? 'Simpan Perubahan' : 'Tambah Sertifikat'}</button>
      </form>
    </Modal>
  );
}

function SkillModal({ state, onClose, notify, onSaved }: {
  state: { open: boolean; editing: Skill | null; preset: 'hard' | 'soft' }; onClose: () => void; notify: Notify; onSaved: () => Promise<void>;
}) {
  const ed = state.editing;
  const [f, setF] = useState({ name: '', category: 'hard' as 'hard' | 'soft', level: 80, description: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (state.open) {
      setF(ed ? { name: ed.name, category: ed.category, level: ed.level, description: ed.description || '' }
        : { name: '', category: state.preset, level: 80, description: '' });
    }
  }, [state.open, ed, state.preset]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { notify('error', 'Nama skill wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = { name: f.name.trim(), category: f.category, level: f.level, description: f.description || null };
      if (ed) await apiUpdateSkill({ id: ed.id, ...payload });
      else await apiCreateSkill(payload);
      await onSaved();
      onClose();
      notify('success', 'Skill berhasil disimpan.');
    } catch (err) { notify('error', err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };
  return (
    <Modal open={state.open} onClose={onClose} title={ed ? 'Edit Skill' : 'Tambah Skill'} subtitle="Hard skill atau soft skill + tingkat kemahiran.">
      <form onSubmit={save} className="grid gap-4">
        <Field label="Nama Skill *"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="field-input" placeholder="cth: React / Komunikasi" /></Field>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {(['hard', 'soft'] as const).map((c) => (
            <button type="button" key={c} onClick={() => setF({ ...f, category: c })} className={`rounded-xl py-2 text-xs font-bold capitalize transition ${f.category === c ? 'grad-bg shadow' : 'text-white/55 hover:text-white'}`}>{c === 'hard' ? 'Hard Skill' : 'Soft Skill'}</button>
          ))}
        </div>
        <Field label={`Tingkat Kemahiran — ${f.level}%`}>
          <input type="range" min={0} max={100} value={f.level} onChange={(e) => setF({ ...f, level: Number(e.target.value) })} className="w-full" />
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="grad-bg h-full rounded-full transition-all" style={{ width: `${f.level}%` }} />
          </div>
        </Field>
        <Field label="Deskripsi (opsional)" hint="Untuk soft skill: contoh konteks; untuk hard skill boleh dikosongkan."><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field-input" placeholder="cth: Memimpin tim hingga 8 engineer" /></Field>
        <button type="submit" disabled={saving} className="grad-bg rounded-2xl py-3 text-sm font-bold disabled:opacity-50">{saving ? 'Menyimpan...' : ed ? 'Simpan Perubahan' : 'Tambah Skill'}</button>
      </form>
    </Modal>
  );
}