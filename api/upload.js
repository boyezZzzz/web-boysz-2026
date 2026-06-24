// Vercel Serverless Function — /api/upload
// Proxy multipart upload ke catbox.moe

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '210mb',
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    // Baca raw body dari stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks);

    if (rawBody.length === 0) {
      return res.status(400).json({ error: 'Body kosong' });
    }

    const contentType = req.headers['content-type'] || '';

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'User-Agent': 'Mozilla/5.0 (compatible; UploadProxy/1.0)',
        'Content-Length': String(rawBody.length),
      },
      body: rawBody,
      signal: AbortSignal.timeout(60000),
    });

    const text = await response.text();
    // Catbox mengembalikan plain text URL atau error string
    res.setHeader('Content-Type', 'text/plain');
    res.status(response.status).send(text);

  } catch (err) {
    console.error('[upload]', err.message);
    res.status(502).json({ error: 'Gagal upload', detail: err.message });
  }
}
