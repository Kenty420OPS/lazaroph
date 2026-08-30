/**
 * LAZAROPH — Vercel Serverless API: Sales & Analytics Handler
 * 
 * Supports:
 * - GET /api/sales (calculates Gross Sales and returns breakdown)
 * - GET /api/sales?period=today
 * - GET /api/sales?period=week
 * - GET /api/sales?period=month
 * - GET /api/sales?period=year
 * - GET /api/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */

const ordersHandler = require('./orders.js');

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    try {
        // Fetch all orders dynamically from shared serverless orders store
        let allOrders = (ordersHandler && Array.isArray(ordersHandler.ordersStore) && ordersHandler.ordersStore.length > 0)
            ? ordersHandler.ordersStore
            : [];

        const { query } = req;
        const now = new Date();
        let filteredOrders = [...allOrders];

        if (query.period === 'today') {
            const todayStr = now.toISOString().slice(0, 10);
            filteredOrders = filteredOrders.filter(o => (o.createdAt || '').slice(0, 10) === todayStr);
        } else if (query.period === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
        } else if (query.period === 'month') {
            const currentMonth = now.toISOString().slice(0, 7);
            filteredOrders = filteredOrders.filter(o => (o.createdAt || '').slice(0, 7) === currentMonth);
        } else if (query.period === 'year') {
            const currentYear = now.getFullYear().toString();
            filteredOrders = filteredOrders.filter(o => (o.createdAt || '').slice(0, 4) === currentYear);
        } else if (query.startDate || query.endDate) {
            if (query.startDate) {
                const start = new Date(query.startDate);
                filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= start);
            }
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setHours(23, 59, 59, 999);
                filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= end);
            }
        }

        // Calculate Gross Sales strictly from non-cancelled, legitimate orders
        const validSalesOrders = filteredOrders.filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED');
        const grossSalesTotal = validSalesOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const totalItemsSold = validSalesOrders.reduce((sum, o) => {
            return sum + (o.items ? o.items.reduce((iSum, item) => iSum + (parseInt(item.quantity, 10) || 1), 0) : 1);
        }, 0);

        return sendJson(res, 200, {
            success: true,
            filter: query.period || (query.startDate ? 'custom' : 'all'),
            grossSales: grossSalesTotal,
            grossSalesFormatted: `₱${grossSalesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalOrders: filteredOrders.length,
            validSalesOrdersCount: validSalesOrders.length,
            totalItemsSold,
            orders: validSalesOrders
        });
    } catch (err) {
        console.error('[API Sales Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
