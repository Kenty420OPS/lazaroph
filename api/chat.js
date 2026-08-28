/**
 * LAZAROPH — Vercel Serverless API: Live Customer Support Chat Handler
 */

let chatMessages = [
    {
        id: 1,
        senderType: 'SYSTEM',
        senderName: 'LAZAROPH Bot',
        message: 'Hello! Welcome to LAZAROPH Official Store. How can we help you today with your order or sizing?',
        createdAt: '2026-08-28T08:00:00.000Z'
    }
];

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

    if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, count: chatMessages.length, data: chatMessages });
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        if (!body.message || !body.message.trim()) {
            return sendJson(res, 400, { success: false, error: 'Message cannot be empty.' });
        }

        const msg = {
            id: Date.now(),
            senderType: body.senderType || 'CUSTOMER',
            senderName: body.senderName || 'Customer',
            senderEmail: body.senderEmail || '',
            message: body.message.trim(),
            createdAt: new Date().toISOString()
        };

        chatMessages.push(msg);

        // Auto-reply bot
        if (msg.senderType === 'CUSTOMER') {
            const lower = msg.message.toLowerCase();
            let autoReply = "Thank you for reaching out to LAZAROPH! An authentic customer specialist will assist you shortly.";
            if (lower.includes('track') || lower.includes('order')) {
                autoReply = "To track your order, you can visit our Order Tracking page at /order-track or enter your order number (e.g. LZPH-20260825-0001).";
            } else if (lower.includes('salmon') || lower.includes('financing')) {
                autoReply = "We offer Salmon Financing 0% interest installment plans at checkout for eligible purchases!";
            }

            chatMessages.push({
                id: Date.now() + 1,
                senderType: 'BOT',
                senderName: 'LAZAROPH Assistant',
                message: autoReply,
                createdAt: new Date().toISOString()
            });
        }

        return sendJson(res, 201, { success: true, message: 'Message sent.', data: msg });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
};
