/**
 * LAZAROPH — Centralized REST API Client
 */

const API = {
    baseUrl: '',

    getToken() {
        return localStorage.getItem('lazaroph_token') || '';
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
            const res = await fetch(path, {
                ...options,
                headers
            });

            const data = await res.json();
            if (!res.ok || data.success === false) {
                const errorMsg = data.error || data.message || 'An error occurred';
                throw new Error(errorMsg);
            }
            return data.data !== undefined ? data.data : data;
        } catch (err) {
            console.error(`[API Error] ${path}:`, err);
            throw err;
        }
    },

    // Auth
    login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    getMe() {
        return this.request('/api/auth/me');
    },

    logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    },

    // Catalog & Products
    getProducts(params = {}) {
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

    getBrands() {
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

    saveProduct(productData) {
        return this.request('/api/admin/products/save', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    deleteProduct(id) {
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

    getAdminOrders() {
        return this.request('/api/admin/orders');
    },

    updateOrderStatus(orderId, status) {
        return this.request('/api/admin/orders/status', {
            method: 'POST',
            body: JSON.stringify({ orderId, status })
        });
    },

    getAdminCustomOrders() {
        return this.request('/api/admin/custom-orders');
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
    getAdminBrands() {
        return this.request('/api/admin/brands');
    },

    saveAdminBrand(brandData) {
        return this.request('/api/admin/brands', {
            method: 'POST',
            body: JSON.stringify(brandData)
        });
    },

    deleteAdminBrand(id) {
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
    }
};

// UI Toast Notification Helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

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
