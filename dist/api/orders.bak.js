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

let ordersStore = [];

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    const { query = {}, method, body } = req;
    const url = req.url || '';
    const route = query.route || '';
    const deleteMatch = url.match(/\/delete\/([^/?]+)/) || route.match(/^delete\/([^/?]+)/);
    let id = query.id ? query.id : (deleteMatch ? deleteMatch[1] : null);
    if (id && !isNaN(id)) {
        id = parseInt(id, 10);
    }

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
