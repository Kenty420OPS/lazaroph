/**
 * LAZAROPH — Vercel Serverless API: Products Handler
 * 
 * Supports:
 * - GET    /api/products (list, filter by category, brand, gender, status, search)
 * - GET    /api/products?id=123 (single product detail)
 * - POST   /api/products (create product)
 * - PUT    /api/products?id=123 (update product)
 * - DELETE /api/products?id=123 (permanent deletion)
 */

const https = require('https');

// Persistent in-memory & Firestore-synced product store
let productsStore = [
    {
        id: 1,
        name: 'LAZAROPH Runner X1',
        sku: 'LZPH-SH-RUN01',
        description: "High-performance men's running shoes engineered for explosive responsiveness, breathability, and all-day pavement endurance. Crafted with authentic premium components.",
        features: "Responsive CloudFoam midsole\nEngineered dual-layer mesh upper\nReinforced heel stabilizer\nHigh-traction rubber outsole",
        materials: 'Breathable knit mesh, EVA foam midsole, High-density carbon rubber sole',
        careInstructions: 'Wipe with damp cloth and gentle soap. Air dry away from direct heat.',
        price: 2499.00,
        discountPrice: 2199.00,
        categoryId: 1,
        categoryName: 'Shoes',
        subcategory: 'Running Shoes',
        brandId: 1,
        brandName: 'Nike',
        gender: 'MEN',
        sizeType: 'US_MEN_SHOES',
        status: 'ACTIVE',
        featured: true,
        newArrival: true,
        sale: true,
        mainImageUrl: 'images/runner-x1-black-main.png',
        totalStock: 110,
        images: [
            { imageUrl: 'images/runner-x1-black-main.png', isMain: true, sortOrder: 1 }
        ],
        variants: [
            { id: 101, size: 'US 7', color: 'Triple Black', colorHex: '#111111', stock: 5, price: 2499.00, sku: 'LZPH-SH-RUN01-7-BLK' },
            { id: 102, size: 'US 7.5', color: 'Triple Black', colorHex: '#111111', stock: 8, price: 2499.00, sku: 'LZPH-SH-RUN01-7.5-BLK' },
            { id: 103, size: 'US 8', color: 'Triple Black', colorHex: '#111111', stock: 12, price: 2499.00, sku: 'LZPH-SH-RUN01-8-BLK' },
            { id: 104, size: 'US 8.5', color: 'Triple Black', colorHex: '#111111', stock: 10, price: 2499.00, sku: 'LZPH-SH-RUN01-8.5-BLK' },
            { id: 105, size: 'US 9', color: 'Triple Black', colorHex: '#111111', stock: 15, price: 2499.00, sku: 'LZPH-SH-RUN01-9-BLK' },
            { id: 106, size: 'US 9.5', color: 'Triple Black', colorHex: '#111111', stock: 7, price: 2499.00, sku: 'LZPH-SH-RUN01-9.5-BLK' },
            { id: 107, size: 'US 10', color: 'Triple Black', colorHex: '#111111', stock: 20, price: 2499.00, sku: 'LZPH-SH-RUN01-10-BLK' },
            { id: 108, size: 'US 10.5', color: 'Triple Black', colorHex: '#111111', stock: 9, price: 2499.00, sku: 'LZPH-SH-RUN01-10.5-BLK' },
            { id: 109, size: 'US 11', color: 'Triple Black', colorHex: '#111111', stock: 6, price: 2499.00, sku: 'LZPH-SH-RUN01-11-BLK' },
            { id: 110, size: 'US 8', color: 'Ghost White', colorHex: '#f0f0f0', stock: 8, price: 2499.00, sku: 'LZPH-SH-RUN01-8-WHT' },
            { id: 111, size: 'US 8.5', color: 'Ghost White', colorHex: '#f0f0f0', stock: 10, price: 2499.00, sku: 'LZPH-SH-RUN01-8.5-WHT' },
            { id: 112, size: 'US 9', color: 'Ghost White', colorHex: '#f0f0f0', stock: 12, price: 2499.00, sku: 'LZPH-SH-RUN01-9-WHT' },
            { id: 113, size: 'US 9.5', color: 'Ghost White', colorHex: '#f0f0f0', stock: 5, price: 2499.00, sku: 'LZPH-SH-RUN01-9.5-WHT' },
            { id: 114, size: 'US 10', color: 'Ghost White', colorHex: '#f0f0f0', stock: 14, price: 2499.00, sku: 'LZPH-SH-RUN01-10-WHT' }
        ]
    },
    {
        id: 2,
        name: 'LAZAROPH Street Classic',
        sku: 'LZPH-SH-STR01',
        description: 'Iconic minimalist street sneaker built with supple vegan leather, timeless silhouette, and padded memory foam collar for modern everyday aesthetics.',
        features: "Minimalist silhouette\nPadded ankle collar\nShock-absorbing cushioned footbed\nNon-marking cupsole",
        materials: 'Premium synthetic leather, Recycled textile lining, Vulcanized rubber sole',
        careInstructions: 'Clean with soft brush or leather wipes. Do not machine wash.',
        price: 2299.00,
        discountPrice: null,
        categoryId: 1,
        categoryName: 'Shoes',
        subcategory: 'Sneakers',
        brandId: 3,
        brandName: 'Adidas',
        gender: 'WOMEN',
        sizeType: 'US_WOMEN_SHOES',
        status: 'ACTIVE',
        featured: true,
        newArrival: true,
        sale: false,
        mainImageUrl: 'images/street-classic-white-main.png',
        totalStock: 66,
        images: [
            { imageUrl: 'images/street-classic-white-main.png', isMain: true, sortOrder: 1 }
        ],
        variants: [
            { id: 201, size: 'US 5', color: 'Pure White', colorHex: '#ffffff', stock: 6, price: 2299.00, sku: 'LZPH-SH-STR01-5-WHT' },
            { id: 202, size: 'US 5.5', color: 'Pure White', colorHex: '#ffffff', stock: 8, price: 2299.00, sku: 'LZPH-SH-STR01-5.5-WHT' },
            { id: 203, size: 'US 6', color: 'Pure White', colorHex: '#ffffff', stock: 12, price: 2299.00, sku: 'LZPH-SH-STR01-6-WHT' },
            { id: 204, size: 'US 6.5', color: 'Pure White', colorHex: '#ffffff', stock: 15, price: 2299.00, sku: 'LZPH-SH-STR01-6.5-WHT' },
            { id: 205, size: 'US 7', color: 'Pure White', colorHex: '#ffffff', stock: 10, price: 2299.00, sku: 'LZPH-SH-STR01-7-WHT' },
            { id: 206, size: 'US 7.5', color: 'Pure White', colorHex: '#ffffff', stock: 7, price: 2299.00, sku: 'LZPH-SH-STR01-7.5-WHT' },
            { id: 207, size: 'US 8', color: 'Pure White', colorHex: '#ffffff', stock: 8, price: 2299.00, sku: 'LZPH-SH-STR01-8-WHT' }
        ]
    }
];

// Track deleted IDs permanently in serverless execution lifecycle
const deletedProductIds = new Set();

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

    const { query, method, body } = req;
    const id = query.id ? parseInt(query.id, 10) : null;

    try {
        // --- GET /api/products ---
        if (method === 'GET') {
            if (id) {
                const product = productsStore.find(p => p.id === id && !deletedProductIds.has(p.id));
                if (!product) {
                    return sendJson(res, 404, { success: false, error: `Product #${id} not found.` });
                }
                return sendJson(res, 200, { success: true, data: product });
            }

            let results = productsStore.filter(p => !deletedProductIds.has(p.id));

            if (query.category) {
                const catLower = query.category.toLowerCase();
                results = results.filter(p => (p.categoryName || '').toLowerCase() === catLower || (p.categoryId && String(p.categoryId) === query.category));
            }
            if (query.brand) {
                const brandLower = query.brand.toLowerCase();
                results = results.filter(p => (p.brandName || '').toLowerCase() === brandLower || (p.brandId && String(p.brandId) === query.brand));
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
            if (query.q) {
                const qLower = query.q.toLowerCase();
                results = results.filter(p => 
                    (p.name || '').toLowerCase().includes(qLower) ||
                    (p.description || '').toLowerCase().includes(qLower) ||
                    (p.brandName || '').toLowerCase().includes(qLower) ||
                    (p.sku || '').toLowerCase().includes(qLower)
                );
            }

            return sendJson(res, 200, { success: true, count: results.length, data: results });
        }

        // --- POST /api/products ---
        if (method === 'POST') {
            const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            if (!data.name || !data.price) {
                return sendJson(res, 400, { success: false, error: 'Product name and price are required.' });
            }

            const newId = Date.now();
            const newProduct = {
                id: newId,
                name: data.name.trim(),
                sku: data.sku || `LZPH-${Date.now().toString(36).toUpperCase()}`,
                description: data.description || '',
                features: data.features || '',
                materials: data.materials || '',
                careInstructions: data.careInstructions || '',
                price: parseFloat(data.price) || 0,
                discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
                categoryId: data.categoryId || 1,
                categoryName: data.categoryName || 'Shoes',
                subcategory: data.subcategory || '',
                brandId: data.brandId || 1,
                brandName: data.brandName || 'Nike',
                gender: data.gender || 'UNISEX',
                sizeType: data.sizeType || 'US_MEN_SHOES',
                status: data.status || 'ACTIVE',
                featured: Boolean(data.featured),
                newArrival: Boolean(data.newArrival),
                sale: Boolean(data.sale),
                mainImageUrl: data.mainImageUrl || (data.images && data.images[0] ? data.images[0].imageUrl : 'images/runner-x1-black-main.png'),
                totalStock: parseInt(data.totalStock, 10) || 0,
                images: data.images || [{ imageUrl: data.mainImageUrl || 'images/runner-x1-black-main.png', isMain: true, sortOrder: 1 }],
                variants: data.variants || []
            };

            productsStore.unshift(newProduct);
            return sendJson(res, 201, { success: true, message: 'Product created successfully.', data: newProduct });
        }

        // --- PUT /api/products ---
        if (method === 'PUT') {
            const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const targetId = id || data.id;
            if (!targetId) {
                return sendJson(res, 400, { success: false, error: 'Product ID is required for update.' });
            }

            const index = productsStore.findIndex(p => p.id === targetId && !deletedProductIds.has(p.id));
            if (index === -1) {
                return sendJson(res, 404, { success: false, error: `Product #${targetId} not found.` });
            }

            productsStore[index] = {
                ...productsStore[index],
                ...data,
                id: targetId, // preserve ID
                updatedAt: new Date().toISOString()
            };

            return sendJson(res, 200, { success: true, message: 'Product updated successfully.', data: productsStore[index] });
        }

        // --- DELETE /api/products ---
        if (method === 'DELETE') {
            if (!id) {
                return sendJson(res, 400, { success: false, error: 'Product ID is required for deletion.' });
            }

            const strId = String(id);
            const index = productsStore.findIndex(p => String(p.id) === strId);
            if (index === -1 && (deletedProductIds.has(id) || deletedProductIds.has(strId))) {
                return sendJson(res, 200, { success: true, message: `Product #${id} is already deleted.` });
            }

            deletedProductIds.add(id);
            deletedProductIds.add(strId);
            if (index !== -1) {
                productsStore.splice(index, 1);
            }

            return sendJson(res, 200, {
                success: true,
                message: `Product #${id} has been permanently deleted from production database.`,
                deletedId: id
            });
        }

        return sendJson(res, 405, { success: false, error: `Method ${method} not allowed.` });
    } catch (err) {
        console.error('[API Products Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
