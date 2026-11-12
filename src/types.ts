export interface Socials {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  dribbble?: string;
  website?: string;
}

export interface Profile {
  id: number;
  full_name: string | null;
  headline: string | null;
  about: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  availability: string | null;
  years_experience: number | null;
  resume_url: string | null;
  socials: Socials | null;
  updated_at?: string | null;
}

export interface Experience {
  id: number;
  position: string;
  company: string;
  location: string | null;
  employment_type: string | null;
  start_period: string | null;
  end_period: string | null;
  is_current: boolean;
  description: string | null;
  responsibilities: string[] | null;
  sort_order?: number | null;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  image_url?: string | null;
  demo_url: string | null;
  repo_url: string | null;
  tags: string[] | null;
  featured: boolean;
  sort_order?: number | null;
  created_at?: string;
}

export interface Certificate {
  id: number;
  title: string;
  issuer: string;
  issue_date: string | null;
  description: string | null;
  credential_url: string | null;
  credential_id: string | null;
  image_url?: string | null;
  created_at?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: 'hard' | 'soft';
  level: number;
  description: string | null;
  sort_order?: number | null;
  created_at?: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
