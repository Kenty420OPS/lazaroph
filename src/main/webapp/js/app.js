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
        // Mobile Hamburger Menu Toggle
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('main-nav-menu');
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('mobile-open');
            });
        }

        // Close mobile menu when a nav link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu) navMenu.classList.remove('mobile-open');
            });
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
        const fullHash = window.location.hash || '#home';
        const [rawView, queryString] = fullHash.substring(1).split('?');
        const view = rawView || 'home';

        const params = {};
        if (queryString) {
            new URLSearchParams(queryString).forEach((val, key) => {
                params[key] = val;
            });
        }

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
        const siteFooter = document.getElementById('site-footer');
        const announcementBar = document.getElementById('announcement-bar');

        if (view === 'admin') {
            if (siteHeader) siteHeader.classList.add('hidden');
            if (siteFooter) siteFooter.classList.add('hidden');
            if (announcementBar) announcementBar.classList.add('hidden');

            const viewAdmin = document.getElementById('view-admin');
            if (viewAdmin) {
                viewAdmin.classList.remove('hidden');
                Admin.init();
            }
            return;
        }

        // Restore storefront chrome
        if (siteHeader) siteHeader.classList.remove('hidden');
        if (siteFooter) siteFooter.classList.remove('hidden');
        if (announcementBar) announcementBar.classList.remove('hidden');

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
        }
    },

    loadAccountView() {
        const container = document.getElementById('view-account');
        if (!container) return;

        if (!Auth.currentUser) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <h2>Please Log In</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">You must be logged in to view your profile and orders.</p>
                    <button class="btn btn-primary" onclick="Auth.openAuthModal('login')">Sign In</button>
                </div>
            `;
            return;
        }

        const u = Auth.currentUser;

        container.innerHTML = `
            <div class="container" style="padding: 40px 0 80px;">
                <div class="section-header" style="margin-bottom: 32px;">
                    <div>
                        <div class="section-subtitle">MY LAZAROPH ACCOUNT</div>
                        <h1 class="section-title">WELCOME, ${u.name.toUpperCase()}</h1>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        ${u.role === 'ADMIN' ? `<button class="btn btn-primary" onclick="App.navigate('admin')">Admin Panel</button>` : ''}
                        <button class="btn btn-secondary" onclick="Auth.logout()">Log Out</button>
                    </div>
                </div>

                <div class="form-grid-2">
                    <!-- Profile Card -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            Account Information
                        </h3>
                        <div style="font-size: 0.95rem; color: var(--color-text-secondary); line-height: 1.8;">
                            <div>Full Name: <strong style="color: #ffffff;">${u.name}</strong></div>
                            <div>Email: <strong style="color: #ffffff;">${u.email}</strong></div>
                            <div>Phone: <strong style="color: #ffffff;">${u.phone || 'N/A'}</strong></div>
                            <div>Default Address: <strong style="color: #ffffff;">${u.address || 'N/A'}, ${u.city || ''} ${u.province || ''} ${u.zipCode || ''}</strong></div>
                            <div>Account Type: <span class="badge ${u.role === 'ADMIN' ? 'badge-brand' : 'badge-outline'}">${u.role}</span></div>
                        </div>
                    </div>

                    <!-- Past Orders -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            My Order History
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
