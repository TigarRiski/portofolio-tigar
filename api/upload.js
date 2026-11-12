import supabase from './db-client.js';

const BUCKET = 'portfolio-media';

function sanitize(name) {
  return String(name || 'upload.bin').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 120);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { fileName, fileBase64, contentType } = body;
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'File wajib diisi' });
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'Ukuran file maksimal 6MB' });
    const safe = sanitize(fileName);
    const path = `${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: contentType || 'application/octet-stream', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl, path });
  } catch (err) {
    console.error('API upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
