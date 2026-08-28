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
        // Fetch all orders
        let allOrders = [
            {
                id: 1,
                orderNumber: 'LZPH-20260825-0001',
                customerName: 'Juan Dela Cruz',
                customerEmail: 'customer@example.com',
                customerPhone: '09171234567',
                shippingAddress: '32 F. E. Mendoza Street, Malanday, Marikina, 1805 Metro Manila',
                status: 'CONFIRMED',
                paymentMethod: 'GCash',
                paymentStatus: 'PAID',
                courier: 'LALAMOVE',
                subtotal: 2199.00,
                shippingFee: 150.00,
                totalAmount: 2349.00,
                createdAt: '2026-08-25T10:30:00.000Z',
                items: [
                    { id: 1, productName: 'LAZAROPH Runner X1', size: 'US 10', color: 'Triple Black', quantity: 1, price: 2199.00 }
                ]
            },
            {
                id: 2,
                orderNumber: 'LZPH-20260826-0002',
                customerName: 'Roselyn Bagacina',
                customerEmail: 'bagacinaroselyn18@gmail.com',
                customerPhone: '09634354784',
                shippingAddress: 'Patio Rosario Executive Homes, Marikina City',
                status: 'DELIVERED',
                paymentMethod: 'Salmon Financing',
                paymentStatus: 'PAID',
                courier: 'J&T Express',
                subtotal: 2299.00,
                shippingFee: 150.00,
                totalAmount: 2449.00,
                createdAt: '2026-08-26T14:15:00.000Z',
                items: [
                    { id: 2, productName: 'LAZAROPH Street Classic', size: 'US 7', color: 'Pure White', quantity: 1, price: 2299.00 }
                ]
            },
            {
                id: 3,
                orderNumber: 'LZPH-20260828-0003',
                customerName: 'Clark Montoya',
                customerEmail: 'montoyaclark8@gmail.com',
                customerPhone: '09060727757',
                shippingAddress: 'Patio Rosario Townhomes, Sumulong Hwy, Marikina',
                status: 'CONFIRMED',
                paymentMethod: 'GCash',
                paymentStatus: 'PAID',
                courier: 'Grab Express',
                subtotal: 4498.00,
                shippingFee: 150.00,
                totalAmount: 4648.00,
                createdAt: '2026-08-28T09:00:00.000Z',
                items: [
                    { id: 1, productName: 'LAZAROPH Runner X1', size: 'US 9.5', color: 'Ghost White', quantity: 1, price: 2199.00 },
                    { id: 2, productName: 'LAZAROPH Street Classic', size: 'US 8', color: 'Pure White', quantity: 1, price: 2299.00 }
                ]
            }
        ];

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
