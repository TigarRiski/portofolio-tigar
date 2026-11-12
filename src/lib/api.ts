import { supabase } from './supabase';
import type { Certificate, Experience, Message, Profile, Project, Skill } from '../types';

// --- PROFIL ---
export async function apiGetProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Gagal memuat profil:', error);
    return null;
  }
  return data;
}

export async function apiUpdateProfile(payload: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', 1)
    .select()
    .single();
  
  if (error) {
    // Jika baris dengan id=1 belum ada, lakukan insert
    const { data: insData, error: insError } = await supabase
      .from('profiles')
      .insert([{ id: 1, ...payload }])
      .select()
      .single();
    if (insError) throw new Error(insError.message);
    return insData;
  }
  return data;
}

// --- PENGALAMAN (EXPERIENCES) ---
export async function apiGetExperiences(): Promise<Experience[]> {
  const { data, error } = await supabase.from('experiences').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateExperience(payload: Omit<Experience, 'id'>): Promise<Experience> {
  const { data, error } = await supabase.from('experiences').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateExperience(payload: Experience): Promise<Experience> {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from('experiences').update(rest).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteExperience(id: number): Promise<void> {
  const { error } = await supabase.from('experiences').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- PROYEK (PROJECTS) ---
export async function apiGetProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateProject(payload: Omit<Project, 'id'>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateProject(payload: Project): Promise<Project> {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from('projects').update(rest).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteProject(id: number): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- SERTIFIKAT (CERTIFICATES) ---
export async function apiGetCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase.from('certificates').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateCertificate(payload: Omit<Certificate, 'id'>): Promise<Certificate> {
  const { data, error } = await supabase.from('certificates').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateCertificate(payload: Certificate): Promise<Certificate> {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from('certificates').update(rest).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteCertificate(id: number): Promise<void> {
  const { error } = await supabase.from('certificates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- SKILLS ---
export async function apiGetSkills(): Promise<Skill[]> {
  const { data, error } = await supabase.from('skills').select('*').order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateSkill(payload: Omit<Skill, 'id'>): Promise<Skill> {
  const { data, error } = await supabase.from('skills').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateSkill(payload: Skill): Promise<Skill> {
  const { id, ...rest } = payload;
  const { data, error } = await supabase.from('skills').update(rest).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteSkill(id: number): Promise<void> {
  const { error } = await supabase.from('skills').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- INBOX (MESSAGES) ---
export async function apiGetMessages(): Promise<Message[]> {
  const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiSendMessage(payload: { name: string; email: string; subject?: string; message: string }): Promise<Message> {
  const { data, error } = await supabase.from('messages').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiMarkMessage(id: number, is_read: boolean): Promise<Message> {
  const { data, error } = await supabase.from('messages').update({ is_read }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteMessage(id: number): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- UPLOAD GAMBAR KE SUPABASE STORAGE ---
export async function apiUploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Gagal mengunggah gambar: ' + uploadError.message);
  }

  const { data } = supabase.storage
    .from('portfolio')
    .getPublicUrl(filePath);

  return data.publicUrl;
}