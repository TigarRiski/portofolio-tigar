import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.name || !body.email || !body.message) return res.status(400).json({ error: 'Nama, email, dan pesan wajib diisi' });
      const { data, error } = await supabase.from('messages').insert({
        name: String(body.name).slice(0, 120), email: String(body.email).slice(0, 160),
        subject: body.subject ? String(body.subject).slice(0, 200) : null,
        message: String(body.message).slice(0, 5000), is_read: false,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.id) return res.status(400).json({ error: 'ID wajib diisi' });
      const patch = {};
      if (body.is_read !== undefined) patch.is_read = !!body.is_read;
      const { data, error } = await supabase.from('messages').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API messages error:', err);
    return res.status(500).json({ error: err.message });
  }
}
