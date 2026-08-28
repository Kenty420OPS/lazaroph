/**
 * LAZAROPH — Vercel Serverless API: Orders Handler
 * 
 * Supports:
 * - GET  /api/orders (list all orders)
 * - GET  /api/orders?trackingNumber=LZPH-... (track specific order)
 * - GET  /api/orders?id=123 (single order detail)
 * - POST /api/orders (create new order)
 * - PUT  /api/orders?id=123 (update order status / courier)
 */

let ordersStore = [
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
        riderName: 'Kuya Mark (Lalamove)',
        riderPhone: '0918-765-4321',
        estimatedDeliveryTime: 'Within 2-3 hours today',
        subtotal: 2199.00,
        shippingFee: 150.00,
        totalAmount: 2349.00,
        deliveryFeeConfirmed: true,
        createdAt: '2026-08-25T10:30:00.000Z',
        items: [
            { id: 1, productName: 'LAZAROPH Runner X1', size: 'US 10', color: 'Triple Black', quantity: 1, price: 2199.00, imageUrl: 'images/runner-x1-black-main.png' }
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
        riderName: 'J&T Courier Rider',
        riderPhone: '0919-876-5432',
        estimatedDeliveryTime: 'Delivered',
        subtotal: 2299.00,
        shippingFee: 150.00,
        totalAmount: 2449.00,
        deliveryFeeConfirmed: true,
        createdAt: '2026-08-26T14:15:00.000Z',
        items: [
            { id: 2, productName: 'LAZAROPH Street Classic', size: 'US 7', color: 'Pure White', quantity: 1, price: 2299.00, imageUrl: 'images/street-classic-white-main.png' }
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
        riderName: 'Grab Express Rider',
        riderPhone: '0920-111-2233',
        estimatedDeliveryTime: 'Today by 4:00 PM',
        subtotal: 4498.00,
        shippingFee: 150.00,
        totalAmount: 4648.00,
        deliveryFeeConfirmed: true,
        createdAt: '2026-08-28T09:00:00.000Z',
        items: [
            { id: 1, productName: 'LAZAROPH Runner X1', size: 'US 9.5', color: 'Ghost White', quantity: 1, price: 2199.00, imageUrl: 'images/runner-x1-black-main.png' },
            { id: 2, productName: 'LAZAROPH Street Classic', size: 'US 8', color: 'Pure White', quantity: 1, price: 2299.00, imageUrl: 'images/street-classic-white-main.png' }
        ]
    }
];

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    const { query, method, body } = req;
    const id = query.id ? parseInt(query.id, 10) : null;

    try {
        if (method === 'GET') {
            if (query.trackingNumber) {
                const order = ordersStore.find(o => (o.orderNumber || '').toUpperCase() === query.trackingNumber.toUpperCase());
                if (!order) {
                    return sendJson(res, 404, { success: false, error: `Order with tracking number ${query.trackingNumber} not found.` });
                }
                return sendJson(res, 200, { success: true, data: order });
            }

            if (id) {
                const order = ordersStore.find(o => o.id === id);
                if (!order) {
                    return sendJson(res, 404, { success: false, error: `Order #${id} not found.` });
                }
                return sendJson(res, 200, { success: true, data: order });
            }

            let results = [...ordersStore];
            if (query.customerEmail) {
                const emailLower = query.customerEmail.toLowerCase();
                results = results.filter(o => (o.customerEmail || '').toLowerCase() === emailLower);
            }
            if (query.status) {
                const st = query.status.toUpperCase();
                results = results.filter(o => (o.status || '').toUpperCase() === st);
            }

            return sendJson(res, 200, { success: true, count: results.length, data: results });
        }

        if (method === 'POST') {
            const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const orderId = Date.now();
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const orderNum = data.orderNumber || `LZPH-${dateStr}-${String(ordersStore.length + 1).padStart(4, '0')}`;

            const newOrder = {
                id: orderId,
                orderNumber: orderNum,
                customerName: data.customerName || 'Customer',
                customerEmail: data.customerEmail || '',
                customerPhone: data.customerPhone || '',
                shippingAddress: data.shippingAddress || '',
                status: data.status || 'PENDING',
                paymentMethod: data.paymentMethod || 'Cash on Delivery (COD)',
                paymentStatus: data.paymentStatus || (data.paymentMethod === 'GCash' || data.paymentMethod === 'Salmon Financing' ? 'PAID' : 'PENDING'),
                courier: data.courier || 'LALAMOVE',
                riderName: data.riderName || 'Pending Courier Assignment',
                riderPhone: data.riderPhone || '',
                estimatedDeliveryTime: data.estimatedDeliveryTime || 'Processing order',
                subtotal: parseFloat(data.subtotal) || 0,
                shippingFee: parseFloat(data.shippingFee) || 150.00,
                totalAmount: parseFloat(data.totalAmount) || ((parseFloat(data.subtotal) || 0) + 150.00),
                deliveryFeeConfirmed: true,
                createdAt: new Date().toISOString(),
                items: data.items || []
            };

            ordersStore.unshift(newOrder);
            return sendJson(res, 201, { success: true, message: 'Order created successfully.', data: newOrder });
        }

        if (method === 'PUT') {
            const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const targetId = id || data.id;
            const index = ordersStore.findIndex(o => o.id === targetId || o.orderNumber === data.orderNumber);

            if (index === -1) {
                return sendJson(res, 404, { success: false, error: `Order not found.` });
            }

            ordersStore[index] = {
                ...ordersStore[index],
                ...data,
                updatedAt: new Date().toISOString()
            };

            return sendJson(res, 200, { success: true, message: 'Order updated successfully.', data: ordersStore[index] });
        }

        if (method === 'DELETE' || (method === 'POST' && (req.url || '').includes('/delete'))) {
            const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const targetId = id || data.id || data.orderId;
            const index = ordersStore.findIndex(o => String(o.id) === String(targetId) || o.orderNumber === targetId || String(o.orderNumber) === String(targetId));

            if (index !== -1) {
                const deleted = ordersStore.splice(index, 1)[0];
                return sendJson(res, 200, { success: true, message: 'Order deleted successfully.', data: deleted });
            }
            return sendJson(res, 200, { success: true, message: 'Order processed/removed.' });
        }

        return sendJson(res, 405, { success: false, error: `Method ${method} not allowed.` });
    } catch (err) {
        console.error('[API Orders Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};

module.exports.ordersStore = ordersStore;
