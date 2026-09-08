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
            console.error('[API Products Error]: Firestore database not initialized.');
            return sendJson(res, 500, { success: false, error: 'Database connection error. Missing Firebase credentials.' });
        }

        const { query = {}, method, body: reqBody } = req;
        const body = typeof reqBody === 'string' ? JSON.parse(reqBody || '{}') : (reqBody || {});
        const url = req.url || '';
        const route = query.route || '';

        const deleteMatch = url.match(/\/delete\/([^/?]+)/) || route.match(/^delete\/([^/?]+)/);
        let id = query.id ? query.id : (deleteMatch ? deleteMatch[1] : null);
        const isDeleteAction = Boolean(deleteMatch || method === 'DELETE' || route.startsWith('delete/'));

        const productsRef = db.collection('products');

        // --- MIGRATION / SEED CHECK ---
        if (query.action === 'seed') {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized to seed database' });
            
            const snapshot = await productsRef.limit(1).get();
            if (!snapshot.empty) {
                return sendJson(res, 400, { success: false, error: 'Firestore already contains products. Seed aborted to prevent duplicates.' });
            }

            return sendJson(res, 200, { 
                success: true, 
                message: 'Seed endpoint ready. To seed, the original products array must be restored and imported here.', 
                expectedCount: 'Unknown (Backup file used)' 
            });
        }

        // --- DELETE PRODUCT ---
        if (isDeleteAction) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized' });
            if (!id) return sendJson(res, 400, { success: false, error: 'Product ID is required for deletion.' });

            await productsRef.doc(String(id)).delete();
            return sendJson(res, 200, { success: true, message: `Product #${id} has been permanently deleted from production database.`, deletedId: id });
        }

        // --- GET PRODUCTS ---
        if (method === 'GET') {
            if (id) {
                const doc = await productsRef.doc(String(id)).get();
                if (!doc.exists) {
                    return sendJson(res, 404, { success: false, error: `Product #${id} not found.` });
                }
                return sendJson(res, 200, { success: true, data: { id: doc.id, ...doc.data() } });
            }

            const snapshot = await productsRef.get();
            let results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            if (query.category) {
                const catLower = query.category.toLowerCase();
                results = results.filter(p => (p.categoryName || '').toLowerCase() === catLower || String(p.categoryId) === query.category);
            }
            if (query.brand) {
                const brandLower = query.brand.toLowerCase();
                results = results.filter(p => (p.brandName || '').toLowerCase() === brandLower || String(p.brandId) === query.brand);
            }
            if (query.gender) {
                const gUpper = query.gender.toUpperCase();
                results = results.filter(p => (p.gender || '').toUpperCase() === gUpper || p.gender === 'UNISEX');
            }
            if (query.featured === 'true') {
                results = results.filter(p => Boolean(p.featured));
            }
            if (query.sale === 'true') {
                results = results.filter(p => Boolean(p.sale) || (p.discountPrice && p.discountPrice < p.price));
            }
            if (query.new === 'true' || query.newArrival === 'true') {
                results = results.filter(p => Boolean(p.newArrival));
            }

            return sendJson(res, 200, { success: true, count: results.length, data: results });
        }

        // --- POST / PUT (Create/Update) ---
        if (method === 'POST' || method === 'PUT') {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized' });

            const targetId = String(id || body.id || Date.now());
            const productData = { ...body };
            delete productData.id; 
            productData.id = targetId;

            await productsRef.doc(targetId).set(productData, { merge: true });

            return sendJson(res, 200, { success: true, message: 'Product saved to Firestore successfully.', data: productData });
        }

        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });

    } catch (err) {
        console.error('[API Products Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};


