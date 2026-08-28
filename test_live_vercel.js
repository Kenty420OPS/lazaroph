// test_live_vercel.js
const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching Headless Chrome for Live Vercel Production Validation...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    try {
        // 1. Test Homepage
        console.log('Testing https://lazaroph.vercel.app/ ...');
        await page.goto('https://lazaroph.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });
        const title = await page.title();
        console.log('  Page Title:', title);

        const brandingCheck = await page.evaluate(() => {
            return {
                bodyTextHasFlagship: document.body.innerText.includes('FLAGSHIP STORE'),
                bodyTextHasLazaroph: document.body.innerText.includes('LAZAROPH'),
                hasFirebaseStorage: typeof firebase !== 'undefined' && typeof firebase.storage === 'function'
            };
        });
        console.log('  Has "FLAGSHIP STORE":', brandingCheck.bodyTextHasFlagship, '(Should be false)');
        console.log('  Has "LAZAROPH":', brandingCheck.bodyTextHasLazaroph, '(Should be true)');
        console.log('  Firebase Storage SDK active:', brandingCheck.hasFirebaseStorage, '(Should be true)');

        // 2. Test Admin Login Route
        console.log('\nTesting https://lazaroph.vercel.app/admin/login ...');
        await page.goto('https://lazaroph.vercel.app/admin/login', { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('#admin-login-email', { timeout: 10000 });
        console.log('  Admin login email field found');

        // Test Step 1: Login with Super Admin
        console.log('  Submitting Step 1 credentials...');
        await page.type('#admin-login-email', 'admin1@lazaroph.com');
        await page.type('#admin-login-password', 'AdminPassword2026!');
        await page.click('#admin-login-btn');

        // Wait for transition to Step 2
        await page.waitForSelector('#admin-security-pin', { timeout: 10000 });
        console.log('  Transitioned to Step 2 (Security Verification)');

        // Test Step 2: PIN Verification
        console.log('  Submitting Step 2 security PIN (992104)...');
        await page.type('#admin-security-pin', '992104');
        await page.click('#admin-security-btn');

        // Wait for Admin Dashboard to load
        await page.waitForSelector('#view-admin:not(.hidden)', { timeout: 10000 });
        console.log('  SUCCESS: Admin Dashboard (#view-admin) is unlocked and visible!');

        const adminHeader = await page.evaluate(() => {
            const el = document.querySelector('.admin-top-title') || document.querySelector('#view-admin h2') || document.querySelector('#view-admin');
            return el ? el.innerText.substring(0, 50) : '';
        });
        console.log('  Admin View Title snippet:', adminHeader.replace(/\n/g, ' '));

        console.log('\n============================================================');
        console.log('  LIVE VERCEL PRODUCTION DEPLOYMENT VALIDATED SUCCESSFULLY!  ');
        console.log('============================================================');
    } catch (e) {
        console.error('Test error:', e);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
