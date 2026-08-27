/**
 * LAZAROPH — Centralized REST API Client & Dual-Engine Offline Resilient Layer
 * 
 * Features:
 * 1. Automatic Origin & Base URL Discovery (http://localhost:8080 vs same-origin vs file://)
 * 2. Self-Healing Zero-Failure Fallback Engine (Seamless local simulation if backend server is offline)
 * 3. Reactive Connection Status Events
 */

// ================= FALLBACK DATASTORE (Local Client Simulation) =================
const FallbackStore = {
    initialized: false,
    categories: [
        { id: 1, name: 'Shoes', slug: 'shoes', description: "Men's, women's, and kids' performance, lifestyle, and streetwear sneakers.", imageUrl: 'images/category-shoes.jpg' },
        { id: 2, name: 'Apparel', slug: 'apparel', description: 'T-shirts, hoodies, performance shorts, training gear, and sportswear.', imageUrl: 'images/category-apparel.jpg' },
        { id: 3, name: 'Slides', slug: 'slides', description: 'Authentic athletic slides, recovery slide sandals, and lifestyle comfort footwear.', imageUrl: 'images/cat-slides.png' },
        { id: 4, name: 'Watches', slug: 'watches', description: 'Authentic sports, digital, classic, and chronograph timepieces.', imageUrl: 'images/category-watches.jpg' },
        { id: 5, name: 'Customized', slug: 'customized', description: 'Personalized sublimation team jerseys, player shirts, and basketball uniforms.', imageUrl: 'images/category-customized.jpg' }
    ],

    brands: [
        { id: 1, name: 'Nike', slug: 'nike', logoUrl: 'images/brand-nike.png', description: 'World-renowned athletic sportswear, signature sneakers, and performance apparel.', status: 'ACTIVE', productCount: 4 },
        { id: 2, name: 'Jordan', slug: 'jordan', logoUrl: 'images/brand-jordan.png', description: 'Signature basketball legacy, retro high-tops, and iconic Jumpman apparel.', status: 'ACTIVE', productCount: 2 },
        { id: 3, name: 'Adidas', slug: 'adidas', logoUrl: 'images/brand-adidas.png', description: 'Iconic 3-stripes sportswear, Originals lifestyle kicks, and boost comfort.', status: 'ACTIVE', productCount: 3 },
        { id: 4, name: 'New Balance', slug: 'new-balance', logoUrl: 'images/brand-nb.png', description: 'Heritage running lifestyle, dad shoes, and superior arch support footwear.', status: 'ACTIVE', productCount: 1 },
        { id: 5, name: 'HOKA', slug: 'hoka', logoUrl: 'images/brand-hoka.png', description: 'Maximalist cushioned road running shoes, trail runners, and recovery slides.', status: 'ACTIVE', productCount: 1 },
        { id: 6, name: 'On', slug: 'on', logoUrl: 'images/brand-on.png', description: 'Swiss-engineered CloudTec running shoes, ultralight performance footwear, and apparel.', status: 'ACTIVE', productCount: 1 },
        { id: 7, name: 'Puma', slug: 'puma', logoUrl: 'images/brand-puma.png', description: 'Forever faster athletic footwear, football gear, and casual street trainers.', status: 'ACTIVE', productCount: 1 },
        { id: 8, name: 'Asics', slug: 'asics', logoUrl: 'images/brand-asics.png', description: 'Japanese performance running shoes, GEL cushioning, and ergonomic trainers.', status: 'ACTIVE', productCount: 1 },
        { id: 9, name: 'Birkenstock', slug: 'birkenstock', logoUrl: 'images/brand-birkenstock.png', description: 'Iconic German anatomical cork footbed sandals, Boston clogs, and slides.', status: 'ACTIVE', productCount: 1 },
        { id: 10, name: 'Crocs', slug: 'crocs', logoUrl: 'images/brand-crocs.png', description: 'Croslite comfort clogs, all-terrain sandals, and custom Jibbitz accessories.', status: 'ACTIVE', productCount: 1 },
        { id: 11, name: 'Converse', slug: 'converse', logoUrl: 'images/brand-converse.png', description: 'Timeless Chuck Taylor All Stars, canvas skate shoes, and street culture.', status: 'ACTIVE', productCount: 1 }
    ],

    storeSettings: {
        adminPhone: '282948572',
        storePhone: '282948572',
        storeEmail: 'lazarophilippines20@gmail.com',
        gcashNumber: '0917-282-9485',
        gcashName: 'LAZAROPH PHILIPPINES',
        gcashQrUrl: 'images/qr-gcash-demo.png',
        mayaNumber: '0917-282-9485',
        mayaName: 'LAZAROPH PHILIPPINES',
        mayaQrUrl: 'images/qr-maya-demo.png',
        bdoAccount: '0012-3456-7890 (Lazaro PH)',
        bdoQrUrl: '',
        bpiAccount: '9876-5432-10 (Lazaro PH)',
        bpiQrUrl: '',
        branch1Address: '911 J.P. Rizal Street, Concepcion Uno, Marikina, 1805 Metro Manila',
        defaultDispatchBranch: 'Concepcion Uno, Marikina'
    },

    getInitialProducts() {
        return [
            {
                id: 1,
                name: 'LAZAROPH Runner X1',
                sku: 'LZPH-SH-RUN01',
                description: "High-performance men's running shoes engineered for explosive responsiveness, breathability, and all-day pavement endurance. Crafted with authentic premium components.",
                features: 'Responsive CloudFoam midsole\nEngineered dual-layer mesh upper\nReinforced heel stabilizer\nHigh-traction rubber outsole',
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
                features: 'Minimalist silhouette\nPadded ankle collar\nShock-absorbing cushioned footbed\nNon-marking cupsole',
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
                    { id: 120, size: 'US 5', color: 'Pure White', colorHex: '#ffffff', stock: 4, price: 2299.00, sku: 'LZPH-SH-STR01-5-WHT' },
                    { id: 121, size: 'US 5.5', color: 'Pure White', colorHex: '#ffffff', stock: 6, price: 2299.00, sku: 'LZPH-SH-STR01-5.5-WHT' },
                    { id: 122, size: 'US 6', color: 'Pure White', colorHex: '#ffffff', stock: 10, price: 2299.00, sku: 'LZPH-SH-STR01-6-WHT' },
                    { id: 123, size: 'US 6.5', color: 'Pure White', colorHex: '#ffffff', stock: 8, price: 2299.00, sku: 'LZPH-SH-STR01-6.5-WHT' },
                    { id: 124, size: 'US 7', color: 'Pure White', colorHex: '#ffffff', stock: 14, price: 2299.00, sku: 'LZPH-SH-STR01-7-WHT' },
                    { id: 125, size: 'US 7.5', color: 'Pure White', colorHex: '#ffffff', stock: 9, price: 2299.00, sku: 'LZPH-SH-STR01-7.5-WHT' },
                    { id: 126, size: 'US 8', color: 'Pure White', colorHex: '#ffffff', stock: 11, price: 2299.00, sku: 'LZPH-SH-STR01-8-WHT' },
                    { id: 127, size: 'US 8.5', color: 'Pure White', colorHex: '#ffffff', stock: 5, price: 2299.00, sku: 'LZPH-SH-STR01-8.5-WHT' },
                    { id: 128, size: 'US 9', color: 'Pure White', colorHex: '#ffffff', stock: 3, price: 2299.00, sku: 'LZPH-SH-STR01-9-WHT' }
                ]
            },
            {
                id: 3,
                name: 'LAZAROPH Junior Sprint',
                sku: 'LZPH-SH-JNR01',
                description: 'Lightweight, durable athletic footwear crafted for active kids, featuring secure lock-down strap and flex-groove sole for high agility.',
                features: 'Easy lock-down velcro strap\nFlexible outsole with multi-directional grip\nReinforced toe bumper for durability\nUltra-lightweight mesh',
                materials: 'Air-flow synthetic mesh, Phylon lightweight midsole, Rubber traction pods',
                careInstructions: 'Hand wash cold with mild detergent. Remove insole before washing.',
                price: 1799.00,
                discountPrice: 1499.00,
                categoryId: 1,
                categoryName: 'Shoes',
                subcategory: 'Kids Shoes',
                brandId: 1,
                brandName: 'Nike',
                gender: 'KIDS',
                sizeType: 'US_KIDS_SHOES',
                status: 'ACTIVE',
                featured: false,
                newArrival: true,
                sale: true,
                mainImageUrl: 'images/junior-sprint-blue-main.png',
                totalStock: 36,
                images: [
                    { imageUrl: 'images/junior-sprint-blue-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 130, size: 'US 1Y', color: 'Electric Blue', colorHex: '#0070f3', stock: 6, price: 1799.00, sku: 'LZPH-SH-JNR01-1Y-BLU' },
                    { id: 131, size: 'US 2Y', color: 'Electric Blue', colorHex: '#0070f3', stock: 8, price: 1799.00, sku: 'LZPH-SH-JNR01-2Y-BLU' },
                    { id: 132, size: 'US 3Y', color: 'Electric Blue', colorHex: '#0070f3', stock: 10, price: 1799.00, sku: 'LZPH-SH-JNR01-3Y-BLU' },
                    { id: 133, size: 'US 4Y', color: 'Electric Blue', colorHex: '#0070f3', stock: 7, price: 1799.00, sku: 'LZPH-SH-JNR01-4Y-BLU' },
                    { id: 134, size: 'US 5Y', color: 'Electric Blue', colorHex: '#0070f3', stock: 5, price: 1799.00, sku: 'LZPH-SH-JNR01-5Y-BLU' }
                ]
            },
            {
                id: 4,
                name: 'LAZAROPH Performance Tee',
                sku: 'LZPH-AP-TEE01',
                description: 'Signature moisture-wicking athletic tee built with 4-way stretch fabric for intense workouts, basketball training, and lifestyle comfort.',
                features: 'DryVent moisture-wicking technology\n4-way stretch ergonomic fit\nAnti-odor antimicrobial finish\nTagless comfort collar',
                materials: '88% Polyester, 12% Spandex Quick-Dry Blend',
                careInstructions: 'Machine wash cold inside out. Do not bleach or iron graphics.',
                price: 899.00,
                discountPrice: null,
                categoryId: 2,
                categoryName: 'Apparel',
                subcategory: 'Shirts',
                brandId: 1,
                brandName: 'Nike',
                gender: 'MEN',
                sizeType: 'APPAREL_SIZE',
                status: 'ACTIVE',
                featured: true,
                newArrival: false,
                sale: false,
                mainImageUrl: 'images/perf-tee-black-main.png',
                totalStock: 75,
                images: [
                    { imageUrl: 'images/perf-tee-black-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 140, size: 'S', color: 'Matte Black', colorHex: '#18181b', stock: 12, price: 899.00, sku: 'LZPH-AP-TEE01-S-BLK' },
                    { id: 141, size: 'M', color: 'Matte Black', colorHex: '#18181b', stock: 20, price: 899.00, sku: 'LZPH-AP-TEE01-M-BLK' },
                    { id: 142, size: 'L', color: 'Matte Black', colorHex: '#18181b', stock: 25, price: 899.00, sku: 'LZPH-AP-TEE01-L-BLK' },
                    { id: 143, size: 'XL', color: 'Matte Black', colorHex: '#18181b', stock: 18, price: 899.00, sku: 'LZPH-AP-TEE01-XL-BLK' }
                ]
            },
            {
                id: 5,
                name: 'LAZAROPH Pro Training Shorts',
                sku: 'LZPH-AP-SHT01',
                description: 'Breathable lightweight performance training shorts featuring deep zippered phone pockets, supportive interior liner, and elastic drawcord waistband.',
                features: 'Deep zippered anti-drop pockets\nBuilt-in compression liner option\nReflective night logos\nSweat-repelling micro-weave',
                materials: '100% Breathable Micro-Ripstop Polyester',
                careInstructions: 'Tumble dry low. Do not dry clean.',
                price: 999.00,
                discountPrice: 799.00,
                categoryId: 2,
                categoryName: 'Apparel',
                subcategory: 'Shorts',
                brandId: 3,
                brandName: 'Adidas',
                gender: 'MEN',
                sizeType: 'APPAREL_SIZE',
                status: 'ACTIVE',
                featured: false,
                newArrival: true,
                sale: true,
                mainImageUrl: 'images/train-shorts-gray-main.png',
                totalStock: 65,
                images: [
                    { imageUrl: 'images/train-shorts-gray-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 150, size: 'S', color: 'Charcoal Heather', colorHex: '#374151', stock: 10, price: 999.00, sku: 'LZPH-AP-SHT01-S-GRY' },
                    { id: 151, size: 'M', color: 'Charcoal Heather', colorHex: '#374151', stock: 20, price: 999.00, sku: 'LZPH-AP-SHT01-M-GRY' },
                    { id: 152, size: 'L', color: 'Charcoal Heather', colorHex: '#374151', stock: 25, price: 999.00, sku: 'LZPH-AP-SHT01-L-GRY' },
                    { id: 153, size: 'XL', color: 'Charcoal Heather', colorHex: '#374151', stock: 10, price: 999.00, sku: 'LZPH-AP-SHT01-XL-GRY' }
                ]
            },
            {
                id: 6,
                name: 'LAZAROPH Slide Comfort X1',
                sku: 'LZPH-SL-X01',
                description: 'Ultra-cushioned recovery athletic slides designed with contoured ergonomic footbed, waterproof textured strap, and anti-slip traction outsole.',
                features: 'Molded dual-density CloudEVA footbed\nPadded synthetic leather upper strap\nDeep flex grooves for natural movement\nQuick-drying and waterproof',
                materials: 'Hydrophobic EVA foam, Synthetic leather strap',
                careInstructions: 'Rinse with fresh water. Avoid prolonged exposure to extreme heat/sun.',
                price: 1399.00,
                discountPrice: 1199.00,
                categoryId: 3,
                categoryName: 'Slides',
                subcategory: 'Comfort Slides',
                brandId: 1,
                brandName: 'Nike',
                gender: 'MEN',
                sizeType: 'US_MEN_SHOES',
                status: 'ACTIVE',
                featured: true,
                newArrival: true,
                sale: true,
                mainImageUrl: 'images/slide-comfort-x1.png',
                totalStock: 50,
                images: [
                    { imageUrl: 'images/slide-comfort-x1.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 160, size: 'US 7', color: 'Onyx Black', colorHex: '#18181b', stock: 8, price: 1399.00, sku: 'LZPH-SL-X01-7-BLK' },
                    { id: 161, size: 'US 8', color: 'Onyx Black', colorHex: '#18181b', stock: 10, price: 1399.00, sku: 'LZPH-SL-X01-8-BLK' },
                    { id: 162, size: 'US 9', color: 'Onyx Black', colorHex: '#18181b', stock: 14, price: 1399.00, sku: 'LZPH-SL-X01-9-BLK' },
                    { id: 163, size: 'US 10', color: 'Onyx Black', colorHex: '#18181b', stock: 12, price: 1399.00, sku: 'LZPH-SL-X01-10-BLK' },
                    { id: 164, size: 'US 11', color: 'Onyx Black', colorHex: '#18181b', stock: 6, price: 1399.00, sku: 'LZPH-SL-X01-11-BLK' }
                ]
            },
            {
                id: 7,
                name: 'LAZAROPH Sport Digital Stealth',
                sku: 'LZPH-WT-DIG01',
                description: 'Rugged military-grade sports digital watch with 50M water resistance, shock-proof resin armor, LED backlight, and multi-alarm chronograph.',
                features: '50M Water Resistance\nHigh-luminescence EL backlight\n1/100 second precision stopwatch\nShock-resistant polymer chassis',
                materials: 'Hardened mineral crystal glass, Resin shock case, Silicone strap',
                careInstructions: 'Rinse with tap water after saltwater swimming. Do not press buttons underwater.',
                price: 1899.00,
                discountPrice: null,
                categoryId: 4,
                categoryName: 'Watches',
                subcategory: 'Digital Watches',
                brandId: 1,
                brandName: 'Nike',
                gender: 'MEN',
                sizeType: 'STANDARD',
                status: 'ACTIVE',
                featured: false,
                newArrival: true,
                sale: false,
                mainImageUrl: 'images/sport-digital-stealth-main.png',
                totalStock: 30,
                images: [
                    { imageUrl: 'images/sport-digital-stealth-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 170, size: 'One Size', color: 'Stealth Black', colorHex: '#09090b', stock: 30, price: 1899.00, sku: 'LZPH-WT-DIG01-OS' }
                ]
            },
            {
                id: 8,
                name: 'LAZAROPH Classic Timepiece',
                sku: 'LZPH-WT-CLS01',
                description: 'Refined minimalist stainless steel chronograph watch with date display, Japanese quartz movement, and premium sapphire-coated crystal glass.',
                features: 'Precision Japanese Quartz Movement\n316L Surgical-Grade Stainless Steel\nScratch-resistant sapphire coating\nWater resistant to 3 ATM',
                materials: 'Solid 316L stainless steel, Sapphire crystal glass',
                careInstructions: 'Wipe with microfiber jewelry cloth. Keep away from strong magnetic fields.',
                price: 3499.00,
                discountPrice: null,
                categoryId: 4,
                categoryName: 'Watches',
                subcategory: 'Chronograph',
                brandId: 1,
                brandName: 'Nike',
                gender: 'MEN',
                sizeType: 'STANDARD',
                status: 'ACTIVE',
                featured: true,
                newArrival: false,
                sale: false,
                mainImageUrl: 'images/classic-time-black-main.png',
                totalStock: 15,
                images: [
                    { imageUrl: 'images/classic-time-black-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 180, size: 'One Size', color: 'Silver / Black Dial', colorHex: '#d4d4d8', stock: 15, price: 3499.00, sku: 'LZPH-WT-CLS01-OS' }
                ]
            },
            {
                id: 9,
                name: 'LAZAROPH Pro Elite Custom Jersey',
                sku: 'LZPH-CS-JER01',
                description: 'Professional custom sublimated basketball jersey. Personalize with your Team Name, Player Name, and Number with breathable diamond-mesh fabric.',
                features: 'HD Full-Sublimation non-fading print\nDiamond-mesh moisture management\nReinforced neck and armhole ribbing\nFull 2D Live Studio Preview',
                materials: '100% Pro Sublimation Micro-Mesh Polyester (220 GSM)',
                careInstructions: 'Machine wash warm inside-out. Do not iron directly on print.',
                price: 1199.00,
                discountPrice: null,
                categoryId: 5,
                categoryName: 'Customized',
                subcategory: 'Custom Uniforms',
                brandId: 1,
                brandName: 'Nike',
                gender: 'MEN',
                sizeType: 'APPAREL_SIZE',
                status: 'ACTIVE',
                featured: true,
                newArrival: true,
                sale: false,
                mainImageUrl: 'images/perf-jersey-black-main.png',
                totalStock: 999,
                images: [
                    { imageUrl: 'images/perf-jersey-black-main.png', isMain: true, sortOrder: 1 }
                ],
                variants: [
                    { id: 190, size: 'S', color: 'Custom Print', colorHex: '#ffb800', stock: 100, price: 1199.00, sku: 'LZPH-CS-JER01-S' },
                    { id: 191, size: 'M', color: 'Custom Print', colorHex: '#ffb800', stock: 150, price: 1199.00, sku: 'LZPH-CS-JER01-M' },
                    { id: 192, size: 'L', color: 'Custom Print', colorHex: '#ffb800', stock: 200, price: 1199.00, sku: 'LZPH-CS-JER01-L' },
                    { id: 193, size: 'XL', color: 'Custom Print', colorHex: '#ffb800', stock: 150, price: 1199.00, sku: 'LZPH-CS-JER01-XL' },
                    { id: 194, size: '2XL', color: 'Custom Print', colorHex: '#ffb800', stock: 100, price: 1199.00, sku: 'LZPH-CS-JER01-2XL' }
                ]
            }
        ];
    },

    getProducts() {
        const saved = localStorage.getItem('lazaroph_offline_products');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        const isInit = localStorage.getItem('lazaroph_store_initialized');
        if (isInit === 'true') {
            return []; // Never restore deleted products if store was already initialized!
        }
        const initial = this.getInitialProducts();
        localStorage.setItem('lazaroph_offline_products', JSON.stringify(initial));
        localStorage.setItem('lazaroph_store_initialized', 'true');
        return initial;
    },

    saveProducts(products) {
        localStorage.setItem('lazaroph_offline_products', JSON.stringify(products));
        localStorage.setItem('lazaroph_store_initialized', 'true');
    },

    updateCachedProduct(product) {
        let products = this.getProducts();
        const idx = products.findIndex(p => p.id === product.id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], ...product };
        } else {
            products.unshift(product);
        }
        this.saveProducts(products);
    },

    removeCachedProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id && String(p.id) !== String(id));
        this.saveProducts(products);
    },

    getInitialBrands() {
        return [
            { id: 1, name: 'Nike', slug: 'nike', logoUrl: 'images/brand-nike.png', description: 'World-renowned athletic sportswear, signature sneakers, and performance apparel.', status: 'ACTIVE', productCount: 4 },
            { id: 2, name: 'Jordan', slug: 'jordan', logoUrl: 'images/brand-jordan.png', description: 'Signature basketball legacy, retro high-tops, and iconic Jumpman apparel.', status: 'ACTIVE', productCount: 2 },
            { id: 3, name: 'Adidas', slug: 'adidas', logoUrl: 'images/brand-adidas.png', description: 'Iconic 3-stripes sportswear, Originals lifestyle kicks, and boost comfort.', status: 'ACTIVE', productCount: 3 },
            { id: 4, name: 'New Balance', slug: 'new-balance', logoUrl: 'images/brand-nb.png', description: 'Heritage running lifestyle, dad shoes, and superior arch support footwear.', status: 'ACTIVE', productCount: 1 },
            { id: 5, name: 'HOKA', slug: 'hoka', logoUrl: 'images/brand-hoka.png', description: 'Maximalist cushioned road running shoes, trail runners, and recovery slides.', status: 'ACTIVE', productCount: 1 },
            { id: 6, name: 'On', slug: 'on', logoUrl: 'images/brand-on.png', description: 'Swiss-engineered CloudTec running shoes, ultralight performance footwear, and apparel.', status: 'ACTIVE', productCount: 1 },
            { id: 7, name: 'Puma', slug: 'puma', logoUrl: 'images/brand-puma.png', description: 'Forever faster athletic footwear, football gear, and casual street trainers.', status: 'ACTIVE', productCount: 1 },
            { id: 8, name: 'Asics', slug: 'asics', logoUrl: 'images/brand-asics.png', description: 'Japanese performance running shoes, GEL cushioning, and ergonomic trainers.', status: 'ACTIVE', productCount: 1 },
            { id: 9, name: 'Birkenstock', slug: 'birkenstock', logoUrl: 'images/brand-birkenstock.png', description: 'Iconic German anatomical cork footbed sandals, Boston clogs, and slides.', status: 'ACTIVE', productCount: 1 },
            { id: 10, name: 'Crocs', slug: 'crocs', logoUrl: 'images/brand-crocs.png', description: 'Croslite comfort clogs, all-terrain sandals, and custom Jibbitz accessories.', status: 'ACTIVE', productCount: 1 },
            { id: 11, name: 'Converse', slug: 'converse', logoUrl: 'images/brand-converse.png', description: 'Timeless Chuck Taylor All Stars, canvas skate shoes, and street culture.', status: 'ACTIVE', productCount: 1 }
        ];
    },

    getBrands() {
        const saved = localStorage.getItem('lazaroph_offline_brands');
        let brands = [];
        if (saved) {
            try { brands = JSON.parse(saved); } catch (e) {}
        }
        if (!brands || !Array.isArray(brands) || brands.length === 0) {
            brands = this.getInitialBrands();
            localStorage.setItem('lazaroph_offline_brands', JSON.stringify(brands));
        }

        // Dynamically compute real-time product count for each brand
        const products = this.getProducts();
        brands.forEach(b => {
            b.productCount = products.filter(p => {
                return (p.brandId && p.brandId === b.id) ||
                       (p.brandName && p.brandName.toLowerCase() === b.name.toLowerCase());
            }).length;
        });

        return brands;
    },

    saveBrands(brands) {
        localStorage.setItem('lazaroph_offline_brands', JSON.stringify(brands));
        this.brands = brands;
        return brands;
    },

    getAdmins() {
        const saved = localStorage.getItem('lazaroph_fallback_admins');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 1, name: 'Clark Montoya (Super Admin 1)', email: 'admin1@lazaroph.com', passwordHash: 'd77dead9c27dd23ba226158d9fd13bc22f07650e1e1cb41c588c54458b5d2c71', pinHash: '3c262f3bcb473461cc7f976eed4262c4de30f7fcbebc6b3146b3532f26c181b2', role: 'SUPER_ADMIN', status: 'ACTIVE' },
            { id: 2, name: 'Mark Lazaro (Super Admin 2)', email: 'admin2@lazaroph.com', passwordHash: 'd77dead9c27dd23ba226158d9fd13bc22f07650e1e1cb41c588c54458b5d2c71', pinHash: '70680dc89d0c2e075ccdb0e885b6d3d119c80a34b6fd09547d9074a6074548b0', role: 'SUPER_ADMIN', status: 'ACTIVE' },
            { id: 3, name: 'Elena Santos (Super Admin 3)', email: 'admin3@lazaroph.com', passwordHash: 'd77dead9c27dd23ba226158d9fd13bc22f07650e1e1cb41c588c54458b5d2c71', pinHash: 'ebe811e8c1856b78e270b91650c20c392e5f20af711065cadac59ea75c608ca0', role: 'SUPER_ADMIN', status: 'ACTIVE' },
            { id: 4, name: 'LAZAROPH Master Administrator', email: 'admin@lazaroph.com', passwordHash: '5bbd15879f9967ce477db75b76259aa655cefc69acb57fa932a78242bbef745a', pinHash: '3c262f3bcb473461cc7f976eed4262c4de30f7fcbebc6b3146b3532f26c181b2', role: 'SUPER_ADMIN', status: 'ACTIVE' }
        ];
    },

    saveAdmins(admins) {
        localStorage.setItem('lazaroph_fallback_admins', JSON.stringify(admins));
    },

    getCustomers() {
        const saved = localStorage.getItem('lazaroph_fallback_customers');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 2, name: 'Juan Dela Cruz', email: 'customer@example.com', password: 'customer123', role: 'CUSTOMER', status: 'VERIFIED', phone: '09171234567', address: '911 J.P. Rizal St', city: 'Marikina', province: 'Metro Manila', zipCode: '1805' }
        ];
    },

    saveCustomers(customers) {
        localStorage.setItem('lazaroph_fallback_customers', JSON.stringify(customers));
    },

    getCart() {
        const saved = localStorage.getItem('lazaroph_offline_cart');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        const emptyCart = { items: [], subtotal: 0, shippingFee: 0, total: 0, totalQuantity: 0 };
        return emptyCart;
    },

    saveCart(cart) {
        let subtotal = 0;
        let totalQty = 0;
        cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
            totalQty += item.quantity;
        });
        cart.subtotal = subtotal;
        cart.totalQuantity = totalQty;
        cart.total = subtotal + (cart.shippingFee || 0);
        localStorage.setItem('lazaroph_offline_cart', JSON.stringify(cart));
        return cart;
    },

    getOrders() {
        const saved = localStorage.getItem('lazaroph_offline_orders');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
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
                items: [
                    { id: 1, productName: 'LAZAROPH Runner X1', size: 'US 10', color: 'Triple Black', quantity: 1, price: 2199.00, imageUrl: 'images/runner-x1-black-main.png' }
                ]
            }
        ];
    },

    handle(path, method = 'GET', body = null, queryParams = {}) {
        const cleanPath = path.split('?')[0];

        // 1. Admin Two-Step Authentication
        if (cleanPath === '/api/auth/admin/login-step1' || cleanPath === '/api/auth/admin/step1') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const email = (req.email || '').trim().toLowerCase();
            const password = req.password || '';

            const admins = this.getAdmins();
            const admin = admins.find(a => a.email.toLowerCase() === email);
            if (!admin) {
                throw new Error('No administrator found with this email address.');
            }
            if (admin.status === 'DISABLED') {
                throw new Error('This administrator account has been disabled.');
            }
            if (admin.passwordHash) {
                if (typeof LazarophFirebase !== 'undefined' && !LazarophFirebase.verifyPassword(password, admin.passwordHash)) {
                    throw new Error('Invalid login password. Please check your credentials.');
                }
            } else if (admin.password !== password) {
                throw new Error('Invalid login password. Please check your credentials.');
            }

            const preAuthToken = 'pre2fa_' + Math.random().toString(36).substring(2) + Date.now();
            sessionStorage.setItem('lazaroph_admin_pretoken', preAuthToken);
            sessionStorage.setItem('lazaroph_admin_pre_email', admin.email);
            sessionStorage.setItem('lazaroph_admin_pre_name', admin.name);

            return {
                success: true,
                preAuthToken,
                adminEmail: admin.email,
                adminName: admin.name,
                adminRole: admin.role,
                message: 'Step 1 verified. Please enter your Security Password.'
            };
        }

        if (cleanPath === '/api/auth/admin/verify-step2' || cleanPath === '/api/auth/admin/step2') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const preAuthToken = req.preAuthToken || sessionStorage.getItem('lazaroph_admin_pretoken');
            const pin = (req.securityPassword || req.pin || req.securityPin || '').trim();

            const savedEmail = sessionStorage.getItem('lazaroph_admin_pre_email') || '';
            const admins = this.getAdmins();
            const admin = admins.find(a => a.email.toLowerCase() === savedEmail.toLowerCase()) || admins[0];

            if (!admin) {
                throw new Error('Session expired. Please restart login from Step 1.');
            }
            if (admin.pinHash) {
                if (typeof LazarophFirebase !== 'undefined' && !LazarophFirebase.verifyPassword(pin, admin.pinHash)) {
                    throw new Error('Invalid Security Password. Please enter your correct 6-digit PIN.');
                }
            } else if (admin.securityPin && admin.securityPin !== pin) {
                throw new Error('Invalid Security Password. Please enter your correct 6-digit PIN.');
            }

            const token = 'adm_' + Math.random().toString(36).substring(2) + Date.now();
            const adminUser = {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role || 'SUPER_ADMIN',
                status: 'ACTIVE'
            };

            localStorage.setItem('lazaroph_admin_token', token);
            localStorage.setItem('lazaroph_admin_user', JSON.stringify(adminUser));

            return {
                success: true,
                token,
                adminToken: token,
                admin: adminUser,
                message: 'Two-step authentication verified.'
            };
        }

        if (cleanPath === '/api/auth/admin/me') {
            const saved = localStorage.getItem('lazaroph_admin_user');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) {}
            }
            const admins = this.getAdmins();
            return admins[0];
        }

        if (cleanPath === '/api/auth/admin/logout') {
            localStorage.removeItem('lazaroph_admin_token');
            localStorage.removeItem('lazaroph_admin_user');
            sessionStorage.removeItem('lazaroph_admin_pretoken');
            return { success: true, message: 'Admin logged out successfully' };
        }

        // 2. Customer Authentication
        if (cleanPath === '/api/auth/customer/login' || cleanPath === '/api/auth/login') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const email = (req.email || '').trim().toLowerCase();
            const password = req.password || '';

            const customers = this.getCustomers();
            const cust = customers.find(c => c.email.toLowerCase() === email) || customers[0];
            if (req.email && req.email.toLowerCase() !== 'customer@example.com' && (!cust || cust.password !== password)) {
                throw new Error('Invalid email or password.');
            }

            const token = 'cust_' + Math.random().toString(36).substring(2) + Date.now();
            const custUser = {
                id: cust.id,
                name: cust.name,
                email: cust.email,
                role: 'CUSTOMER',
                status: cust.status || 'VERIFIED',
                phone: cust.phone || '09171234567',
                address: cust.address || '911 J.P. Rizal St',
                city: cust.city || 'Marikina',
                province: cust.province || 'Metro Manila',
                zipCode: cust.zipCode || '1805'
            };
            localStorage.setItem('lazaroph_customer_token', token);
            localStorage.setItem('lazaroph_customer_user', JSON.stringify(custUser));
            return {
                success: true,
                token,
                customer: custUser,
                user: custUser
            };
        }

        if (cleanPath === '/api/auth/customer/register' || cleanPath === '/api/auth/register') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const customers = this.getCustomers();
            const email = (req.email || '').toLowerCase().trim();
            if (customers.some(c => c.email.toLowerCase() === email)) {
                throw new Error('An account with this email address already exists. Please log in.');
            }
            const newCust = {
                id: Date.now(),
                name: req.name || 'New Customer',
                email: email,
                password: req.password || 'password123',
                phone: req.phone || '',
                address: req.address || '',
                city: req.city || 'Marikina',
                province: req.province || 'Metro Manila',
                zipCode: req.zipCode || '1805',
                role: 'CUSTOMER',
                status: 'VERIFIED'
            };
            customers.push(newCust);
            this.saveCustomers(customers);
            return {
                success: true,
                message: 'Account created successfully! Verification link sent to your email.'
            };
        }

        if (cleanPath === '/api/auth/customer/verify-email') {
            return { success: true, message: 'Email verified successfully! You can now log in.' };
        }

        if (cleanPath === '/api/auth/customer/me' || cleanPath === '/api/auth/me') {
            const saved = localStorage.getItem('lazaroph_customer_user');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) {}
            }
            const custs = this.getCustomers();
            return custs[0];
        }

        if (cleanPath === '/api/auth/customer/logout' || cleanPath === '/api/auth/logout') {
            localStorage.removeItem('lazaroph_customer_token');
            localStorage.removeItem('lazaroph_customer_user');
            return { success: true, message: 'Logged out successfully' };
        }

        if (cleanPath === '/api/auth/customer/forgot-password') {
            return { success: true, message: 'If an account exists for this email, we will send you a password reset link.' };
        }

        if (cleanPath === '/api/auth/customer/reset-password') {
            return { success: true, message: 'Your password has been successfully reset. You can now log in using your new password.' };
        }

        if (cleanPath === '/api/auth/email-simulator/latest') {
            return [];
        }

        // 2. Categories & Brands
        if (cleanPath === '/api/categories') {
            return this.categories;
        }

        // Brands: GET & POST (Save / Update Brand)
        if (cleanPath === '/api/brands' || cleanPath === '/api/admin/brands' || cleanPath === '/api/admin/brands/save') {
            if (method === 'POST') {
                const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
                let brands = this.getBrands();
                let savedBrand;
                const reqId = parseInt(req.id) || 0;

                if (reqId > 0) {
                    const idx = brands.findIndex(b => b.id === reqId);
                    if (idx !== -1) {
                        savedBrand = {
                            ...brands[idx],
                            ...req,
                            id: reqId,
                            status: req.status || brands[idx].status || 'ACTIVE'
                        };
                        brands[idx] = savedBrand;
                    } else {
                        savedBrand = { ...req, id: reqId };
                        brands.push(savedBrand);
                    }
                } else {
                    const newId = brands.length > 0 ? Math.max(...brands.map(b => b.id)) + 1 : 1;
                    const slug = (req.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    savedBrand = {
                        id: newId,
                        name: req.name || 'New Brand',
                        slug: slug,
                        logoUrl: req.logoUrl || 'images/brand-nike.png',
                        description: req.description || '',
                        status: req.status || 'ACTIVE',
                        productCount: 0
                    };
                    brands.push(savedBrand);
                }
                this.saveBrands(brands);
                return { success: true, brand: savedBrand, message: 'Brand saved successfully.' };
            }
            return this.getBrands();
        }

        // Brand Status Toggle / Update
        if (cleanPath.startsWith('/api/admin/brands/status/') || cleanPath === '/api/admin/brands/status') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            let id = 0;
            if (cleanPath.startsWith('/api/admin/brands/status/')) {
                id = parseInt(cleanPath.replace('/api/admin/brands/status/', ''));
            } else {
                id = parseInt(req.id);
            }
            const status = req.status || 'ACTIVE';
            let brands = this.getBrands();
            const brand = brands.find(b => b.id === id);
            if (brand) {
                brand.status = status;
                this.saveBrands(brands);
            }
            return { success: true, brand, message: `Brand status updated to ${status}` };
        }

        // Brand Delete
        if (cleanPath.startsWith('/api/admin/brands/delete/') || (cleanPath.startsWith('/api/brands/') && method === 'DELETE')) {
            const id = parseInt(cleanPath.split('/').pop());
            let brands = this.getBrands();
            brands = brands.filter(b => b.id !== id);
            this.saveBrands(brands);
            return { success: true, message: 'Brand deleted successfully.' };
        }

        // 3. Products
        if (cleanPath === '/api/products' || cleanPath === '/api/admin/products') {
            let list = this.getProducts();

            if (queryParams.category && queryParams.category !== 'all') {
                list = list.filter(p => (p.categoryName || '').toLowerCase() === queryParams.category.toLowerCase());
            }
            if (queryParams.gender && queryParams.gender !== 'all') {
                list = list.filter(p => (p.gender || '').toUpperCase() === queryParams.gender.toUpperCase());
            }
            if (queryParams.brand && queryParams.brand !== 'all') {
                list = list.filter(p => (p.brandName || '').toLowerCase() === queryParams.brand.toLowerCase());
            }
            if (queryParams.q) {
                const q = queryParams.q.toLowerCase();
                list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
            }
            if (queryParams.inStock === 'true') {
                list = list.filter(p => p.totalStock > 0);
            }
            if (queryParams.minPrice) {
                const min = parseFloat(queryParams.minPrice);
                list = list.filter(p => (p.discountPrice || p.price) >= min);
            }
            if (queryParams.maxPrice) {
                const max = parseFloat(queryParams.maxPrice);
                list = list.filter(p => (p.discountPrice || p.price) <= max);
            }
            if (queryParams.sort === 'popular') {
                list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            } else if (queryParams.sort === 'price_asc') {
                list = [...list].sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
            } else if (queryParams.sort === 'price_desc') {
                list = [...list].sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
            }
            return list;
        }

        if (cleanPath.startsWith('/api/admin/products/delete/') || (cleanPath.startsWith('/api/products/') && method === 'DELETE')) {
            const id = parseInt(cleanPath.split('/').pop());
            let products = this.getProducts();
            products = products.filter(p => p.id !== id);
            this.saveProducts(products);
            return { success: true, message: 'Product deleted successfully.' };
        }

        if (cleanPath === '/api/admin/products/save') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            let products = this.getProducts();
            let savedProduct;
            if (req.id) {
                const idx = products.findIndex(p => p.id === req.id);
                if (idx !== -1) {
                    savedProduct = { ...products[idx], ...req };
                    products[idx] = savedProduct;
                } else {
                    savedProduct = { ...req };
                    products.push(savedProduct);
                }
            } else {
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                savedProduct = {
                    ...req,
                    id: newId,
                    sku: req.sku || ('LZPH-PRD-' + newId),
                    status: req.status || 'ACTIVE',
                    createdAt: new Date().toISOString()
                };
                products.unshift(savedProduct);
            }
            this.saveProducts(products);
            return { success: true, product: savedProduct, message: 'Product saved successfully.' };
        }

        if (cleanPath.startsWith('/api/admin/orders/delete/') || (cleanPath.startsWith('/api/orders/delete/')) || (cleanPath.startsWith('/api/admin/orders/') && method === 'DELETE')) {
            const id = parseInt(cleanPath.split('/').pop());
            let orders = this.getOrders();
            orders = orders.filter(o => o.id !== id);
            localStorage.setItem('lazaroph_offline_orders', JSON.stringify(orders));
            return { success: true, message: 'Order deleted successfully.' };
        }

        if (cleanPath.includes('/api/admin/orders/') && cleanPath.endsWith('/status')) {
            const parts = cleanPath.split('/');
            const idStr = parts[parts.indexOf('orders') + 1];
            const orderId = parseInt(idStr);
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            let orders = this.getOrders();
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.status = req.status;
                localStorage.setItem('lazaroph_offline_orders', JSON.stringify(orders));
            }
            return { success: true, order, message: 'Order status updated successfully.' };
        }

        if (cleanPath.includes('/api/admin/orders/') && cleanPath.endsWith('/delivery')) {
            const parts = cleanPath.split('/');
            const idStr = parts[parts.indexOf('orders') + 1];
            const orderId = parseInt(idStr);
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            let orders = this.getOrders();
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.riderName = req.riderName || order.riderName;
                order.riderPhone = req.riderPhone || order.riderPhone;
                order.estimatedDeliveryTime = req.estimatedDeliveryTime || order.estimatedDeliveryTime;
                localStorage.setItem('lazaroph_offline_orders', JSON.stringify(orders));
            }
            return { success: true, order, message: 'Delivery information updated.' };
        }

        if (cleanPath.startsWith('/api/admin/custom-orders/delete/') || (cleanPath.startsWith('/api/admin/custom-orders/') && method === 'DELETE')) {
            const id = parseInt(cleanPath.split('/').pop());
            const raw = localStorage.getItem('lazaroph_offline_custom_orders');
            let orders = raw ? JSON.parse(raw) : [
                { id: 1, orderNumber: 'LZPH-20260825-0001', customerName: 'Juan Dela Cruz', teamName: 'MANILA KINGS', playerName: 'DELA CRUZ', playerNumber: '24', size: 'L', designStyle: 'pro-elite', productionStatus: 'DESIGN_APPROVED', createdAt: '2026-08-25T10:00:00' }
            ];
            orders = orders.filter(o => o.id !== id);
            localStorage.setItem('lazaroph_offline_custom_orders', JSON.stringify(orders));
            return { success: true, message: 'Custom order deleted successfully.' };
        }

        if (cleanPath === '/api/admin/inventory/update-stock') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const products = this.getProducts();
            products.forEach(p => {
                (p.variants || []).forEach(v => {
                    if (v.id === req.variantId) {
                        v.stock = req.stock;
                    }
                });
            });
            this.saveProducts(products);
            return { success: true, message: 'Stock updated successfully.' };
        }

        if (cleanPath.startsWith('/api/products/')) {
            const id = parseInt(cleanPath.replace('/api/products/', ''));
            const p = this.getProducts().find(item => item.id === id);
            if (!p) throw new Error('Product not found');
            return p;
        }

        // 4. Cart
        if (cleanPath === '/api/cart') {
            return this.getCart();
        }

        if (cleanPath === '/api/cart/add') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const cart = this.getCart();
            const product = this.getProducts().find(p => p.id === req.productId);
            const variant = product ? (product.variants || []).find(v => v.id === req.variantId) : null;

            const newItem = {
                id: Date.now(),
                productId: req.productId,
                variantId: req.variantId,
                productName: product ? product.name : 'Authentic Item',
                size: variant ? variant.size : 'Standard',
                color: variant ? variant.color : 'Standard',
                price: product ? (product.discountPrice || product.price) : 1000,
                quantity: req.quantity || 1,
                subtotal: (product ? (product.discountPrice || product.price) : 1000) * (req.quantity || 1),
                imageUrl: product ? product.mainImageUrl : 'images/placeholder-product.png',
                customizationData: req.customizationData ? JSON.stringify(req.customizationData) : null
            };

            cart.items.push(newItem);
            return this.saveCart(cart);
        }

        if (cleanPath === '/api/cart/update') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const cart = this.getCart();
            const item = cart.items.find(i => i.id === req.cartItemId);
            if (item) {
                if (req.quantity <= 0) {
                    cart.items = cart.items.filter(i => i.id !== req.cartItemId);
                } else {
                    item.quantity = req.quantity;
                    item.subtotal = item.price * item.quantity;
                }
            }
            return this.saveCart(cart);
        }

        if (cleanPath === '/api/cart/remove') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const cart = this.getCart();
            cart.items = cart.items.filter(i => i.id !== req.cartItemId);
            return this.saveCart(cart);
        }

        if (cleanPath === '/api/cart/clear') {
            const cart = { items: [], subtotal: 0, shippingFee: 0, total: 0, totalQuantity: 0 };
            return this.saveCart(cart);
        }

        // 5. Checkout & Orders
        if (cleanPath === '/api/checkout') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const cart = this.getCart();
            const orderNum = 'LZPH-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000);
            
            const newOrder = {
                id: Date.now(),
                orderNumber: orderNum,
                customerName: req.customerName || 'Customer',
                customerEmail: req.customerEmail || 'customer@example.com',
                customerPhone: req.customerPhone || '09171234567',
                shippingAddress: req.shippingAddress || 'Marikina City',
                status: 'PENDING',
                paymentMethod: req.paymentMethod || 'GCash',
                paymentStatus: 'PENDING_VERIFICATION',
                courier: req.courier || 'LALAMOVE',
                subtotal: cart.subtotal || 1000,
                shippingFee: req.courier === 'STORE_PICKUP' ? 0 : 150,
                totalAmount: (cart.subtotal || 1000) + (req.courier === 'STORE_PICKUP' ? 0 : 150),
                deliveryFeeConfirmed: req.courier === 'STORE_PICKUP',
                items: [...cart.items]
            };

            const orders = this.getOrders();
            orders.unshift(newOrder);
            localStorage.setItem('lazaroph_offline_orders', JSON.stringify(orders));

            // Clear cart after checkout
            this.saveCart({ items: [], subtotal: 0, shippingFee: 0, total: 0, totalQuantity: 0 });

            return { order: newOrder, orderNumber: orderNum, success: true };
        }

        if (cleanPath.startsWith('/api/orders/track/')) {
            const orderNum = decodeURIComponent(cleanPath.replace('/api/orders/track/', ''));
            const orders = this.getOrders();
            const found = orders.find(o => o.orderNumber.toUpperCase() === orderNum.toUpperCase());
            if (!found) throw new Error(`Order "${orderNum}" not found.`);
            return found;
        }

        if (cleanPath === '/api/orders/my-orders') {
            return this.getOrders();
        }

        // 6. Settings & Admin
        if (cleanPath === '/api/settings' || cleanPath === '/api/admin/settings') {
            return this.storeSettings;
        }

        if (cleanPath === '/api/admin/stats' || cleanPath === '/api/admin/overview') {
            return {
                totalSales: 18450.00,
                totalOrders: 6,
                totalCustomers: 4,
                totalProducts: this.getProducts().length,
                lowStockCount: 2,
                pendingOrdersCount: 1,
                recentOrders: this.getOrders().slice(0, 5)
            };
        }

        if (cleanPath === '/api/admin/inventory') {
            const items = [];
            this.getProducts().forEach(p => {
                (p.variants || []).forEach(v => {
                    items.push({
                        variantId: v.id,
                        productId: p.id,
                        productName: p.name,
                        mainImageUrl: p.mainImageUrl,
                        sku: v.sku || p.sku,
                        size: v.size,
                        color: v.color,
                        price: v.price,
                        stock: v.stock,
                        status: p.status
                    });
                });
            });
            return items;
        }

        if (cleanPath === '/api/admin/custom-orders') {
            return [
                {
                    id: 1,
                    orderNumber: 'LZPH-20260825-0001',
                    customerName: 'Juan Dela Cruz',
                    teamName: 'MANILA KINGS',
                    playerName: 'DELA CRUZ',
                    playerNumber: '24',
                    size: 'L',
                    designStyle: 'pro-elite',
                    productionStatus: 'DESIGN_APPROVED',
                    createdAt: '2026-08-25T10:00:00'
                }
            ];
        }

        if (cleanPath === '/api/admin/customers') {
            return [
                { id: 1, name: 'LAZAROPH Administrator', email: 'admin@lazaroph.com', role: 'ADMIN', phone: '282948572', ordersCount: 0 },
                { id: 2, name: 'Juan Dela Cruz', email: 'customer@example.com', role: 'CUSTOMER', phone: '09171234567', ordersCount: 3 }
            ];
        }

        if (cleanPath === '/api/chat/unread-count') {
            return { unreadCount: 0 };
        }

        if (cleanPath === '/api/chat/conversations') {
            return [];
        }

        if (cleanPath === '/api/chat/upload-image') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            return {
                id: Date.now(),
                conversationId: req.conversationId,
                senderId: 2,
                senderName: 'Customer',
                senderRole: 'CUSTOMER',
                message: req.message || '💳 [PROOF OF PAYMENT] Receipt submitted for order verification.',
                imageUrl: req.imageData,
                messageType: req.messageType || 'PAYMENT_PROOF',
                createdAt: new Date().toISOString()
            };
        }

        if (cleanPath.includes('/verify-payment')) {
            return {
                id: Date.now(),
                senderRole: 'ADMIN',
                message: '✅ PAYMENT VERIFIED & CONFIRMED: Payment receipt has been verified by Administrator.',
                messageType: 'PAYMENT_VERIFIED',
                createdAt: new Date().toISOString()
            };
        }

        if (cleanPath === '/api/admin/admins') {
            const rawAdmins = localStorage.getItem('lazaroph_offline_admins');
            let admins = rawAdmins ? JSON.parse(rawAdmins) : [
                { id: 1, name: 'Clark Montoya (Super Admin 1)', email: 'admin1@lazaroph.com', role: 'SUPER_ADMIN', status: 'ACTIVE', hasSecurityPin: true, isLocked: false, createdAt: '2026-08-25T00:00:00Z' },
                { id: 2, name: 'Mark Lazaro (Super Admin 2)', email: 'admin2@lazaroph.com', role: 'SUPER_ADMIN', status: 'ACTIVE', hasSecurityPin: true, isLocked: false, createdAt: '2026-08-25T00:00:00Z' },
                { id: 3, name: 'Elena Santos (Super Admin 3)', email: 'admin3@lazaroph.com', role: 'SUPER_ADMIN', status: 'ACTIVE', hasSecurityPin: true, isLocked: false, createdAt: '2026-08-25T00:00:00Z' }
            ];

            if (method === 'POST') {
                const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
                const newAdmin = {
                    id: admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1,
                    name: req.name || 'New Super Admin',
                    email: (req.email || '').toLowerCase().trim(),
                    role: req.role || 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    hasSecurityPin: true,
                    isLocked: false,
                    createdAt: new Date().toISOString()
                };
                admins.push(newAdmin);
                localStorage.setItem('lazaroph_offline_admins', JSON.stringify(admins));
                return newAdmin;
            }
            return admins;
        }

        if (cleanPath === '/api/admin/admins/status') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const rawAdmins = localStorage.getItem('lazaroph_offline_admins');
            let admins = rawAdmins ? JSON.parse(rawAdmins) : [];
            const target = admins.find(a => a.id === req.adminId);
            if (target) {
                target.status = req.status;
                localStorage.setItem('lazaroph_offline_admins', JSON.stringify(admins));
                return target;
            }
            return { status: req.status };
        }

        if (cleanPath === '/api/admin/admins/reset-security') {
            return { message: 'Admin credentials reset successfully.' };
        }

        if (cleanPath === '/api/admin/admins/delete') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const rawAdmins = localStorage.getItem('lazaroph_offline_admins');
            if (rawAdmins) {
                let admins = JSON.parse(rawAdmins);
                admins = admins.filter(a => a.id !== req.adminId);
                localStorage.setItem('lazaroph_offline_admins', JSON.stringify(admins));
            }
            return { message: 'Administrator deleted successfully.' };
        }

        if (cleanPath === '/api/featured-categories') {
            const rawCats = localStorage.getItem('lazaroph_featured_cats');
            if (rawCats) {
                try { return JSON.parse(rawCats); } catch (e) {}
            }
            return [
                { key: 'men', name: 'MEN', badge: "MEN'S COLLECTION", description: 'Authentic shoes, performance apparel, shorts, and gear.', buttonText: 'SHOP MEN', targetRoute: 'shop?gender=MEN', cardSize: 'cat-large', imageUrl: 'images/category-men.jpg' },
                { key: 'women', name: 'WOMEN', badge: "WOMEN'S COLLECTION", description: 'Street classics, running sneakers, and athletic lifestyle.', buttonText: 'SHOP WOMEN', targetRoute: 'shop?gender=WOMEN', cardSize: 'cat-large', imageUrl: 'images/category-women.jpg' },
                { key: 'kids', name: 'KIDS', badge: 'YOUTH ATHLETIC', description: 'Youth athletic shoes & sportswear.', buttonText: 'SHOP KIDS', targetRoute: 'shop?gender=KIDS', cardSize: 'cat-medium', imageUrl: 'images/category-kids.jpg' },
                { key: 'slides', name: 'SLIDES', badge: 'COMFORT FOOTWEAR', description: 'Authentic athletic slides, recovery slide sandals & comfort footwear.', buttonText: 'SHOP SLIDES', targetRoute: 'shop?category=Slides', cardSize: 'cat-medium', imageUrl: 'images/cat-slides.png' },
                { key: 'watches', name: 'WATCHES', badge: 'TIMEPIECES', description: 'Sports, digital, and classic timepieces.', buttonText: 'SHOP WATCHES', targetRoute: 'shop?category=Watches', cardSize: 'cat-medium', imageUrl: 'images/category-watches.jpg' }
            ];
        }

        if (cleanPath === '/api/admin/featured-categories/upload') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const key = (req.categoryKey || '').toLowerCase();
            const cats = this.handle('/api/featured-categories');
            const target = cats.find(c => c.key === key);
            const newUrl = req.imageData;
            if (target) {
                target.imageUrl = newUrl;
                localStorage.setItem('lazaroph_featured_cats', JSON.stringify(cats));
            }
            return { success: true, imageUrl: newUrl, category: target, message: `Image for ${key.toUpperCase()} uploaded successfully!` };
        }

        if (cleanPath === '/api/admin/featured-categories/reset') {
            const req = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
            const key = (req.categoryKey || '').toLowerCase();
            const cats = this.handle('/api/featured-categories');
            const target = cats.find(c => c.key === key);
            const defaultUrl = key === 'slides' ? 'images/cat-slides.png' : `images/category-${key}.jpg`;
            if (target) {
                target.imageUrl = defaultUrl;
                localStorage.setItem('lazaroph_featured_cats', JSON.stringify(cats));
            }
            return target;
        }

        // Default empty array/object fallback
        return [];
    }
};

// ================= REST API CLIENT =================
const API = {
    customBaseUrl: null,
    isOffline: false,

    getBaseUrl() {
        if (this.customBaseUrl !== null) return this.customBaseUrl;
        if (typeof window !== 'undefined') {
            // When opened directly via file:/// or from a separate dev server port like 5500/3000/5173
            if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8080')) {
                return localStorage.getItem('lazaroph_custom_api_url') || 'http://localhost:8080';
            }
        }
        return '';
    },

    getToken() {
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#admin')) {
            const adminToken = localStorage.getItem('lazaroph_admin_token');
            if (adminToken) return adminToken;
        }
        return localStorage.getItem('lazaroph_token') || localStorage.getItem('lazaroph_admin_token') || '';
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('lazaroph_token', token);
        } else {
            localStorage.removeItem('lazaroph_token');
        }
    },

    getSessionKey() {
        let key = localStorage.getItem('lazaroph_session_key');
        if (!key) {
            key = 'sess_' + Math.random().toString(36).substring(2) + Date.now();
            localStorage.setItem('lazaroph_session_key', key);
        }
        return key;
    },

    async request(path, options = {}) {
        const baseUrl = this.getBaseUrl();
        const fullUrl = (baseUrl ? baseUrl.replace(/\/$/, '') : '') + (path.startsWith('/') ? path : '/' + path);

        const headers = {
            'Content-Type': 'application/json',
            'X-Session-Key': this.getSessionKey(),
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s fast timeout before fallback

            const res = await fetch(fullUrl, {
                ...options,
                headers,
                signal: controller.signal
            });
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('API returned non-JSON response');
            }

            const data = await res.json();
            if (!res.ok || data.success === false) {
                const errorMsg = data.error || data.message || 'An error occurred';
                const err = new Error(errorMsg);
                err.status = res.status;
                err.data = data;
                err.isServerResponse = true;
                throw err;
            }

            // Connection succeeded! Update status
            if (this.isOffline) {
                this.isOffline = false;
                this.notifyConnectionStatus(true);
            }

            return data.data !== undefined ? data.data : data;
        } catch (err) {
            if (err.isServerResponse) {
                throw err;
            }
            // Self-Healing: Fall back to local embedded store seamlessly!
            console.warn(`[LAZAROPH API] Backend unreachable at ${fullUrl}. Using local fallback store. Details:`, err.message);
            
            if (!this.isOffline) {
                this.isOffline = true;
                this.notifyConnectionStatus(false);
            }

            // Extract query parameters
            const queryParams = {};
            const qIndex = path.indexOf('?');
            if (qIndex !== -1) {
                const queryStr = path.substring(qIndex + 1);
                new URLSearchParams(queryStr).forEach((v, k) => {
                    queryParams[k] = v;
                });
            }

            try {
                return FallbackStore.handle(path, options.method || 'GET', options.body, queryParams);
            } catch (fallbackErr) {
                console.error(`[Fallback Store Error] ${path}:`, fallbackErr);
                throw fallbackErr;
            }
        }
    },

    notifyConnectionStatus(isOnline) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lazaroph:connection-status', {
                detail: { isOnline }
            }));
            this.updateConnectionBanner(isOnline);
        }
    },

    updateConnectionBanner(isOnline) {
        const isLocalDev = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:'
        );
        if (!isLocalDev) {
            const existing = document.getElementById('connection-status-banner');
            if (existing) existing.style.display = 'none';
            return;
        }

        let banner = document.getElementById('connection-status-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'connection-status-banner';
            banner.style.cssText = 'display: none; background: #090d16; border-bottom: 1px solid #1e293b; padding: 6px 16px; font-size: 0.8rem; text-align: center; color: #94a3b8; transition: all 0.3s ease; position: sticky; top: 0; z-index: 99999;';
            document.body.insertBefore(banner, document.body.firstChild);
        }

        if (isOnline) {
            banner.style.display = 'none';
        } else {
            banner.style.display = 'block';
            banner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span>
                    <span><strong>Local Preview Mode:</strong> Backend server (port 8080) is offline. Showing authentic cached catalog.</span>
                    <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem; background: #1e293b; color: #ffffff; border: 1px solid #334155; cursor: pointer; border-radius: 4px;" onclick="API.retryConnection()">
                        🔄 Reconnect Server
                    </button>
                </div>
            `;
        }
    },

    async retryConnection() {
        showToast('Checking connection to http://localhost:8080...', 'info');
        try {
            const res = await fetch((this.getBaseUrl() || 'http://localhost:8080') + '/api/categories', { method: 'GET' });
            if (res.ok) {
                this.isOffline = false;
                this.notifyConnectionStatus(true);
                showToast('Connected to LAZAROPH live server!', 'success');
                if (typeof Store !== 'undefined' && Store.loadCatalog) {
                    Store.loadCatalog();
                }
                if (typeof Store !== 'undefined' && Store.loadHomeFeatured) {
                    Store.loadHomeFeatured();
                }
            } else {
                throw new Error('Server returned ' + res.status);
            }
        } catch (e) {
            showToast('Server not reachable. Please start server with run.bat.', 'error');
            this.notifyConnectionStatus(false);
        }
    },

    // ================= CUSTOMER AUTH API =================
    customerRegister(data) {
        return this.request('/api/auth/customer/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    customerLogin(email, password) {
        return this.request('/api/auth/customer/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    customerVerifyEmail(token) {
        return this.request('/api/auth/customer/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    },

    customerResendVerification(email) {
        return this.request('/api/auth/customer/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    customerForgotPassword(email) {
        return this.request('/api/auth/customer/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    customerResetPassword(token, newPassword, confirmPassword) {
        return this.request('/api/auth/customer/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword, confirmPassword })
        });
    },

    customerGetMe() {
        return this.request('/api/auth/customer/me');
    },

    customerLogout() {
        return this.request('/api/auth/customer/logout', { method: 'POST' });
    },

    // ================= ADMIN TWO-STEP AUTH API =================
    adminLoginStep1(email, password) {
        return this.request('/api/auth/admin/login-step1', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    adminVerifyStep2(preAuthToken, securityPassword) {
        return this.request('/api/auth/admin/verify-step2', {
            method: 'POST',
            body: JSON.stringify({ preAuthToken, securityPassword })
        });
    },

    adminGetMe() {
        return this.request('/api/auth/admin/me');
    },

    adminLogout() {
        return this.request('/api/auth/admin/logout', { method: 'POST' });
    },

    // ================= ADMIN MANAGEMENT API =================
    getAdminList() {
        return this.request('/api/admin/admins');
    },

    createAdmin(data) {
        return this.request('/api/admin/admins', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateAdminStatus(adminId, status) {
        return this.request('/api/admin/admins/status', {
            method: 'POST',
            body: JSON.stringify({ adminId, status })
        });
    },

    resetAdminSecurity(adminId, password, securityPassword) {
        return this.request('/api/admin/admins/reset-security', {
            method: 'POST',
            body: JSON.stringify({ adminId, password, securityPassword })
        });
    },

    deleteAdmin(adminId) {
        return this.request('/api/admin/admins/delete', {
            method: 'POST',
            body: JSON.stringify({ adminId })
        });
    },

    // ================= HOMEPAGE FEATURED CATEGORIES API =================
    getFeaturedCategories() {
        return this.request('/api/featured-categories');
    },

    uploadFeaturedCategory(data) {
        return this.request('/api/admin/featured-categories/upload', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    resetFeaturedCategory(categoryKey) {
        return this.request('/api/admin/featured-categories/reset', {
            method: 'POST',
            body: JSON.stringify({ categoryKey })
        });
    },

    // ================= EMAIL SIMULATOR API =================
    getSimulatedEmails() {
        return this.request('/api/auth/email-simulator/latest');
    },

    // Legacy Auth (kept for compatibility)
    login(email, password) {
        return this.customerLogin(email, password);
    },

    register(userData) {
        return this.customerRegister(userData);
    },

    getMe() {
        return this.customerGetMe();
    },

    logout() {
        return this.customerLogout();
    },

    // Catalog & Products
    async getProducts(params = {}) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.getProducts(params);
        }
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== '') {
                query.append(k, v);
            }
        }
        return this.request(`/api/products?${query.toString()}`);
    },

    getProductById(id) {
        return this.request(`/api/products/${id}`);
    },

    getCategories() {
        return this.request('/api/categories');
    },

    async getBrands() {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.getBrands();
        }
        return this.request('/api/brands');
    },

    // Cart
    getCart() {
        return this.request('/api/cart');
    },

    addToCart(productId, variantId, quantity = 1, customizationData = null) {
        return this.request('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, variantId, quantity, customizationData })
        });
    },

    updateCartQuantity(cartItemId, quantity) {
        return this.request('/api/cart/update', {
            method: 'POST',
            body: JSON.stringify({ cartItemId, quantity })
        });
    },

    removeFromCart(cartItemId) {
        return this.request('/api/cart/remove', {
            method: 'POST',
            body: JSON.stringify({ cartItemId })
        });
    },

    clearCart() {
        return this.request('/api/cart/clear', { method: 'POST' });
    },

    // Checkout & Orders
    checkout(orderData) {
        return this.request('/api/checkout', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    getMyOrders() {
        return this.request('/api/orders/my-orders');
    },

    getUserOrders() {
        return this.getMyOrders();
    },

    trackOrder(orderNumber) {
        return this.request(`/api/orders/track/${encodeURIComponent(orderNumber)}`);
    },

    // Wishlist
    getWishlist() {
        return this.request('/api/wishlist');
    },

    toggleWishlist(productId) {
        return this.request('/api/wishlist/toggle', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    },

    // Admin
    getAdminStats() {
        return this.request('/api/admin/stats');
    },

    getAdminProducts() {
        return this.request('/api/admin/products');
    },

    async saveProduct(productData) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.saveProduct(productData);
        }
        return this.request('/api/admin/products/save', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    async deleteProduct(id) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.deleteProduct(id);
        }
        return this.request(`/api/admin/products/delete/${id}`, { method: 'POST' });
    },

    getAdminInventory() {
        return this.request('/api/admin/inventory');
    },

    updateInventoryStock(variantId, stock) {
        return this.request('/api/admin/inventory/update-stock', {
            method: 'POST',
            body: JSON.stringify({ variantId, stock })
        });
    },

    async getAdminOrders() {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.getOrders();
        }
        return this.request('/api/admin/orders');
    },

    async updateOrderStatus(orderId, status) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.updateOrderStatus(orderId, status);
        }
        return this.request(`/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            body: JSON.stringify({ orderId, status })
        });
    },

    deleteAdminOrder(orderId) {
        return this.request(`/api/admin/orders/delete/${orderId}`, { method: 'POST' });
    },

    getAdminCustomOrders() {
        return this.request('/api/admin/custom-orders');
    },

    deleteCustomOrder(id) {
        return this.request(`/api/admin/custom-orders/delete/${id}`, { method: 'POST' });
    },

    updateCustomOrderStatus(customOrderId, status) {
        return this.request('/api/admin/custom-orders/status', {
            method: 'POST',
            body: JSON.stringify({ customOrderId, status })
        });
    },

    getAdminCustomers() {
        return this.request('/api/admin/customers');
    },

    getStoreSettings() {
        return this.request('/api/settings');
    },

    getAdminSettings() {
        return this.request('/api/admin/settings');
    },

    saveAdminSettings(settings) {
        return this.request('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    },

    // Admin Brand Management
    async getAdminBrands() {
        return this.getBrands();
    },

    async saveAdminBrand(brandData) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.saveBrand(brandData);
        }
        return this.request('/api/admin/brands', {
            method: 'POST',
            body: JSON.stringify(brandData)
        });
    },

    async deleteAdminBrand(id) {
        if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.isReady && LazarophFirebase.db) {
            return LazarophFirebase.deleteBrand(id);
        }
        return this.request(`/api/admin/brands/delete/${id}`, { method: 'POST' });
    },

    updateAdminBrandStatus(id, status) {
        return this.request(`/api/admin/brands/status/${id}`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    },

    updateAdminProfile(profileData) {
        return this.request('/api/admin/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    },

    // Courier & Logistics API Methods
    getCourierQuotes(city = '', province = '') {
        const query = new URLSearchParams();
        if (city) query.append('city', city);
        if (province) query.append('province', province);
        return this.request(`/api/couriers/quotes?${query.toString()}`);
    },

    dispatchLalamove(orderId, vehicleType = 'Motorcycle') {
        return this.request('/api/admin/orders/dispatch-lalamove', {
            method: 'POST',
            body: JSON.stringify({ orderId, vehicleType })
        });
    },

    generateLbcWaybill(orderId, packagingType = 'KiloBox Large') {
        return this.request('/api/admin/orders/generate-lbc-waybill', {
            method: 'POST',
            body: JSON.stringify({ orderId, packagingType })
        });
    },

    updateCourierStatus(orderId, courierStatus) {
        return this.request('/api/admin/orders/courier-status', {
            method: 'POST',
            body: JSON.stringify({ orderId, courierStatus })
        });
    },

    // Manual Delivery Management
    updateOrderDelivery(orderId, deliveryData) {
        return this.request(`/api/admin/orders/${orderId}/delivery`, {
            method: 'POST',
            body: JSON.stringify(deliveryData)
        });
    },

    // Built-in Chat & Messaging System
    getConversations() {
        return this.request('/api/chat/conversations');
    },

    startConversation(data = {}) {
        return this.request('/api/chat/start', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getConversationMessages(conversationId) {
        return this.request(`/api/chat/conversations/${conversationId}/messages`);
    },

    sendChatMessage(conversationId, message, imageUrl = null, messageType = 'TEXT') {
        return this.request(`/api/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message, imageUrl, messageType })
        });
    },

    uploadChatImage(conversationId, data) {
        return this.request('/api/chat/upload-image', {
            method: 'POST',
            body: JSON.stringify({ conversationId, ...data })
        });
    },

    verifyChatPayment(conversationId) {
        return this.request(`/api/chat/conversations/${conversationId}/verify-payment`, {
            method: 'POST'
        });
    },

    markConversationRead(conversationId) {
        return this.request(`/api/chat/conversations/${conversationId}/read`, {
            method: 'POST'
        });
    },

    getUnreadChatCount() {
        return this.request('/api/chat/unread-count');
    },

    getCourierSettings() {
        return this.request('/api/admin/courier-settings');
    },

    saveCourierSettings(settings) {
        return this.request('/api/admin/courier-settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
};

// UI Toast Notification Helper
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<strong>${iconSvg}</strong> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatMoney(amount) {
    if (amount === null || amount === undefined) return '₱0.00';
    const num = parseFloat(amount);
    return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
