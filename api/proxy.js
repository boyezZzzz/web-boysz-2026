// Vercel Serverless Function — /api/proxy
// Support GET dan POST ke API eksternal tanpa CORS masalah

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: /api/proxy?url=https://...
  // POST: /api/proxy?url=https://... + body JSON
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter url diperlukan' });
  }

  const allowed = [
    'api.betabotz.eu.org',
    'api-nanzz.my.id',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  if (!allowed.some(d => parsedUrl.hostname === d)) {
    return res.status(403).json({ error: 'Domain tidak diizinkan' });
  }

  try {
    const fetchOptions = {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebProxy/1.0)',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    };

    // Teruskan body jika POST
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
    }    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || 'application/json';
    const text = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (err) {
    console.error('[proxy]', err.message);
    res.status(502).json({ error: 'Gagal mengambil data', detail: err.message });
  }
}
