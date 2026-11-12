import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('certificates').select('*').order('issue_date', { ascending: false }).order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.title || !body.issuer) return res.status(400).json({ error: 'Judul dan penerbit wajib diisi' });
      const { data, error } = await supabase.from('certificates').insert({
        title: body.title, issuer: body.issuer, issue_date: body.issue_date || null,
        description: body.description || null, credential_url: body.credential_url || null,
        credential_id: body.credential_id || null, image_url: body.image_url || null,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.id) return res.status(400).json({ error: 'ID wajib diisi' });
      const patch = {};
      ['title','issuer','issue_date','description','credential_url','credential_id','image_url'].forEach(k => { if (body[k] !== undefined) patch[k] = body[k]; });
      const { data, error } = await supabase.from('certificates').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await supabase.from('certificates').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API certificates error:', err);
    return res.status(500).json({ error: err.message });
  }
}
