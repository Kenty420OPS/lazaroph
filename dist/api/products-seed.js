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

module.exports = productsStore;

