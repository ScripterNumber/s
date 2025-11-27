const UPSTASH_URL = process.env.UPSTASH_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;

async function redis(command, ...args) {
    const response = await fetch(`${UPSTASH_URL}/${command}/${args.join('/')}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const data = await response.json();
    return data.result;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const key = 'chat:global';
    
    if (req.method === 'POST') {
        const { user, userId, msg } = req.body || {};
        
        const message = {
            user: user || 'Unknown',
            userId: userId || 0,
            msg: msg || '',
            time: Date.now()
        };
        
        const raw = await redis('get', key);
        let messages = raw ? JSON.parse(raw) : [];
        
        messages.push(message);
        
        while (messages.length > 500) {
            messages.shift();
        }
        
        await redis('set', key, encodeURIComponent(JSON.stringify(messages)));
        
        return res.status(200).json({ success: true });
    }
    
    if (req.method === 'GET') {
        const after = parseInt(req.query.after) || 0;
        
        const raw = await redis('get', key);
        const messages = raw ? JSON.parse(raw) : [];
        
        const filtered = messages.filter(m => m.time > after);
        
        return res.status(200).json({ messages: filtered });
    }
    
    return res.status(200).json({ error: 'Unknown method' });
}
