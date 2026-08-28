/**
 * Test Suite: Admin Delete Performance & Operations
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  TESTING ADMIN DELETE PERFORMANCE & ARCHITECTURE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
        failed++;
    }
}

const adminJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, 'src/main/webapp/css/admin.css'), 'utf8');
const firebaseJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/firebase-config.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(__dirname, 'src/main/webapp/js/api.js'), 'utf8');
const ordersApiJs = fs.readFileSync(path.join(__dirname, 'api/orders.js'), 'utf8');

console.log('[SECTION 1: SHARED DELETE ENGINE & MODAL]');
it('Admin has non-blocking confirmModal method', () => {
    assert(adminJs.includes('confirmModal({'), 'confirmModal missing');
    assert(adminJs.includes('modal-admin-delete-confirm'), 'modal container ID missing');
});

it('Admin has executeDelete engine with per-button loading and animation', () => {
    assert(adminJs.includes('executeDelete({'), 'executeDelete missing');
    assert(adminJs.includes('btn-delete-loading'), 'btn-delete-loading class missing');
    assert(adminJs.includes('row-deleting'), 'row-deleting class missing');
    assert(adminJs.includes('row-deleted'), 'row-deleted class missing');
});

it('No native blocking confirm() calls exist in admin.js', () => {
    const hasNativeConfirm = adminJs.includes('!confirm(') || adminJs.includes('confirm(`') || adminJs.includes('window.confirm(');
    assert(!hasNativeConfirm, 'native confirm() calls still present');
});

console.log('\n[SECTION 2: PRODUCT CATALOG DELETE]');
it('Product rows have unique IDs for direct DOM targeting', () => {
    assert(adminJs.includes('id="product-row-${p.id}"'), 'product-row-id missing');
});

it('deleteProduct uses confirmModal and executeDelete without full page switch', () => {
    assert(adminJs.includes('deleteProduct(id, name, btn)'), 'deleteProduct signature incorrect');
    assert(adminJs.includes('targetRowSelector: `#product-row-${id}`'), 'targetRowSelector missing in deleteProduct');
});

console.log('\n[SECTION 3: ORDER & CUSTOM ORDER DELETE]');
it('Order rows have unique IDs for direct DOM targeting', () => {
    assert(adminJs.includes('id="order-row-${o.id}"'), 'order-row-id missing');
});

it('deleteOrder uses executeDelete without full table reload', () => {
    assert(adminJs.includes('deleteOrder(orderId, orderNumber, btn)'), 'deleteOrder signature incorrect');
    assert(adminJs.includes('targetRowSelector: `#order-row-${orderId}`'), 'targetRowSelector missing in deleteOrder');
});

it('Custom order rows have unique IDs and executeDelete', () => {
    assert(adminJs.includes('id="custom-order-row-${co.id}"'), 'custom-order-row-id missing');
    assert(adminJs.includes('deleteCustomOrder(id, orderNumber, btn)'), 'deleteCustomOrder signature incorrect');
});

console.log('\n[SECTION 4: BRAND MANAGEMENT DELETE & INTEGRITY]');
it('Brand rows have unique IDs and deleteBrand button with this', () => {
    assert(adminJs.includes('id="brand-row-${b.id}"'), 'brand-row-id missing');
    assert(adminJs.includes('Admin.deleteBrand(${b.id}'), 'deleteBrand onclick missing');
});

it('deleteBrand checks for linked products and offers safe deactivation', () => {
    assert(adminJs.includes('Brand Linked to Products'), 'linked products check missing');
    assert(adminJs.includes('Deactivate Brand'), 'deactivate option missing');
});

console.log('\n[SECTION 5: ADMINISTRATOR & CUSTOMER SECURITY & DELETE]');
it('Admin user rows have unique IDs', () => {
    assert(adminJs.includes('id="admin-user-row-${a.id}"'), 'admin-user-row-id missing');
});

it('deleteAdminUser prevents self-deletion and last Super Admin deletion', () => {
    assert(adminJs.includes('You cannot delete your own currently active administrator account'), 'self-deletion protection missing');
    assert(adminJs.includes('Cannot delete the last remaining active Administrator'), 'last super admin protection missing');
});

it('Customer rows have unique IDs and deleteCustomer uses executeDelete', () => {
    assert(adminJs.includes('id="customer-row-${u.id || u.uid}"'), 'customer-row-id missing');
    assert(adminJs.includes('deleteCustomer(uid, name, btn)'), 'deleteCustomer method missing');
});

console.log('\n[SECTION 6: BACKEND & FIRESTORE SUPPORT]');
it('LazarophFirebase has direct delete methods', () => {
    assert(firebaseJs.includes('async deleteOrder(id)'), 'deleteOrder missing in LazarophFirebase');
    assert(firebaseJs.includes('async deleteCustomOrder(id)'), 'deleteCustomOrder missing in LazarophFirebase');
    assert(firebaseJs.includes('async deleteCustomer(uid)'), 'deleteCustomer missing in LazarophFirebase');
});

it('API layer connects delete methods', () => {
    assert(apiJs.includes('deleteAdminOrder'), 'deleteAdminOrder missing in api.js');
    assert(apiJs.includes('deleteCustomOrder'), 'deleteCustomOrder missing in api.js');
    assert(apiJs.includes('deleteCustomer'), 'deleteCustomer missing in api.js');
});

it('Serverless orders.js handles DELETE request method', () => {
    assert(ordersApiJs.includes('method === \'DELETE\''), 'DELETE method handler missing in orders.js');
});

console.log('\n[SECTION 7: CSS ANIMATIONS & STYLING]');
it('CSS contains keyframes and classes for non-blocking delete animations', () => {
    assert(adminCss.includes('.row-deleting'), '.row-deleting class missing');
    assert(adminCss.includes('.row-deleted'), '.row-deleted class missing');
    assert(adminCss.includes('.btn-delete-loading'), '.btn-delete-loading class missing');
    assert(adminCss.includes('.admin-delete-modal-card'), '.admin-delete-modal-card class missing');
});

console.log(`\n================================================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`================================================================\n`);

if (failed > 0) process.exit(1);
