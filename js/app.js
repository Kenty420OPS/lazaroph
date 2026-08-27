/**
 * LAZAROPH — Master Application Coordinator & SPA Router
 */

const App = {
    currentView: 'home',

    async init() {
        // Initialize Core Modules
        await Auth.init();
        await Cart.init();
        Store.init();

        // Bind Routing & Global Events
        this.bindEvents();
        this.handleRoute();

        window.addEventListener('hashchange', () => this.handleRoute());
    },

    bindEvents() {
        // Mobile Hamburger Menu Toggle & Backdrop
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('main-nav-menu');
        const navBackdrop = document.getElementById('nav-mobile-backdrop');

        const closeMobileMenu = () => {
            if (navMenu) navMenu.classList.remove('mobile-open');
            if (navBackdrop) navBackdrop.classList.remove('active');
            document.body.classList.remove('no-scroll');
        };

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('mobile-open');
                if (navBackdrop) navBackdrop.classList.toggle('active', isOpen);
                document.body.classList.toggle('no-scroll', isOpen);
            });
        }

        if (navBackdrop) {
            navBackdrop.addEventListener('click', closeMobileMenu);
        }

        // Close mobile menu when a nav link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close mobile menu on desktop resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                closeMobileMenu();
            }
        });

        // Account Header Button
        const accountBtn = document.getElementById('btn-header-account');
        if (accountBtn) {
            accountBtn.addEventListener('click', () => {
                if (Auth.currentUser) {
                    this.navigate('account');
                } else {
                    Auth.openAuthModal('login');
                }
            });
        }

        // Wishlist Header Button
        const wishlistBtn = document.getElementById('btn-header-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                if (!Auth.currentUser) {
                    Auth.openAuthModal('login');
                    showToast('Please log in to view your wishlist.', 'info');
                } else {
                    this.navigate('account');
                }
            });
        }

        // Cart Header Button
        const cartBtn = document.getElementById('btn-header-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                Cart.openDrawer();
            });
        }
    },

    navigate(view, params = {}) {
        let hash = '#' + view;
        if (params.id) hash += `?id=${params.id}`;
        if (params.category) hash += `?category=${encodeURIComponent(params.category)}`;
        if (params.gender) hash += `?gender=${encodeURIComponent(params.gender)}`;
        if (params.brand) hash += `?brand=${encodeURIComponent(params.brand)}`;
        if (params.orderNumber) hash += `?orderNumber=${encodeURIComponent(params.orderNumber)}`;
        if (params.productId) hash += `?productId=${params.productId}`;

        window.location.hash = hash;
    },

    handleRoute() {
        // Support direct pathname routing (/login, /register, etc.) and hash routing (#login, etc.)
        let fullPath = window.location.pathname || '';
        if (fullPath.startsWith('/')) fullPath = fullPath.substring(1);
        if (fullPath.endsWith('/')) fullPath = fullPath.slice(0, -1);

        const fullHash = window.location.hash || '';
        let view = 'home';
        let queryString = '';

        if (fullHash) {
            const [rawView, qs] = fullHash.substring(1).split('?');
            view = rawView || 'home';
            queryString = qs || '';
        } else if (fullPath && fullPath !== 'index.html') {
            view = fullPath;
            queryString = window.location.search ? window.location.search.substring(1) : '';
        }

        const params = {};
        if (queryString) {
            new URLSearchParams(queryString).forEach((val, key) => {
                params[key] = val;
            });
        }

        // Check for Firebase Auth Action URL parameters (e.g. ?mode=verifyEmail&oobCode=... or ?mode=resetPassword&oobCode=...)
        const searchParams = new URLSearchParams(window.location.search);
        const fbMode = searchParams.get('mode') || params.mode;
        const fbOobCode = searchParams.get('oobCode') || params.oobCode;

        if (fbMode === 'verifyEmail' && fbOobCode) {
            view = 'verify-email';
            params.token = fbOobCode;
            params.oobCode = fbOobCode;
        } else if (fbMode === 'resetPassword' && fbOobCode) {
            view = 'reset-password';
            params.token = fbOobCode;
            params.oobCode = fbOobCode;
        }

        this.currentRouteParams = params;
        this.showView(view, params);
    },

    showView(view, params = {}) {
        this.currentView = view;

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        // Reset active nav state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Toggle Admin vs Storefront Headers
        const siteHeader = document.getElementById('site-header');
        const siteFooters = document.querySelectorAll('.site-footer');
        const announcementBar = document.getElementById('announcement-bar');

        // ADMIN ROUTES & GUARD
        if (view === 'admin' || view === 'admin/dashboard' || view.startsWith('admin/')) {
            document.body.classList.add('admin-mode');
            if (siteHeader) {
                siteHeader.classList.add('hidden');
                siteHeader.style.setProperty('display', 'none', 'important');
            }
            siteFooters.forEach(f => {
                f.classList.add('hidden');
                f.style.setProperty('display', 'none', 'important');
            });
            if (announcementBar) {
                announcementBar.classList.add('hidden');
                announcementBar.style.setProperty('display', 'none', 'important');
            }

            // Close customer floating chat if open
            if (typeof Chat !== 'undefined' && Chat.isOpen) {
                Chat.toggle();
            }

            // Admin Step 1: Login
            if (view === 'admin/login') {
                if (AdminAuth.isVerified()) {
                    this.navigate('admin/dashboard');
                    return;
                }
                const el = document.getElementById('view-admin-login');
                if (el) el.classList.remove('hidden');
                return;
            }

            // Admin Step 2: Security Verification
            if (view === 'admin/security-verification') {
                if (!AdminAuth.getPreToken()) {
                    showToast('Please sign in with your admin credentials first.', 'info');
                    this.navigate('admin/login');
                    return;
                }

                const el = document.getElementById('view-admin-security');
                if (el) el.classList.remove('hidden');
                return;
            }

            // Admin Dashboard Guard: Strict 2-Step Verified Admin Session Required!
            if (!AdminAuth.isVerified()) {
                showToast('Admin session required. Please authenticate.', 'info');
                this.navigate('admin/login');
                return;
            }

            const viewAdmin = document.getElementById('view-admin');
            if (viewAdmin) {
                viewAdmin.classList.remove('hidden');
                Admin.init();
                if (params.tab) {
                    Admin.switchTab(params.tab);
                }
            }
            return;
        }

        // Restore storefront chrome
        document.body.classList.remove('admin-mode');
        if (siteHeader) {
            siteHeader.classList.remove('hidden');
            siteHeader.style.removeProperty('display');
        }
        siteFooters.forEach(f => {
            f.classList.remove('hidden');
            f.style.removeProperty('display');
        });
        if (announcementBar) {
            announcementBar.classList.remove('hidden');
            announcementBar.style.removeProperty('display');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (view === 'home') {
            const el = document.getElementById('view-home');
            if (el) el.classList.remove('hidden');
            const navLink = document.querySelector('.nav-link[href="#home"]');
            if (navLink) navLink.classList.add('active');
            Store.loadHomeFeatured();
            if (typeof Brands !== 'undefined') Brands.loadHomeShowcase();
        } else if (view === 'brands') {
            const el = document.getElementById('view-brands');
            if (el) el.classList.remove('hidden');
            const navLink = document.getElementById('nav-brands-link');
            if (navLink) navLink.classList.add('active');
            if (typeof Brands !== 'undefined') Brands.init();
        } else if (view === 'shop') {
            const el = document.getElementById('view-shop');
            if (el) el.classList.remove('hidden');

            if (params.brand) {
                Store.currentFilters.brand = params.brand;
            }
            if (params.category) {
                Store.currentFilters.category = params.category;
                const catRadio = document.querySelector(`input[name="filter_cat"][value="${params.category}"]`);
                if (catRadio) catRadio.checked = true;
            }
            if (params.gender) {
                Store.currentFilters.gender = params.gender;
                const genRadio = document.querySelector(`input[name="filter_gender"][value="${params.gender}"]`);
                if (genRadio) genRadio.checked = true;
            }

            Store.loadBrandFilters();
            Store.loadCatalog();
        } else if (view === 'product') {
            const el = document.getElementById('view-product-detail');
            if (el) el.classList.remove('hidden');
            if (params.id) {
                ProductDetail.load(parseInt(params.id));
            }
        } else if (view === 'customizer') {
            const el = document.getElementById('view-customizer');
            if (el) el.classList.remove('hidden');
            Customizer.init(params.productId ? parseInt(params.productId) : 9);
        } else if (view === 'checkout') {
            const el = document.getElementById('view-checkout');
            if (el) el.classList.remove('hidden');
            Checkout.init();
        } else if (view === 'order-track') {
            const el = document.getElementById('view-order-track');
            if (el) el.classList.remove('hidden');
            Orders.track(params.orderNumber);
        } else if (view === 'account') {
            const el = document.getElementById('view-account');
            if (el) el.classList.remove('hidden');
            this.loadAccountView();
        } else if (view === 'verify-pending') {
            const el = document.getElementById('view-customer-verify-pending');
            if (el) {
                el.classList.remove('hidden');
                const emailEl = document.getElementById('cust-pending-user-email');
                const u = CustomerAuth.getCustomer();
                if (emailEl) emailEl.textContent = (u && u.email) || 'your registered email';
            }
        } else if (view === 'login') {
            const el = document.getElementById('view-customer-login');
            if (el) el.classList.remove('hidden');
        } else if (view === 'register') {
            const el = document.getElementById('view-customer-register');
            if (el) {
                el.classList.remove('hidden');
                const formC = document.getElementById('cust-reg-form-container');
                const succC = document.getElementById('cust-reg-success-container');
                if (formC) formC.style.display = 'block';
                if (succC) succC.style.display = 'none';
            }
        } else if (view === 'verify-email') {
            const el = document.getElementById('view-customer-verify-email');
            if (el) el.classList.remove('hidden');
            const token = params.oobCode || params.token;
            if (token) {
                CustomerAuth.runVerifyEmail(token);
            }
        } else if (view === 'forgot-password') {
            const el = document.getElementById('view-customer-forgot-password');
            if (el) el.classList.remove('hidden');
        } else if (view === 'reset-password') {
            const el = document.getElementById('view-customer-reset-password');
            if (el) el.classList.remove('hidden');
        }
    },

    loadAccountView() {
        const container = document.getElementById('view-account');
        if (!container) return;

        if (!CustomerAuth.isLoggedIn() && !Auth.currentUser) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <h2>Customer Login Required</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">Please sign in to view your orders, addresses, and account details.</p>
                    <button class="btn btn-primary btn-lg" onclick="App.navigate('login')">Go to Login</button>
                </div>
            `;
            return;
        }

        const u = CustomerAuth.getCustomer() || Auth.currentUser;

        // UNVERIFIED CUSTOMER RESTRICTION: Do not grant full access until verified with Firebase Auth
        if (!CustomerAuth.isEmailVerified()) {
            container.innerHTML = `
                <div class="container" style="padding: 50px 20px 80px; max-width: 580px; margin: 0 auto;">
                    <div class="verify-pending-card">
                        <div class="verify-pending-icon">⚠️</div>
                        <h2 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; margin-bottom: 10px;">
                            Please verify your email address to activate your account.
                        </h2>
                        <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 18px;">
                            A verification link was sent to <strong style="color: #0f172a;">${escapeHtml(u.email)}</strong>. You must verify ownership of this email address before you can access your customer profile, order history, and checkout.
                        </p>
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 0.88rem; color: #92400e;">
                            Status: <strong>Verification Required</strong> — Click the link sent to your inbox.
                        </div>
                        <div id="cust-account-alert" class="auth-alert"></div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-account-check-status" onclick="CustomerAuth.checkStatus()">
                                🔄 Check Verification Status
                            </button>
                            <button type="button" class="btn btn-secondary btn-block" id="btn-account-resend-verification" onclick="CustomerAuth.resendVerification()">
                                📧 Resend Verification Email
                            </button>
                            <button type="button" class="btn btn-block" style="background: none; color: #64748b; text-decoration: underline;" onclick="CustomerAuth.logout()">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="container" style="padding: 40px 0 80px;">
                <div class="section-header" style="margin-bottom: 32px;">
                    <div>
                        <div class="section-subtitle">LAZAROPH CUSTOMER PORTAL</div>
                        <h1 class="section-title">WELCOME, ${escapeHtml(u.name.toUpperCase())}</h1>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" onclick="CustomerAuth.logout()">Log Out</button>
                    </div>
                </div>

                <div class="form-grid-2">
                    <!-- Profile Card -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            Profile &amp; Delivery Address
                        </h3>
                        <div style="font-size: 0.95rem; color: var(--color-text-secondary); line-height: 1.9;">
                            <div>Full Name: <strong style="color: #ffffff;">${escapeHtml(u.name)}</strong></div>
                            <div>Email: <strong style="color: #ffffff;">${escapeHtml(u.email)}</strong></div>
                            <div>Contact Number: <strong style="color: #ffffff;">${escapeHtml(u.phone || '09171234567')}</strong></div>
                            <div>Shipping Address: <strong style="color: #ffffff;">${escapeHtml(u.address || '32 F. E. Mendoza Street, Malanday')}, ${escapeHtml(u.city || 'Marikina')}, ${escapeHtml(u.province || 'Metro Manila')} ${escapeHtml(u.zipCode || '1805')}</strong></div>
                            <div style="margin-top: 10px;">
                                Account Status: <span class="status-badge active">✓ VERIFIED CUSTOMER</span>
                            </div>
                        </div>
                    </div>

                    <!-- Past Orders -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            Order History &amp; Tracking
                        </h3>
                        <div id="user-order-history-list">
                            <!-- Populated by Orders.loadUserOrders() -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        Orders.loadUserOrders();
    }
};

// Launch Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
