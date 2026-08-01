import { put } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
const CAMINHO = 'glicocare/mae_87ea217ed9eae28de1.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }
  try {
    const corpo = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    await put(CAMINHO, JSON.stringify({ ts: Date.now(), dados: corpo.dados || [], cfg: corpo.cfg || null }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      token: TOKEN,
    });
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
}
