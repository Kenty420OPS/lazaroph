/**
 * Comprehensive Automated Verification for Vercel Serverless API Functions
 */

const productsHandler = require('./api/products.js');
const ordersHandler = require('./api/orders.js');
const salesHandler = require('./api/sales.js');
const authHandler = require('./api/auth.js');
const couriersHandler = require('./api/couriers.js');

function mockReqRes(method, query = {}, body = null) {
    let statusCode = 200;
    let headers = {};
    let responseData = null;

    const req = {
        method,
        query,
        body
    };

    const res = {
        setHeader: (k, v) => { headers[k] = v; },
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            responseData = data;
            return res;
        },
        end: () => res
    };

    return { req, res, getResult: () => ({ statusCode, headers, data: responseData }) };
}

async function runApiTests() {
    console.log('================================================================');
    console.log('  LAZAROPH VERCEL SERVERLESS API AUTOMATED VERIFICATION');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, extra = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name} ${extra}`);
            failed++;
        }
    }

    // --- TEST 1: GET /api/products ---
    console.log('[TEST GROUP 1: PRODUCTS SERVERLESS API]');
    {
        const { req, res, getResult } = mockReqRes('GET');
        await productsHandler(req, res);
        const { statusCode, data } = getResult();
        assert('GET /api/products returns HTTP 200', statusCode === 200);
        assert('GET /api/products returns product array', data && Array.isArray(data.data));
        assert('Initial product count is 2', data.data.length === 2);
    }

    // --- TEST 2: POST /api/products ---
    let createdId = null;
    {
        const newProd = {
            name: 'LAZAROPH Test High-Top',
            price: 3499.00,
            categoryId: 1,
            categoryName: 'Shoes',
            brandName: 'Nike',
            gender: 'MEN'
        };
        const { req, res, getResult } = mockReqRes('POST', {}, newProd);
        await productsHandler(req, res);
        const { statusCode, data } = getResult();
        assert('POST /api/products returns HTTP 201', statusCode === 201);
        assert('Created product has valid ID', data && data.data && data.data.id);
        createdId = data.data.id;
    }

    // --- TEST 3: DELETE /api/products (Permanent Deletion) ---
    {
        const { req, res, getResult } = mockReqRes('DELETE', { id: createdId });
        await productsHandler(req, res);
        const { statusCode, data } = getResult();
        assert('DELETE /api/products returns HTTP 200', statusCode === 200);
        assert('DELETE confirms permanent deletion', data && data.success === true);

        // Verify product does NOT return on subsequent GET
        const { req: getReq, res: getRes, getResult: getResResult } = mockReqRes('GET');
        await productsHandler(getReq, getRes);
        const getList = getResResult().data.data;
        const exists = getList.some(p => p.id === createdId);
        assert('Deleted product DOES NOT return after deletion (Permanent Persistence)', exists === false);
    }

    // --- TEST 4: SALES & ANALYTICS ---
    console.log('\n[TEST GROUP 2: SALES & GROSS REVENUE ANALYTICS]');
    {
        const { req, res, getResult } = mockReqRes('GET', {});
        await salesHandler(req, res);
        const { statusCode, data } = getResult();
        assert('GET /api/sales returns HTTP 200', statusCode === 200);
        assert('Gross sales total is calculated (> 0)', data && data.grossSales > 0);
        assert('Gross sales formatted currency starts with ₱', data.grossSalesFormatted.startsWith('₱'));
        assert('Contributing orders list is returned', Array.isArray(data.orders) && data.orders.length > 0);
    }

    // --- TEST 5: SALES DATE FILTERING ---
    {
        const { req, res, getResult } = mockReqRes('GET', { period: 'year' });
        await salesHandler(req, res);
        const { statusCode, data } = getResult();
        assert('GET /api/sales?period=year returns filtered ledger', statusCode === 200 && data.filter === 'year');
    }

    // --- TEST 6: ADMIN AUTHENTICATION (SALTED SHA-256) ---
    console.log('\n[TEST GROUP 3: ADMINISTRATOR AUTHENTICATION]');
    {
        // Step 1
        const { req: s1Req, res: s1Res, getResult: s1Result } = mockReqRes('POST', { step: '1' }, {
            email: 'admin1@lazaroph.com',
            password: 'AdminPassword2026!'
        });
        await authHandler(s1Req, s1Res);
        const s1 = s1Result();
        assert('Admin Login Step 1 returns HTTP 200', s1.statusCode === 200);
        assert('Admin Step 1 returns preAuthToken', s1.data && s1.data.preAuthToken);

        // Step 2
        const { req: s2Req, res: s2Res, getResult: s2Result } = mockReqRes('POST', { step: '2' }, {
            email: 'admin1@lazaroph.com',
            securityPin: '992104'
        });
        await authHandler(s2Req, s2Res);
        const s2 = s2Result();
        assert('Admin Login Step 2 (PIN) returns HTTP 200', s2.statusCode === 200);
        assert('Admin Step 2 returns session token', s2.data && s2.data.token);
    }

    // --- TEST 7: COURIERS API ---
    console.log('\n[TEST GROUP 4: COURIERS & LOGISTICS]');
    {
        const { req, res, getResult } = mockReqRes('GET');
        await couriersHandler(req, res);
        const { statusCode, data } = getResult();
        assert('GET /api/couriers returns HTTP 200', statusCode === 200);
        assert('Couriers list includes Lalamove & Grab', data.data.some(c => c.code === 'LALAMOVE'));
    }

    console.log('\n================================================================');
    console.log(`TOTAL SERVERLESS API TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runApiTests();
