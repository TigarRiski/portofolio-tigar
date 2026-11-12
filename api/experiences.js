import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('experiences').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.position || !body.company) return res.status(400).json({ error: 'Posisi dan perusahaan wajib diisi' });
      const { data, error } = await supabase.from('experiences').insert({
        position: body.position, company: body.company, location: body.location || null,
        employment_type: body.employment_type || 'Full-time', start_period: body.start_period || null,
        end_period: body.end_period || null, is_current: !!body.is_current,
        description: body.description || null,
        responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
        sort_order: body.sort_order ?? 0,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.id) return res.status(400).json({ error: 'ID wajib diisi' });
      const patch = {};
      ['position','company','location','employment_type','start_period','end_period','description'].forEach(k => { if (body[k] !== undefined) patch[k] = body[k]; });
      if (body.is_current !== undefined) patch.is_current = !!body.is_current;
      if (body.responsibilities !== undefined) patch.responsibilities = Array.isArray(body.responsibilities) ? body.responsibilities : [];
      if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
      const { data, error } = await supabase.from('experiences').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await supabase.from('experiences').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API experiences error:', err);
    return res.status(500).json({ error: err.message });
  }
}
