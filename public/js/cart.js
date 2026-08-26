/**
 * LAZAROPH — Shopping Cart Module
 */

const Cart = {
    cartData: { items: [], subtotal: 0, shippingFee: 0, total: 0, totalQuantity: 0 },

    async init() {
        await this.refresh();
    },

    async refresh() {
        try {
            this.cartData = await API.getCart();
            this.updateBadge();
            this.renderDrawer();
        } catch (e) {
            console.warn('Failed to refresh cart:', e);
        }
    },

    updateBadge() {
        const badge = document.getElementById('header-cart-badge');
        if (badge) {
            const qty = this.cartData.totalQuantity || 0;
            badge.textContent = qty;
            badge.style.display = qty > 0 ? 'flex' : 'none';
        }
    },

    openDrawer() {
        this.renderDrawer();
        const drawer = document.getElementById('cart-drawer-overlay');
        if (drawer) drawer.classList.add('active');
    },

    closeDrawer() {
        const drawer = document.getElementById('cart-drawer-overlay');
        if (drawer) drawer.classList.remove('active');
    },

    renderDrawer() {
        const list = document.getElementById('cart-drawer-items-list');
        const subtotalSpan = document.getElementById('cart-drawer-subtotal');
        const shippingSpan = document.getElementById('cart-drawer-shipping');
        const totalSpan = document.getElementById('cart-drawer-total');
        const checkoutBtn = document.getElementById('cart-drawer-checkout-btn');

        if (!list) return;

        const items = this.cartData.items || [];
        if (items.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--color-text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;">🛒</div>
                    <h4 style="font-size: 1.1rem; color: #ffffff; margin-bottom: 6px;">Your cart is empty</h4>
                    <p style="font-size: 0.85rem; margin-bottom: 20px;">Explore our authentic sneakers, apparel, and watches.</p>
                    <button class="btn btn-primary btn-sm" onclick="Cart.closeDrawer(); App.navigate('shop');">
                        Shop Now
                    </button>
                </div>
            `;
            if (subtotalSpan) subtotalSpan.textContent = '₱0.00';
            if (shippingSpan) shippingSpan.textContent = '₱0.00';
            if (totalSpan) totalSpan.textContent = '₱0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;

        list.innerHTML = items.map(item => {
            let customNote = '';
            if (item.customizationData) {
                try {
                    const c = JSON.parse(item.customizationData);
                    customNote = `<div class="cart-item-custom-tag">Custom: ${c.jerseyName || c.name} #${c.jerseyNumber || c.number} (${c.teamName || c.team})</div>`;
                } catch (ignored) {}
            }

            return `
                <div class="cart-item-card">
                    <div class="cart-item-thumb">
                        <img src="${item.imageUrl}" alt="${item.productName}" onerror="this.src='images/placeholder-product.png'">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.productName}</h4>
                        <div class="cart-item-variant">Size: <strong style="color: #ffffff;">${item.size}</strong> • ${item.color}</div>
                        ${customNote}
                        <div class="cart-item-price">${formatMoney(item.price)}</div>
                        
                        <!-- Quantity Controller -->
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <div class="quantity-stepper" style="height: 32px;">
                                <button type="button" class="qty-btn" style="width: 28px; font-size: 0.85rem;" onclick="Cart.updateItemQty(${item.id}, ${item.quantity - 1})">−</button>
                                <span style="font-size: 0.85rem; font-weight: 700; width: 30px; text-align: center;">${item.quantity}</span>
                                <button type="button" class="qty-btn" style="width: 28px; font-size: 0.85rem;" onclick="Cart.updateItemQty(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <span style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-left: auto;">${formatMoney(item.subtotal)}</span>
                        </div>
                    </div>
                    <button class="cart-item-remove-btn" onclick="Cart.removeItem(${item.id})" title="Remove">✕</button>
                </div>
            `;
        }).join('');

        if (subtotalSpan) subtotalSpan.textContent = formatMoney(this.cartData.subtotal);
        if (shippingSpan) shippingSpan.textContent = formatMoney(this.cartData.shippingFee);
        if (totalSpan) totalSpan.textContent = formatMoney(this.cartData.total);
    },

    async addItem(productId, variantId, quantity, customData = null) {
        this.cartData = await API.addToCart(productId, variantId, quantity, customData);
        this.updateBadge();
        this.renderDrawer();
    },

    async updateItemQty(cartItemId, quantity) {
        try {
            this.cartData = await API.updateCartQuantity(cartItemId, quantity);
            this.updateBadge();
            this.renderDrawer();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async removeItem(cartItemId) {
        try {
            this.cartData = await API.removeFromCart(cartItemId);
            this.updateBadge();
            this.renderDrawer();
            showToast('Item removed from cart.', 'info');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
