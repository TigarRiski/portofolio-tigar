import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('skills').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.name) return res.status(400).json({ error: 'Nama skill wajib diisi' });
      const lvl = Math.max(0, Math.min(100, parseInt(body.level ?? 80, 10) || 0));
      const { data, error } = await supabase.from('skills').insert({
        name: body.name, category: body.category === 'soft' ? 'soft' : 'hard',
        level: lvl, description: body.description || null, sort_order: body.sort_order ?? 0,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.id) return res.status(400).json({ error: 'ID wajib diisi' });
      const patch = {};
      if (body.name !== undefined) patch.name = body.name;
      if (body.category !== undefined) patch.category = body.category === 'soft' ? 'soft' : 'hard';
      if (body.level !== undefined) patch.level = Math.max(0, Math.min(100, parseInt(body.level, 10) || 0));
      if (body.description !== undefined) patch.description = body.description;
      if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
      const { data, error } = await supabase.from('skills').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API skills error:', err);
    return res.status(500).json({ error: err.message });
  }
}
