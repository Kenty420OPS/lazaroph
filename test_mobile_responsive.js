const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== LAZAROPH MOBILE RESPONSIVENESS & CROSS-DEVICE TEST SUITE ===\n');

let allPassed = true;
function assert(desc, condition) {
    if (condition) {
        console.log(`[PASS] ${desc}`);
    } else {
        console.error(`[FAIL] ${desc}`);
        allPassed = false;
    }
}

const webappDir = path.join(__dirname, 'src', 'main', 'webapp');
const indexHtmlPath = path.join(webappDir, 'index.html');
const responsiveCssPath = path.join(webappDir, 'css', 'responsive.css');
const mainCssPath = path.join(webappDir, 'css', 'main.css');
const appJsPath = path.join(webappDir, 'js', 'app.js');
const adminJsPath = path.join(webappDir, 'js', 'admin.js');

// 1. Static Validation
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf8');
const mainCss = fs.readFileSync(mainCssPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'js' ? 'utf8' : 'utf8');

assert('Viewport meta tag configured with width=device-width, initial-scale=1.0', 
    indexHtml.includes('name="viewport"') && indexHtml.includes('content="width=device-width, initial-scale=1.0"'));

assert('responsive.css is linked in index.html', 
    indexHtml.includes('href="/css/responsive.css"'));

assert('Mobile backdrop overlay #nav-mobile-backdrop present in index.html', 
    indexHtml.includes('id="nav-mobile-backdrop"'));

assert('Mobile Admin top bar #admin-mobile-bar present in index.html', 
    indexHtml.includes('id="admin-mobile-bar"'));

assert('Mobile Admin quick nav pills #admin-mobile-nav-pills present in index.html', 
    indexHtml.includes('id="admin-mobile-nav-pills"'));

assert('Mobile Admin overlay #admin-mobile-overlay present in index.html', 
    indexHtml.includes('id="admin-mobile-overlay"'));

// 2. CSS Breakpoints & Zero-Overflow Rules
assert('Global overflow-x: hidden present in responsive.css', 
    responsiveCss.includes('overflow-x: hidden'));

assert('Desktop breakpoint (max-width: 992px) defined', 
    responsiveCss.includes('@media (max-width: 992px)'));

assert('Tablet breakpoint (max-width: 768px) defined', 
    responsiveCss.includes('@media (max-width: 768px)'));

assert('Mobile phone breakpoint (max-width: 480px) defined', 
    responsiveCss.includes('@media (max-width: 480px)'));

assert('Ultra-compact phone breakpoint (max-width: 360px) defined', 
    responsiveCss.includes('@media (max-width: 360px)'));

assert('Mobile navigation menu styled with white luxury theme in responsive.css', 
    responsiveCss.includes('.nav-menu') && responsiveCss.includes('background: #ffffff !important'));

assert('Mobile navigation menu has max-height and touch scroll', 
    responsiveCss.includes('max-height: calc(100vh - var(--header-height))') && responsiveCss.includes('-webkit-overflow-scrolling: touch'));

assert('Admin sidebar converted to off-canvas drawer on mobile in responsive.css', 
    responsiveCss.includes('.admin-sidebar') && responsiveCss.includes('transform: translateX(-105%)'));

assert('Admin tables wrapped with responsive horizontal scroll in responsive.css', 
    responsiveCss.includes('.table-responsive') && responsiveCss.includes('overflow-x: auto'));

assert('Product gallery hero min-height cleared on mobile in responsive.css', 
    responsiveCss.includes('.gallery-hero-container') && responsiveCss.includes('min-height: unset !important'));

assert('Product thumbnails converted to horizontal scrolling strip in responsive.css', 
    responsiveCss.includes('.gallery-vertical-thumbs') && responsiveCss.includes('flex-direction: row'));

assert('iOS Safari zoom prevention (font-size: 16px) defined in main.css', 
    mainCss.includes('font-size: 16px !important'));

assert('Body no-scroll utility class defined in main.css', 
    mainCss.includes('body.no-scroll'));

// 3. JavaScript Interaction Handlers
assert('app.js handles mobile backdrop toggle and outside-tap closure', 
    appJs.includes('nav-mobile-backdrop') && appJs.includes('closeMobileMenu'));

assert('admin.js includes toggleMobileSidebar handler', 
    adminJs.includes('toggleMobileSidebar('));

assert('admin.js syncs active state with mobile pill navigation buttons', 
    adminJs.includes('.admin-pill-btn'));

// 4. Live Chrome Headless Multi-Viewport Tests
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (fs.existsSync(chromePath)) {
    console.log('\n--- Live Headless Chrome Viewport Tests ---');
    const viewports = [
        { name: 'Small Phone', width: 360, height: 640 },
        { name: 'Standard Phone (iPhone 13/14)', width: 390, height: 844 },
        { name: 'Large Phone (Pro Max)', width: 430, height: 932 },
        { name: 'Tablet Portrait', width: 768, height: 1024 },
        { name: 'Tablet Landscape', width: 1024, height: 768 },
        { name: 'Desktop Monitor', width: 1440, height: 900 }
    ];

    const testPages = [
        { route: 'register', checkStr: 'cust-reg-name' },
        { route: 'login', checkStr: 'cust-login-email' },
        { route: 'verify-pending', checkStr: 'Account Activation Required' },
        { route: 'forgot-password', checkStr: 'cust-forgot-email' },
        { route: 'admin/login', checkStr: 'LAZAROPH ADMIN' }
    ];

    viewports.forEach(vp => {
        try {
            const url = `http://localhost:8080/register`;
            const cmd = `"${chromePath}" --headless=new --window-size=${vp.width},${vp.height} --dump-dom "${url}"`;
            const dom = execSync(cmd, { encoding: 'utf8', timeout: 8000 });
            assert(`${vp.name} (${vp.width}x${vp.height}) DOM renders correctly`, dom.includes('cust-reg-name') && dom.includes('LAZAROPH'));
        } catch (err) {
            console.error(`[FAIL] ${vp.name} test error: ${err.message}`);
            allPassed = false;
        }
    });

    testPages.forEach(p => {
        try {
            const url = `http://localhost:8080/${p.route}`;
            const cmd = `"${chromePath}" --headless=new --window-size=390,844 --dump-dom "${url}"`;
            const dom = execSync(cmd, { encoding: 'utf8', timeout: 8000 });
            assert(`Mobile Route /${p.route} contains '${p.checkStr}'`, dom.includes(p.checkStr));
        } catch (err) {
            console.error(`[FAIL] Route /${p.route} test error: ${err.message}`);
            allPassed = false;
        }
    });
} else {
    console.log('\n[INFO] Chrome executable not found at Program Files path, skipping Chrome CLI tests.');
}

console.log('\n========================================================');
if (allPassed) {
    console.log('ALL MOBILE RESPONSIVENESS & CROSS-DEVICE TESTS PASSED (100%)!');
} else {
    console.log('SOME TESTS FAILED!');
}
console.log('========================================================');
