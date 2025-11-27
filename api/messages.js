export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const UPSTASH_URL = process.env.UPSTASH_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;
    
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        return res.status(500).json({ error: 'Missing env vars' });
    }
    
    const key = 'chat:global';
    
    try {
        if (req.method === 'POST') {
            const { user, userId, msg } = req.body || {};
            
            const message = {
                user: user || 'Unknown',
                userId: userId || 0,
                msg: msg || '',
                time: Date.now()
            };
            

            const getRes = await fetch(`${UPSTASH_URL}/get/${key}`, {
                headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
            });
            const getData = await getRes.json();
            
            let messages = [];
            if (getData.result) {
                messages = JSON.parse(getData.result);
            }
            
            messages.push(message);
            
            while (messages.length > 500) {
                messages.shift();
            }
            

            await fetch(`${UPSTASH_URL}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${UPSTASH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(['SET', key, JSON.stringify(messages)])
            });
            
            return res.status(200).json({ success: true });
        }
        
        if (req.method === 'GET') {
            const after = parseInt(req.query.after) || 0;
            
            const getRes = await fetch(`${UPSTASH_URL}/get/${key}`, {
                headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
            });
            const getData = await getRes.json();
            
            let messages = [];
            if (getData.result) {
                messages = JSON.parse(getData.result);
            }
            
            const filtered = messages.filter(m => m.time > after);
            
            return res.status(200).json({ messages: filtered });
        }
        
        return res.status(200).json({ error: 'Unknown method' });
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
