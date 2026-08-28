/**
 * Automated Live Vercel Production Verification Script
 */

const https = require('https');

function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testLiveVercel() {
    console.log('================================================================');
    console.log('  TESTING LIVE VERCEL PRODUCTION DEPLOYMENT');
    console.log('  URL: https://lazaroph.vercel.app');
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

    try {
        // Test 1: Storefront Root
        console.log('[TEST GROUP 1: STOREFRONT & PAGES]');
        const homeRes = await fetchUrl('https://lazaroph.vercel.app');
        assert('Storefront / returns HTTP 200', homeRes.status === 200);
        assert('Storefront contains LAZAROPH branding', homeRes.body.includes('LAZAROPH'));
        assert('Storefront contains NO "FLAGSHIP STORE"', !homeRes.body.includes('FLAGSHIP STORE'));

        // Test 2: Direct SPA Route /register
        const regRes = await fetchUrl('https://lazaroph.vercel.app/register');
        assert('Direct route /register returns HTTP 200', regRes.status === 200);
        assert('Register page contains registration form', regRes.body.includes('cust-reg-form'));
        assert('Register page contains Google Sign-In button', regRes.body.includes('cust-google-reg-btn'));
        assert('Register page contains "OR CONTINUE WITH" divider', regRes.body.includes('OR CONTINUE WITH'));

        // Test 2B: Direct SPA Route /login
        const loginRes = await fetchUrl('https://lazaroph.vercel.app/login');
        assert('Direct route /login returns HTTP 200', loginRes.status === 200);
        assert('Login page contains Google Sign-In button', loginRes.body.includes('cust-google-login-btn'));
        assert('Login page contains "Continue with Google" label', loginRes.body.includes('Continue with Google'));

        // Test 3: Direct SPA Route /admin/dashboard
        const adminRes = await fetchUrl('https://lazaroph.vercel.app/admin/dashboard');
        assert('Direct route /admin/dashboard returns HTTP 200', adminRes.status === 200);
        assert('Admin dashboard contains KPI grid', adminRes.body.includes('kpi-grid') || adminRes.body.includes('admin-layout'));

        // Test 3B: Direct SPA Route /admin/sales
        const adminSalesRes = await fetchUrl('https://lazaroph.vercel.app/admin/sales');
        assert('Direct route /admin/sales returns HTTP 200', adminSalesRes.status === 200);

        // Test 3C: Direct SPA Route /admin/gross-sales
        const grossSalesRes = await fetchUrl('https://lazaroph.vercel.app/admin/gross-sales');
        assert('Direct route /admin/gross-sales returns HTTP 200', grossSalesRes.status === 200);

        // Test 4: Direct SPA Route /shop
        const shopRes = await fetchUrl('https://lazaroph.vercel.app/shop');
        assert('Direct route /shop returns HTTP 200', shopRes.status === 200);

        // Test 4B: Direct SPA Route /account
        const accountRes = await fetchUrl('https://lazaroph.vercel.app/account');
        assert('Direct route /account returns HTTP 200', accountRes.status === 200);
        assert('Live site contains NO "view-customer-verify-pending"', !accountRes.body.includes('view-customer-verify-pending'));
        assert('Live site contains NO "Account Activation Required" screen', !accountRes.body.includes('Account Activation Required'));

        // Test 5: Vercel Serverless API /api/products
        console.log('\n[TEST GROUP 2: VERCEL SERVERLESS API ENDPOINTS]');
        const prodRes = await fetchUrl('https://lazaroph.vercel.app/api/products');
        assert('GET /api/products returns HTTP 200', prodRes.status === 200);
        assert('GET /api/products returns JSON content-type', (prodRes.headers['content-type'] || '').includes('application/json'));
        
        let prodJson = null;
        try { prodJson = JSON.parse(prodRes.body); } catch (e) {}
        assert('GET /api/products parsed valid JSON', prodJson !== null);
        assert('GET /api/products returns products array', prodJson && Array.isArray(prodJson.data));

        // Test 6: Vercel Serverless API /api/sales
        const salesRes = await fetchUrl('https://lazaroph.vercel.app/api/sales');
        assert('GET /api/sales returns HTTP 200', salesRes.status === 200);
        assert('GET /api/sales returns JSON content-type', (salesRes.headers['content-type'] || '').includes('application/json'));
        
        let salesJson = null;
        try { salesJson = JSON.parse(salesRes.body); } catch (e) {}
        assert('GET /api/sales returns valid Gross Sales metrics', salesJson && salesJson.grossSales > 0);
        assert('GET /api/sales returns PHP formatted currency (₱)', salesJson && salesJson.grossSalesFormatted && salesJson.grossSalesFormatted.startsWith('₱'));

        // Test 7: Vercel Serverless API /api/orders
        const ordersRes = await fetchUrl('https://lazaroph.vercel.app/api/orders');
        assert('GET /api/orders returns HTTP 200', ordersRes.status === 200);
        
        let ordersJson = null;
        try { ordersJson = JSON.parse(ordersRes.body); } catch (e) {}
        assert('GET /api/orders returns orders array', ordersJson && Array.isArray(ordersJson.data));

        // Test 8: Vercel Serverless API /api/couriers
        const couriersRes = await fetchUrl('https://lazaroph.vercel.app/api/couriers');
        assert('GET /api/couriers returns HTTP 200', couriersRes.status === 200);

        console.log('\n================================================================');
        console.log(`TOTAL LIVE PRODUCTION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
        console.log('================================================================');

    } catch (err) {
        console.error('Fatal testing error:', err);
    }
}

testLiveVercel();
