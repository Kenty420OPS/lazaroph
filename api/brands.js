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
            console.error('[API Brands Error]: Firestore database not initialized.');
            return sendJson(res, 500, { success: false, error: 'Database connection error. Missing Firebase credentials.' });
        }

        const { query = {}, method, body: reqBody } = req;
        const body = typeof reqBody === 'string' ? JSON.parse(reqBody || '{}') : (reqBody || {});
        const url = req.url || '';
        const route = (query.route || '').toLowerCase();

        const brandsRef = db.collection('brands');

        // --- DELETE Brand ---
        if (
            method === 'DELETE' || 
            url.includes('/delete') || 
            route.includes('delete') || 
            (method === 'POST' && (body.action === 'delete' || query.action === 'delete'))
        ) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized' });

            const id = query.id || body.id || body.brandId || url.split('/').pop().replace(/[^0-9a-zA-Z_-]/g, '');
            if (!id) return sendJson(res, 400, { success: false, error: 'Brand ID required' });

            await brandsRef.doc(String(id)).delete();
            
            return sendJson(res, 200, { success: true, message: 'Brand deleted successfully from Firestore.' });
        }

        // --- UPDATE Status ---
        if (url.includes('/status') || route.includes('status') || body.status) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized' });

            const id = query.id || body.id || body.brandId || url.split('/').pop().replace(/[^0-9a-zA-Z_-]/g, '');
            const status = (body.status || 'ACTIVE').toUpperCase();

            await brandsRef.doc(String(id)).set({ status }, { merge: true });
            return sendJson(res, 200, { success: true, message: `Brand status updated to ${status}` });
        }

        // --- CREATE / UPDATE Brand ---
        if (method === 'POST' && (url.includes('/save') || route.includes('save') || body.name)) {
            if (!isAuthorized(req)) return sendJson(res, 403, { success: false, error: 'Unauthorized' });

            const newId = body.id || Date.now();
            const slug = (body.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            const brandData = {
                id: newId,
                name: body.name || 'New Brand',
                slug: slug,
                logoUrl: body.logoUrl || 'images/brand-nike.png',
                description: body.description || '',
                status: body.status || 'ACTIVE',
                productCount: body.productCount || 0
            };

            await brandsRef.doc(String(newId)).set(brandData, { merge: true });
            return sendJson(res, 200, { success: true, brand: brandData, message: 'Brand saved successfully to Firestore.' });
        }

        // --- GET Brands ---
        if (method === 'GET') {
            const snapshot = await brandsRef.get();
            let results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            return sendJson(res, 200, results);
        }

        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[API Brands Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
