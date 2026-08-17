/**
 * LAZAROPH — Product Details & US Shoe Size Variant Module
 */

const ProductDetail = {
    currentProduct: null,
    selectedVariant: null,
    selectedColor: null,
    quantity: 1,

    async load(productId) {
        const container = document.getElementById('view-product-detail');
        if (!container) return;

        container.innerHTML = `
            <div class="container" style="text-align: center; padding: 100px 0;">
                <div style="display: inline-block; width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-brand-red); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 16px; color: var(--color-text-secondary);">Loading product details...</p>
            </div>
        `;

        try {
            const product = await API.getProductById(productId);
            this.currentProduct = product;
            this.quantity = 1;

            // Pick default available variant
            const availableVariants = product.variants ? product.variants.filter(v => v.stock > 0) : [];
            this.selectedVariant = availableVariants.length > 0 ? availableVariants[0] : (product.variants ? product.variants[0] : null);
            this.selectedColor = this.selectedVariant ? this.selectedVariant.color : 'Standard';

            this.render(container);
        } catch (err) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <h2 style="color: var(--color-danger); margin-bottom: 12px;">Product Not Found</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">The requested product is unavailable or has been removed.</p>
                    <button class="btn btn-primary" onclick="App.navigate('shop')">Back to Shop</button>
                </div>
            `;
        }
    },

    render(container) {
        const p = this.currentProduct;
        const price = p.discountPrice || p.price;
        const hasDiscount = p.discountPrice && p.discountPrice < p.price;
        const discountPct = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;

        // Group variants by color
        const colorSet = new Set();
        if (p.variants) {
            p.variants.forEach(v => colorSet.add(v.color));
        }
        const colors = Array.from(colorSet);

        // Filter variants for currently selected color
        const activeColorVariants = p.variants ? p.variants.filter(v => v.color === this.selectedColor) : [];

        // Build Size Buttons
        let sizesHtml = '';
        if (activeColorVariants.length > 0) {
            sizesHtml = activeColorVariants.map(v => {
                const isSelected = this.selectedVariant && this.selectedVariant.id === v.id;
                const isOutOfStock = v.stock <= 0;

                return `
                    <button type="button" 
                        class="size-select-btn ${isSelected ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" 
                        onclick="ProductDetail.selectVariant(${v.id})" 
                        ${isOutOfStock ? 'disabled title="Out of Stock"' : ''}>
                        <span class="size-name">${v.size}</span>
                        <span class="size-stock-tag">${isOutOfStock ? 'OUT OF STOCK' : `${v.stock} in stock`}</span>
                    </button>
                `;
            }).join('');
        } else {
            sizesHtml = '<p style="color: var(--color-text-muted);">No sizes configured for this variant.</p>';
        }

        // Thumbnails
        const images = p.images && p.images.length > 0 ? p.images : [{ imageUrl: p.mainImageUrl, isMain: true }];
        const thumbsHtml = images.map((img, idx) => `
            <button class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="ProductDetail.switchImage('${img.imageUrl}', this)">
                <img src="${img.imageUrl}" alt="${p.name}" onerror="this.src='/images/placeholder-product.png'">
            </button>
        `).join('');

        // Color Swatches
        let colorSwatchesHtml = '';
        if (colors.length > 1) {
            colorSwatchesHtml = `
                <div class="variant-section">
                    <div class="variant-header">
                        <span class="variant-label">Color: <span class="selected-variant-text" id="active-color-name">${this.selectedColor}</span></span>
                    </div>
                    <div class="color-swatches-row">
                        ${colors.map(c => {
                            const vWithColor = p.variants.find(v => v.color === c);
                            const hex = vWithColor ? vWithColor.colorHex : '#111111';
                            const isActive = c === this.selectedColor;
                            return `
                                <button type="button" 
                                    class="color-swatch-btn ${isActive ? 'active' : ''}" 
                                    style="background-color: ${hex};" 
                                    title="${c}" 
                                    onclick="ProductDetail.selectColor('${c}')">
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        const isCustomProduct = p.categoryId === 3 || p.name.toLowerCase().includes('custom');

        container.innerHTML = `
            <div class="container">
                <!-- Breadcrumbs -->
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: var(--color-text-muted);">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: var(--color-text-secondary);">Home</a> / 
                    <a href="javascript:void(0)" onclick="App.navigate('shop', { category: '${p.categoryName || ''}' })" style="color: var(--color-text-secondary);">${p.categoryName || 'Catalog'}</a> / 
                    <span style="color: #ffffff;">${p.name}</span>
                </div>

                <div class="product-detail-layout">
                    <!-- Image Gallery -->
                    <div class="product-gallery">
                        <div class="gallery-main-view">
                            <img src="${p.mainImageUrl}" id="product-main-display-img" alt="${p.name}" class="gallery-main-img" onerror="this.src='/images/placeholder-product.png'">
                            <div class="product-badges">
                                ${hasDiscount ? `<span class="badge badge-sale">SAVE ${discountPct}%</span>` : ''}
                                <span class="badge badge-legit">AUTHENTIC • 100% LEGIT</span>
                            </div>
                        </div>
                        <div class="gallery-thumbnails">
                            ${thumbsHtml}
                        </div>
                    </div>

                    <!-- Details Pane -->
                    <div class="product-info-panel">
                        <div class="product-meta-header">
                            <div class="product-brand-tag">${p.brandName || 'LAZAROPH'} • ${p.gender || 'UNISEX'}</div>
                            <h1 class="product-detail-title">${p.name}</h1>
                            <div class="product-sku-row">
                                <span>SKU: <strong style="color: #ffffff;">${p.sku}</strong></span>
                                <span>Status: <strong style="color: var(--color-success);">${p.status}</strong></span>
                            </div>
                        </div>

                        <!-- Price Row -->
                        <div class="product-detail-prices">
                            <span class="price-current">${formatMoney(price)}</span>
                            ${hasDiscount ? `
                                <span class="price-original">${formatMoney(p.price)}</span>
                                <span class="discount-save-tag">SAVE ₱${(p.price - p.discountPrice).toFixed(2)}</span>
                            ` : ''}
                        </div>

                        <!-- Legit Check Guarantee Banner -->
                        <div class="legit-check-card">
                            <div class="icon">🛡️</div>
                            <div>
                                <div class="legit-check-title">GUARANTEED LEGITIMATE AT BELOW MARKET PRICE</div>
                                <div class="legit-check-desc">All items undergo multi-point physical verification before dispatch. Backed by physical stores in Marikina.</div>
                            </div>
                        </div>

                        <!-- Color Variants -->
                        ${colorSwatchesHtml}

                        <!-- Size Selector (US Shoes / Apparel) -->
                        <div class="variant-section">
                            <div class="variant-header">
                                <span class="variant-label">
                                    ${p.sizeType === 'US_MEN_SHOES' ? 'Select US Men\'s Shoe Size:' : 
                                      p.sizeType === 'US_WOMEN_SHOES' ? 'Select US Women\'s Shoe Size:' : 
                                      p.sizeType === 'US_KIDS_SHOES' ? 'Select US Kids\' Shoe Size:' : 
                                      p.sizeType === 'APPAREL' ? 'Select Apparel Size:' : 'Select Size:'}
                                    <strong class="selected-variant-text" id="active-size-name">
                                        ${this.selectedVariant ? this.selectedVariant.size : 'None'}
                                    </strong>
                                </span>
                            </div>
                            <div class="sizes-matrix-grid" id="sizes-matrix-grid">
                                ${sizesHtml}
                            </div>
                            <div class="size-feedback-msg" id="size-feedback-msg">
                                ${this.selectedVariant && this.selectedVariant.stock > 0 ? 
                                  `✓ Available: ${this.selectedVariant.stock} unit${this.selectedVariant.stock === 1 ? '' : 's'} in stock` : 
                                  'Please select an available size variant.'}
                            </div>
                        </div>

                        <!-- Quantity and CTA Row -->
                        <div class="purchase-action-row">
                            <div class="quantity-stepper">
                                <button type="button" class="qty-btn" onclick="ProductDetail.changeQty(-1)">−</button>
                                <input type="text" readonly class="qty-input" id="detail-qty-input" value="1">
                                <button type="button" class="qty-btn" onclick="ProductDetail.changeQty(1)">+</button>
                            </div>

                            <button type="button" class="btn btn-primary btn-lg" style="flex-grow: 1;" id="btn-add-to-cart" onclick="ProductDetail.addToCart()">
                                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                ADD TO CART
                            </button>

                            <button type="button" class="action-btn" style="width: 52px; height: 52px; border-radius: var(--radius-md);" onclick="Store.toggleWishlist(${p.id})" title="Wishlist">
                                ♥
                            </button>
                        </div>

                        ${isCustomProduct ? `
                            <div style="margin-bottom: 24px; padding: 16px; background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.25); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <strong style="color: var(--color-brand-cyan); display: block; font-size: 0.95rem;">Personalize with Custom Name & Number</strong>
                                    <span style="font-size: 0.8rem; color: var(--color-text-secondary);">Open our live visual jersey design studio to customize your uniform.</span>
                                </div>
                                <button class="btn btn-accent btn-sm" onclick="App.navigate('customizer', { productId: ${p.id} })">
                                    CUSTOMIZE NOW
                                </button>
                            </div>
                        ` : ''}

                        <!-- Accordion Information Tabs -->
                        <div class="product-accordions">
                            <div class="accordion-item active">
                                <button class="accordion-trigger" onclick="ProductDetail.toggleAccordion(this)">
                                    <span>Description</span>
                                    <span>▼</span>
                                </button>
                                <div class="accordion-content">
                                    <p>${p.description || 'Authentic sportswear item.'}</p>
                                </div>
                            </div>

                            ${p.features ? `
                                <div class="accordion-item">
                                    <button class="accordion-trigger" onclick="ProductDetail.toggleAccordion(this)">
                                        <span>Key Features</span>
                                        <span>▼</span>
                                    </button>
                                    <div class="accordion-content">
                                        <ul style="padding-left: 20px; line-height: 1.8;">
                                            ${p.features.split('\n').map(f => `<li>${f}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            ` : ''}

                            ${p.materials ? `
                                <div class="accordion-item">
                                    <button class="accordion-trigger" onclick="ProductDetail.toggleAccordion(this)">
                                        <span>Materials & Construction</span>
                                        <span>▼</span>
                                    </button>
                                    <div class="accordion-content">
                                        <p>${p.materials}</p>
                                    </div>
                                </div>
                            ` : ''}

                            ${p.careInstructions ? `
                                <div class="accordion-item">
                                    <button class="accordion-trigger" onclick="ProductDetail.toggleAccordion(this)">
                                        <span>Care Instructions</span>
                                        <span>▼</span>
                                    </button>
                                    <div class="accordion-content">
                                        <p>${p.careInstructions}</p>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="accordion-item">
                                <button class="accordion-trigger" onclick="ProductDetail.toggleAccordion(this)">
                                    <span>Physical Store Availability</span>
                                    <span>▼</span>
                                </button>
                                <div class="accordion-content">
                                    <div style="margin-bottom: 10px;">
                                        <strong>Branch 1 — Concepcion Uno:</strong> 911 J.P. Rizal St., Marikina (In Stock)
                                    </div>
                                    <div>
                                        <strong>Branch 2 — Malanday:</strong> 32 F. E. Mendoza St., Marikina (In Stock)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    switchImage(url, btn) {
        const mainImg = document.getElementById('product-main-display-img');
        if (mainImg) mainImg.src = url;

        document.querySelectorAll('.gallery-thumb-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    },

    selectColor(color) {
        this.selectedColor = color;
        const p = this.currentProduct;
        const activeColorVariants = p.variants ? p.variants.filter(v => v.color === color) : [];
        const firstAvail = activeColorVariants.find(v => v.stock > 0) || activeColorVariants[0];
        this.selectedVariant = firstAvail || null;
        this.quantity = 1;

        const container = document.getElementById('view-product-detail');
        if (container) this.render(container);
    },

    selectVariant(variantId) {
        const v = this.currentProduct.variants.find(item => item.id === variantId);
        if (!v || v.stock <= 0) return;

        this.selectedVariant = v;
        this.quantity = 1;

        // Update UI highlights
        document.querySelectorAll('.size-select-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = event.currentTarget;
        if (activeBtn) activeBtn.classList.add('active');

        const activeSizeName = document.getElementById('active-size-name');
        if (activeSizeName) activeSizeName.textContent = v.size;

        const feedback = document.getElementById('size-feedback-msg');
        if (feedback) {
            feedback.className = 'size-feedback-msg';
            feedback.textContent = `✓ Available: ${v.stock} unit${v.stock === 1 ? '' : 's'} in stock`;
        }

        const qtyInput = document.getElementById('detail-qty-input');
        if (qtyInput) qtyInput.value = '1';
    },

    changeQty(delta) {
        if (!this.selectedVariant) return;
        const max = this.selectedVariant.stock;
        let newQty = this.quantity + delta;
        if (newQty < 1) newQty = 1;
        if (newQty > max) newQty = max;

        this.quantity = newQty;
        const qtyInput = document.getElementById('detail-qty-input');
        if (qtyInput) qtyInput.value = newQty;
    },

    async addToCart() {
        if (!this.selectedVariant) {
            showToast('Please select a size first.', 'error');
            return;
        }
        if (this.selectedVariant.stock <= 0) {
            showToast('Selected size is currently out of stock.', 'error');
            return;
        }

        try {
            await Cart.addItem(this.currentProduct.id, this.selectedVariant.id, this.quantity);
            showToast(`Added ${this.currentProduct.name} (${this.selectedVariant.size}) to cart!`, 'success');
            Cart.openDrawer();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    toggleAccordion(btn) {
        const item = btn.closest('.accordion-item');
        if (item) {
            item.classList.toggle('active');
        }
    }
};
