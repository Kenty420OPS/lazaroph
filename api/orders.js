const { db } = require('./_firebase-admin');

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

function isAuthorized(req) {
    const key = req.headers['x-session-key'] || req.query.sessionKey;
    if (!key || !key.startsWith('adm_')) return false;
    return true;
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    try {
        if (!db) {
            console.error('[API Orders Error]: Firestore database not initialized.');
            return sendJson(res, 500, { success: false, error: 'Database connection error. Missing Firebase credentials.' });
        }

        const { query = {}, method, body: reqBody } = req;
        const body = typeof reqBody === 'string' ? JSON.parse(reqBody || '{}') : (reqBody || {});
        const url = req.url || '';
        const route = query.route || '';

        const deleteMatch = url.match(/\/delete\/([^/?]+)/) || route.match(/^delete\/([^/?]+)/);
        let id = query.id ? query.id : (deleteMatch ? deleteMatch[1] : (body.id ? body.id : null));
        const isDeleteAction = Boolean(deleteMatch || method === 'DELETE' || route.startsWith('delete/') || (method === 'POST' && body.action === 'delete'));

        const ordersRef = db.collection('orders');

        // --- GET ORDERS ---
        if (method === 'GET') {
            if (query.trackingNumber) {
                const snapshot = await ordersRef.where('orderNumber', '==', query.trackingNumber).limit(1).get();
                if (snapshot.empty) {
                    return sendJson(res, 404, { success: false, error: `Order with tracking number ${query.trackingNumber} not found.` });
                }
                const order = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                return sendJson(res, 200, { success: true, data: order });
            }

            if (id) {
                const doc = await ordersRef.doc(String(id)).get();
                if (!doc.exists) {
                    return sendJson(res, 404, { success: false, error: `Order #${id} not found.` });
                }
                return sendJson(res, 200, { success: true, data: { id: doc.id, ...doc.data() } });
            }

            const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();
            let results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

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

        // --- POST (Create Order) ---
        if (method === 'POST' && !isDeleteAction && !body.action) {
            const orderId = Date.now().toString();
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const orderNum = body.orderNumber || `LZPH-${dateStr}-${randomSuffix}`;

            const newOrder = {
                id: orderId,
                orderNumber: orderNum,
                customerName: body.customerName || 'Customer',
                customerEmail: body.customerEmail || '',
                customerPhone: body.customerPhone || '',
                shippingAddress: body.shippingAddress || '',
                status: body.status || 'PENDING',
                paymentMethod: body.paymentMethod || 'Cash on Delivery (COD)',
                paymentStatus: body.paymentStatus || (body.paymentMethod === 'GCash' || body.paymentMethod === 'Salmon Financing' ? 'PAID' : 'PENDING'),
                courier: body.courier || 'LALAMOVE',
                riderName: body.riderName || 'Pending Courier Assignment',
                riderPhone: body.riderPhone || '',
                estimatedDeliveryTime: body.estimatedDeliveryTime || 'Processing order',
                subtotal: parseFloat(body.subtotal) || 0,
                shippingFee: parseFloat(body.shippingFee) || 150.00,
                totalAmount: parseFloat(body.totalAmount) || ((parseFloat(body.subtotal) || 0) + 150.00),
                deliveryFeeConfirmed: true,
                createdAt: new Date().toISOString(),
                items: body.items || []
            };

            await ordersRef.doc(orderId).set(newOrder);
            return sendJson(res, 201, { success: true, message: 'Order created successfully.', data: newOrder });
        }

        // --- PUT / Update Order ---
        if (method === 'PUT' || (method === 'POST' && body.action === 'update')) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized to update order.' });
            
            const targetId = String(id || body.id);
            if (!targetId || targetId === 'undefined') return sendJson(res, 400, { success: false, error: 'Order ID is required.' });

            const updateData = { ...body };
            delete updateData.id;
            delete updateData.action;

            await ordersRef.doc(targetId).set(updateData, { merge: true });
            return sendJson(res, 200, { success: true, message: 'Order updated successfully.', data: { id: targetId, ...updateData } });
        }

        // --- DELETE Order ---
        if (isDeleteAction) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized to delete order.' });
            
            const targetId = String(id || body.id);
            if (!targetId || targetId === 'undefined') return sendJson(res, 400, { success: false, error: 'Order ID is required.' });

            await ordersRef.doc(targetId).delete();
            return sendJson(res, 200, { success: true, message: `Order #${targetId} deleted successfully.` });
        }

        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });

    } catch (err) {
        console.error('[API Orders Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
