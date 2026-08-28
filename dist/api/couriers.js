/**
 * LAZAROPH — Vercel Serverless API: Couriers Handler
 */

const couriers = [
    { code: 'LALAMOVE', name: 'Lalamove Express', icon: '🛵', type: 'SAME_DAY', active: true, baseFee: 150.00, contact: 'support@lalamove.com' },
    { code: 'GRAB_EXPRESS', name: 'Grab Express', icon: '🚗', type: 'SAME_DAY', active: true, baseFee: 160.00, contact: 'support@grab.com' },
    { code: 'JT_EXPRESS', name: 'J&T Express', icon: '📦', type: 'STANDARD_NATIONWIDE', active: true, baseFee: 120.00, contact: 'support@jtexpress.ph' },
    { code: 'NINJA_VAN', name: 'Ninja Van Philippines', icon: '🥷', type: 'STANDARD_NATIONWIDE', active: true, baseFee: 130.00, contact: 'support@ninjavan.co' }
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
        return sendJson(res, 200, { success: true, count: couriers.length, data: couriers });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
};
