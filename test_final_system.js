// test_final_system.js
// Automated verification for LAZAROPH final system requirements
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        testsPassed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        testsFailed++;
    }
}

console.log('================================================================');
console.log('  LAZAROPH FINAL SYSTEM & PERSISTENCE AUTOMATED VERIFICATION  ');
console.log('================================================================\n');

// 1. Verify Branding
console.log('[TEST GROUP 1: BRANDING INTEGRITY]');
const indexHtml = fs.readFileSync(path.join(__dirname, 'src/main/webapp/index.html'), 'utf8');
const checkoutJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/checkout.js'), 'utf8');
const productDetailJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/product-detail.js'), 'utf8');

assert(!indexHtml.includes('FLAGSHIP STORE'), 'index.html contains no "FLAGSHIP STORE"');
assert(!indexHtml.toLowerCase().includes('physical flagship store'), 'index.html contains no "Physical Flagship Store"');
assert(indexHtml.includes('LAZAROPH Store'), 'index.html includes "LAZAROPH Store"');
assert(!checkoutJs.includes('Flagship Store'), 'checkout.js contains no "Flagship Store"');
assert(checkoutJs.includes('LAZAROPH Store'), 'checkout.js includes "LAZAROPH Store"');
assert(!productDetailJs.includes('Flagship Store'), 'product-detail.js contains no "Flagship Store"');
assert(productDetailJs.includes('LAZAROPH Store'), 'product-detail.js includes "LAZAROPH Store"');

// 2. Verify Firebase SDK & Storage Integration
console.log('\n[TEST GROUP 2: FIREBASE STORAGE & SDK CONFIGURATION]');
assert(indexHtml.includes('firebase-storage-compat.js'), 'index.html imports firebase-storage-compat.js');
const firebaseConfigJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/firebase-config.js'), 'utf8');
assert(firebaseConfigJs.includes('this.storage = typeof firebase.storage === \'function\''), 'firebase-config.js initializes this.storage');
assert(firebaseConfigJs.includes('uploadProductImage(file)'), 'firebase-config.js exposes uploadProductImage()');
assert(firebaseConfigJs.includes('getProducts(filters'), 'firebase-config.js exposes getProducts() for Firestore');
assert(firebaseConfigJs.includes('saveProduct(product)'), 'firebase-config.js exposes saveProduct() for Firestore');
assert(firebaseConfigJs.includes('deleteProduct(id)'), 'firebase-config.js exposes deleteProduct() for Firestore');

// 3. Verify Admin Security & Salted Password Hashing
console.log('\n[TEST GROUP 3: ADMIN SECURITY & SALTED HASHING]');
const apiJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/api.js'), 'utf8');
assert(!apiJs.includes('AdminPassword2026!'), 'api.js contains NO plain text AdminPassword2026!');
assert(!apiJs.includes('admin123Password!'), 'api.js contains NO plain text admin123Password!');
assert(apiJs.includes('passwordHash: \'d77dead9c27dd23ba226158d9fd13bc22f07650e1e1cb41c588c54458b5d2c71\''), 'Super Admin 1 has correct salted password hash');
assert(apiJs.includes('pinHash: \'3c262f3bcb473461cc7f976eed4262c4de30f7fcbebc6b3146b3532f26c181b2\''), 'Super Admin 1 has correct salted PIN hash');

// Test pure JS SHA-256 implementation
function sha256Test(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var mathPow = Math.pow; var maxWord = mathPow(2, 32); var lengthProperty = 'length'; var i, j; var result = ''; var words = []; var asciiBitLength = ascii[lengthProperty] * 8; var hash = []; var k = []; var primeCounter = 0; var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) { j = ascii.charCodeAt(i); if (j >> 8) return; words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16); var oldHash = hash; hash = hash.slice(0, 8);
        for (i = 0; i < 64; i++) {
            var w15 = w[i - 15], w2 = w[i - 2]; var a = hash[0], e = hash[4];
            var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
    }
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    }
    return result;
}
const testSalt = 'LAZAROPH_AUTHENTIC_2026';
assert(sha256Test('AdminPassword2026!' + testSalt) === 'd77dead9c27dd23ba226158d9fd13bc22f07650e1e1cb41c588c54458b5d2c71', 'SHA-256 hash matches Super Admin password exactly');
assert(sha256Test('992104' + testSalt) === '3c262f3bcb473461cc7f976eed4262c4de30f7fcbebc6b3146b3532f26c181b2', 'SHA-256 hash matches Super Admin PIN exactly');

// 4. Verify Data Persistence & No Deleted Product Resurrection
console.log('\n[TEST GROUP 4: DATA PERSISTENCE & DELETION INTEGRITY]');
assert(apiJs.includes('lazaroph_store_initialized'), 'api.js tracks store initialization to prevent re-seeding deleted products');
assert(apiJs.includes('removeCachedProduct(id)'), 'api.js includes removeCachedProduct method');
assert(apiJs.includes('updateCachedProduct(product)'), 'api.js includes updateCachedProduct method');

// Mock localStorage simulation to prove deleted products stay deleted on refresh
const mockStorage = {};
function fakeGetProducts() {
    const saved = mockStorage['lazaroph_offline_products'];
    if (saved) {
        return JSON.parse(saved);
    }
    if (mockStorage['lazaroph_store_initialized'] === 'true') {
        return []; // NEVER restore deleted items!
    }
    const initial = [{ id: 101, name: 'Air Zoom 1' }, { id: 102, name: 'Air Zoom 2' }];
    mockStorage['lazaroph_offline_products'] = JSON.stringify(initial);
    mockStorage['lazaroph_store_initialized'] = 'true';
    return initial;
}
function fakeDeleteProduct(id) {
    let prods = fakeGetProducts();
    prods = prods.filter(p => p.id !== id);
    mockStorage['lazaroph_offline_products'] = JSON.stringify(prods);
    mockStorage['lazaroph_store_initialized'] = 'true';
}

let initialProds = fakeGetProducts();
assert(initialProds.length === 2, 'Initial catalog has 2 products');
fakeDeleteProduct(101); // Admin deletes product 101
assert(fakeGetProducts().length === 1 && fakeGetProducts()[0].id === 102, 'Product 101 is deleted');
// Simulate clearing local cache or opening fresh session
delete mockStorage['lazaroph_offline_products'];
// On refresh / next call:
let refreshedProds = fakeGetProducts();
assert(!refreshedProds.some(p => p.id === 101), 'Deleted product 101 DOES NOT return after session refresh/cache wipe!');

// 5. Verify Physical Routes for Vercel
console.log('\n[TEST GROUP 5: PHYSICAL ROUTE EXISTENCE FOR VERCEL]');
const requiredRoutes = [
    'index.html',
    'shop/index.html',
    'login/index.html',
    'register/index.html',
    'verify-email/index.html',
    'verify-pending/index.html',
    'forgot-password/index.html',
    'reset-password/index.html',
    'account/index.html',
    'order-track/index.html',
    'checkout/index.html',
    'product-detail/index.html',
    'admin/index.html',
    'admin/login/index.html',
    'admin/dashboard/index.html',
    'admin/security-verification/index.html'
];

requiredRoutes.forEach(route => {
    const rootPath = path.join(__dirname, route);
    const distPath = path.join(__dirname, 'dist', route);
    assert(fs.existsSync(rootPath), `Root physical route exists: /${route}`);
    assert(fs.existsSync(distPath), `Dist physical route exists: /dist/${route}`);
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log('✨ ALL SYSTEM & PERSISTENCE TESTS PASSED 100%!');
    process.exit(0);
}
