/**
 * LAZAROPH — Vercel Serverless API: Brand Management Handler
 * 
 * Supports:
 * - GET  /api/brands (list all active and configured brands)
 * - POST /api/admin/brands/save (create or update brand)
 * - POST /api/admin/brands/status/:id (toggle active/inactive)
 * - POST /api/admin/brands/delete/:id or DELETE /api/brands/:id (delete brand)
 */

let brandsStore = [];

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

    const { query, method } = req;
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const url = req.url || '';
    const route = (query.route || '').toLowerCase();

    try {
        // --- 1. Delete Brand ---
        if (
            method === 'DELETE' || 
            url.includes('/delete') || 
            route.includes('delete') || 
            (method === 'POST' && (body.action === 'delete' || query.action === 'delete'))
        ) {
            const id = query.id || body.id || body.brandId || url.split('/').pop().replace(/[^0-9a-zA-Z_-]/g, '');
            const targetId = String(id);

            const initialLength = brandsStore.length;
            brandsStore = brandsStore.filter(b => String(b.id) !== targetId && String(b.slug) !== targetId);
            
            return sendJson(res, 200, {
                success: true,
                message: brandsStore.length < initialLength ? 'Brand deleted successfully.' : 'Brand processed/removed.'
            });
        }

        // --- 2. Update Status ---
        if (url.includes('/status') || route.includes('status') || body.status) {
            const id = query.id || body.id || body.brandId || url.split('/').pop().replace(/[^0-9a-zA-Z_-]/g, '');
            const status = (body.status || 'ACTIVE').toUpperCase();

            const brand = brandsStore.find(b => String(b.id) === String(id) || String(b.slug) === String(id));
            if (brand) {
                brand.status = status;
                return sendJson(res, 200, { success: true, brand, message: `Brand status updated to ${status}` });
            }
        }

        // --- 3. Save / Create Brand ---
        if (method === 'POST' && (url.includes('/save') || route.includes('save') || body.name)) {
            let savedBrand;
            if (body.id) {
                const idx = brandsStore.findIndex(b => String(b.id) === String(body.id));
                if (idx !== -1) {
                    savedBrand = { ...brandsStore[idx], ...body };
                    brandsStore[idx] = savedBrand;
                } else {
                    savedBrand = { ...body, id: body.id };
                    brandsStore.push(savedBrand);
                }
            } else {
                const newId = brandsStore.length > 0 ? Math.max(...brandsStore.map(b => parseInt(b.id, 10) || 0)) + 1 : 1;
                const slug = (body.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                savedBrand = {
                    id: newId,
                    name: body.name || 'New Brand',
                    slug: slug,
                    logoUrl: body.logoUrl || 'images/brand-nike.png',
                    description: body.description || '',
                    status: body.status || 'ACTIVE',
                    productCount: 0
                };
                brandsStore.push(savedBrand);
            }
            return sendJson(res, 200, { success: true, brand: savedBrand, message: 'Brand saved successfully.' });
        }

        // --- 4. Get Brand List ---
        return sendJson(res, 200, brandsStore);
    } catch (err) {
        console.error('[API Brands Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};

module.exports.brandsStore = brandsStore;
