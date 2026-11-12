import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('projects').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.title) return res.status(400).json({ error: 'Judul proyek wajib diisi' });
      const { data, error } = await supabase.from('projects').insert({
        title: body.title, category: body.category || 'Web App', description: body.description || null,
        image_url: body.image_url || null, demo_url: body.demo_url || null, repo_url: body.repo_url || null,
        tags: Array.isArray(body.tags) ? body.tags : [], featured: !!body.featured, sort_order: body.sort_order ?? 0,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.id) return res.status(400).json({ error: 'ID wajib diisi' });
      const patch = {};
      ['title','category','description','image_url','demo_url','repo_url'].forEach(k => { if (body[k] !== undefined) patch[k] = body[k]; });
      if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags : [];
      if (body.featured !== undefined) patch.featured = !!body.featured;
      if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
      const { data, error } = await supabase.from('projects').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API projects error:', err);
    return res.status(500).json({ error: err.message });
  }
}
