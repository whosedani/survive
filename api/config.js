export default async function handler(req, res) {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;
    const ADMIN_HASH = process.env.ADMIN_HASH;
    const KEY = 'survive:config';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();

    async function kvGet() {
        const r = await fetch(`${KV_URL}/get/${KEY}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const data = await r.json();
        const raw = data.result || data.value;
        if (!raw) return {};
        try { return JSON.parse(raw); } catch { return {}; }
    }

    async function kvSet(val) {
        await fetch(`${KV_URL}/set/${KEY}/${encodeURIComponent(JSON.stringify(val))}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
    }

    function getAuth(r) {
        const h = r.headers.authorization || '';
        return h.startsWith('Bearer ') ? h.slice(7) : null;
    }

    try {
        if (req.method === 'GET') {
            const cfg = await kvGet();
            const auth = getAuth(req);
            if (auth && auth !== ADMIN_HASH) {
                return res.status(401).json({ error: 'unauthorized' });
            }
            return res.status(200).json(cfg);
        }

        if (req.method === 'POST') {
            const auth = getAuth(req);
            if (!auth || auth !== ADMIN_HASH) {
                return res.status(401).json({ error: 'unauthorized' });
            }
            const body = req.body || {};
            const current = await kvGet();
            const updated = { ...current, ...body };
            await kvSet(updated);
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'method not allowed' });
    } catch {
        return res.status(500).json({ error: 'internal error' });
    }
}
