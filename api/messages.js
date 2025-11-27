const messages = [];

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const gameId = req.query.game || 'global';
    
    if (req.method === 'POST') {
        const { user, userId, msg } = req.body;
        
        const message = {
            user: user || 'Unknown',
            userId: userId || 0,
            msg: msg || '',
            time: Date.now(),
            game: gameId
        };
        
        messages.push(message);
        
        // храним последние 200 сообщений
        while (messages.length > 200) {
            messages.shift();
        }
        
        return res.json({ success: true });
    }
    
    if (req.method === 'GET') {
        const after = parseInt(req.query.after) || 0;
        
        const filtered = messages.filter(m => 
            m.game === gameId && m.time > after
        );
        
        return res.json({ messages: filtered });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
