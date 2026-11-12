import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const payload = {
        id: 1,
        full_name: body.full_name ?? null,
        headline: body.headline ?? null,
        about: body.about ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        location: body.location ?? null,
        avatar_url: body.avatar_url ?? null,
        availability: body.availability ?? null,
        years_experience: body.years_experience ?? 0,
        resume_url: body.resume_url ?? null,
        socials: body.socials ?? {},
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('profile')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API profile error:', err);
    return res.status(500).json({ error: err.message });
  }
}
