const { db } = require('./firebase-admin');

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    try {
        if (!db) {
            console.error('[API Chat Error]: Firestore database not initialized.');
            return sendJson(res, 500, { success: false, error: 'Database connection error. Missing Firebase credentials.' });
        }

        const chatRef = db.collection('chatMessages');

        if (req.method === 'GET') {
            const snapshot = await chatRef.orderBy('createdAt', 'asc').get();
            let results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            if (results.length === 0) {
                const welcomeMsg = {
                    id: '1',
                    senderType: 'SYSTEM',
                    senderName: 'LAZAROPH Bot',
                    message: 'Hello! Welcome to LAZAROPH Official Store. How can we help you today with your order or sizing?',
                    createdAt: new Date().toISOString()
                };
                results.push(welcomeMsg);
            }

            return sendJson(res, 200, { success: true, count: results.length, data: results });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
            if (!body.message || !body.message.trim()) {
                return sendJson(res, 400, { success: false, error: 'Message cannot be empty.' });
            }

            const timestamp = new Date().toISOString();
            const msgId = Date.now().toString();

            const msg = {
                id: msgId,
                senderType: body.senderType || 'CUSTOMER',
                senderName: body.senderName || 'Customer',
                senderEmail: body.senderEmail || '',
                message: body.message.trim(),
                createdAt: timestamp
            };

            await chatRef.doc(msgId).set(msg);

            // Auto-reply bot
            if (msg.senderType === 'CUSTOMER') {
                const lower = msg.message.toLowerCase();
                let autoReply = "Thank you for reaching out to LAZAROPH! An authentic customer specialist will assist you shortly.";
                if (lower.includes('track') || lower.includes('order')) {
                    autoReply = "To track your order, you can visit our Order Tracking page at /order-track or enter your order number (e.g. LZPH-20260825-0001).";
                } else if (lower.includes('salmon') || lower.includes('financing')) {
                    autoReply = "We offer Salmon Financing 0% interest installment plans at checkout for eligible purchases!";
                }

                const botMsgId = (Date.now() + 1).toString();
                const botMsg = {
                    id: botMsgId,
                    senderType: 'BOT',
                    senderName: 'LAZAROPH Assistant',
                    message: autoReply,
                    createdAt: new Date(Date.now() + 1000).toISOString()
                };
                await chatRef.doc(botMsgId).set(botMsg);
            }

            return sendJson(res, 201, { success: true, message: 'Message sent.', data: msg });
        }

        return sendJson(res, 405, { success: false, error: 'Method not allowed.' });

    } catch (err) {
        console.error('[API Chat Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
