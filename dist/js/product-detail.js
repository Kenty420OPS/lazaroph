/**
 * LAZAROPH — Product Details Module
 * Modern Nike-Inspired Product Showcase & 3-Column US Size Matrix
 */

const ProductDetail = {
    currentProduct: null,
    selectedVariant: null,
    selectedColor: null,
    currentImageIndex: 0,
    imagesList: [],
    quantity: 1,

    async load(productId) {
        const container = document.getElementById('view-product-detail');
        if (!container) return;

        container.innerHTML = `
            <div class="container" style="text-align: center; padding: 100px 0;">
                <div style="display: inline-block; width: 44px; height: 44px; border: 3px solid #e5e5e5; border-top-color: #000000; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 16px; color: #707072; font-weight: 600;">Loading product showcase...</p>
            </div>
        `;

        try {
            const product = await API.getProductById(productId);
            this.currentProduct = product;
            this.quantity = 1;
            this.currentImageIndex = 0;

            // Collect all gallery images
            this.imagesList = product.images && product.images.length > 0 
                ? product.images.map(img => img.imageUrl) 
                : [product.mainImageUrl];

            // Pick default available variant
            const availableVariants = product.variants ? product.variants.filter(v => v.stock > 0) : [];
            this.selectedVariant = availableVariants.length > 0 ? availableVariants[0] : (product.variants ? product.variants[0] : null);
            this.selectedColor = this.selectedVariant ? this.selectedVariant.color : 'Standard';

            this.render(container);
        } catch (err) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">👟</div>
                    <h2 style="color: #000000; margin-bottom: 12px;">Product Not Found</h2>
                    <p style="color: #707072; margin-bottom: 24px;">The requested footwear or apparel item is currently unavailable.</p>
                    <button class="btn btn-primary" onclick="App.navigate('shop')">Back to Catalog</button>
                </div>
            `;
        }
    },

    render(container) {
        const p = this.currentProduct;
        const price = p.discountPrice || p.price;
        const hasDiscount = p.discountPrice && p.discountPrice < p.price;

        // Group variants by color
        const colorSet = new Set();
        if (p.variants) {
            p.variants.forEach(v => colorSet.add(v.color));
        }
        const colors = Array.from(colorSet);

        // Filter variants for currently selected color
        const activeColorVariants = p.variants ? p.variants.filter(v => v.color === this.selectedColor) : [];

        // Build 3-Column Nike Size Grid
        let sizesHtml = '';
        if (activeColorVariants.length > 0) {
            sizesHtml = activeColorVariants.map(v => {
                const isSelected = this.selectedVariant && this.selectedVariant.id === v.id;
                const isOutOfStock = v.stock <= 0;

                return `
                    <button type="button" 
                        class="nike-size-btn ${isSelected ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" 
                        onclick="ProductDetail.selectVariant(${v.id})" 
                        ${isOutOfStock ? 'disabled title="Sold Out"' : ''}>
                        ${v.size}
                    </button>
                `;
            }).join('');
        } else {
            sizesHtml = '<p style="color: #707072; grid-column: 1 / -1;">No sizes configured for this colorway.</p>';
        }

        // Vertical Gallery Thumbnails (Up to 8 thumbnails)
        const thumbsHtml = this.imagesList.map((url, idx) => `
            <button class="gallery-vertical-thumb-btn ${idx === this.currentImageIndex ? 'active' : ''}" onclick="ProductDetail.switchImageIndex(${idx})">
                <img src="${url}" alt="${p.name} - View ${idx + 1}" onerror="this.src='images/placeholder-product.png'">
            </button>
        `).join('');

        // Colorway Thumbnail Switchers (Style Cards)
        let colorwaysHtml = '';
        if (colors.length > 1) {
            colorwaysHtml = `
                <div class="colorways-section">
                    <div class="colorways-grid">
                        ${colors.map(c => {
                            const vWithColor = p.variants.find(v => v.color === c);
                            const isActive = c === this.selectedColor;
                            const previewImg = p.mainImageUrl;

                            return `
                                <button type="button" 
                                    class="colorway-thumb-btn ${isActive ? 'active' : ''}" 
                                    title="${c}" 
                                    onclick="ProductDetail.selectColor('${c}')">
                                    <img src="${previewImg}" alt="${c}" onerror="this.src='images/placeholder-product.png'">
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Subtitle category (e.g. "Basketball Shoes" or "Men's Road Running Shoes")
        const subCategoryName = p.subcategory || (p.gender ? `${p.gender === 'MEN' ? "Men's" : (p.gender === 'WOMEN' ? "Women's" : "Unisex")} ${p.categoryName || 'Shoes'}` : 'Basketball Shoes');

        container.innerHTML = `
            <div class="container" style="max-width: 1280px; padding: 20px 24px;">
                <div class="product-detail-layout">
                    
                    <!-- Left: Gallery Showcase with Vertical Thumbnails & Hero Image -->
                    <div class="product-gallery-wrapper">
                        <!-- Vertical Thumbnails Column -->
                        <div class="gallery-vertical-thumbs">
                            ${thumbsHtml}
                        </div>

                        <!-- Main Hero Showcase -->
                        <div class="gallery-hero-container">
                            <img src="${this.imagesList[this.currentImageIndex] || p.mainImageUrl}" 
                                 id="product-main-display-img" 
                                 alt="${p.name}" 
                                 class="gallery-hero-img" 
                                 onerror="this.src='images/placeholder-product.png'">
                            
                            <!-- Floating Prev / Next Arrow Controls -->
                            <div class="gallery-nav-arrows">
                                <button type="button" class="gallery-nav-btn" onclick="ProductDetail.navigateGallery(-1)" aria-label="Previous Image">
                                    ‹
                                </button>
                                <button type="button" class="gallery-nav-btn" onclick="ProductDetail.navigateGallery(1)" aria-label="Next Image">
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Product Information & 3-Column Size Selector -->
                    <div class="product-info-panel">
                        <div class="product-detail-header">
                            <h1 class="product-detail-title">${p.name}</h1>
                            <div class="product-detail-category">${subCategoryName}</div>
                            <div class="product-detail-price-row">
                                <span class="detail-price-current">${formatMoney(price)}</span>
                                ${hasDiscount ? `
                                    <span class="detail-price-original">${formatMoney(p.price)}</span>
                                    <span class="detail-price-discount">Save ₱${(p.price - p.discountPrice).toFixed(0)}</span>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Colorway Style Selector -->
                        ${colorwaysHtml}

                        <!-- Size Selector (3-Column Nike Grid) -->
                        <div class="size-selection-section">
                            <div class="size-header-row">
                                <span class="size-header-title">Select Size</span>
                                <button type="button" class="size-guide-btn" onclick="ProductDetail.openSizeGuide()">
                                    📏 Size Guide
                                </button>
                            </div>

                            <div class="nike-size-grid" id="sizes-matrix-grid">
                                ${sizesHtml}
                            </div>

                            <div class="size-stock-feedback-msg" id="size-feedback-msg">
                                ${this.selectedVariant && this.selectedVariant.stock > 0 
                                  ? `✓ Available: ${this.selectedVariant.stock} unit${this.selectedVariant.stock === 1 ? '' : 's'} in stock` 
                                  : (this.selectedVariant ? 'Selected size is out of stock' : 'Please select a size')}
                            </div>
                        </div>

                        <!-- Call-To-Action Buttons -->
                        <div class="action-buttons-group">
                            <button type="button" class="btn-add-to-bag" id="btn-add-to-cart" onclick="ProductDetail.addToCart()">
                                Add to Bag
                            </button>
                            <button type="button" class="btn-favourite" onclick="Store.toggleWishlist(${p.id})">
                                Favourite ♡
                            </button>
                        </div>

                        <!-- Accordion Information Tabs (Nike Minimal Clean Luxury) -->
                        <div class="product-accordion-list">
                            <!-- 1. Description & Key Features -->
                            <div class="product-accordion-item active">
                                <button type="button" class="product-accordion-header" onclick="ProductDetail.toggleAccordion(this)">
                                    <span class="accordion-title">Description</span>
                                    <span class="accordion-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                                    </span>
                                </button>
                                <div class="product-accordion-body" style="display: block;">
                                    <p>${p.description || 'Authentic footwear crafted for high responsiveness, durability, and daily pavement comfort.'}</p>
                                    ${p.features ? `
                                        <div style="margin-top: 14px; font-weight: 700; color: #000000; font-size: 0.95rem;">Key Benefits &amp; Features:</div>
                                        <ul class="accordion-bullets">
                                            ${p.features.split('\n').map(f => `<li>${f}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                    <ul class="accordion-bullets" style="margin-top: 12px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                                        <li><strong>Colour Shown:</strong> ${this.selectedColor}</li>
                                        ${p.sku ? `<li><strong>Style / SKU:</strong> ${p.sku}</li>` : ''}
                                    </ul>
                                </div>
                            </div>

                            <!-- 2. Materials & Care (if present) -->
                            ${p.materials ? `
                                <div class="product-accordion-item">
                                    <button type="button" class="product-accordion-header" onclick="ProductDetail.toggleAccordion(this)">
                                        <span class="accordion-title">Materials &amp; Construction</span>
                                        <span class="accordion-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                                        </span>
                                    </button>
                                    <div class="product-accordion-body">
                                        <p>${p.materials}</p>
                                        ${p.careInstructions ? `<p style="margin-top: 10px;"><strong>Care Instructions:</strong> ${p.careInstructions}</p>` : ''}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- 3. Shipping & Courier Delivery -->
                            <div class="product-accordion-item">
                                <button type="button" class="product-accordion-header" onclick="ProductDetail.toggleAccordion(this)">
                                    <span class="accordion-title">Shipping &amp; Delivery</span>
                                    <span class="accordion-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                                    </span>
                                </button>
                                <div class="product-accordion-body">
                                    <p>Fast Philippine fulfillment dispatched directly from our Marikina distribution store:</p>
                                    <ul class="accordion-bullets">
                                        <li><strong>🛵 Lalamove Express:</strong> Same-day motorcycle dispatch for Metro Manila &amp; Rizal (Within 2-3 hours).</li>
                                        <li><strong>📦 LBC Express:</strong> Nationwide air &amp; sea cargo (1-3 business days) with 12-digit barcode tracking.</li>
                                        <li><strong>🏬 In-Store Pickup:</strong> Free claiming at our physical branches in Marikina City.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- 4. Physical Store Availability -->
                            <div class="product-accordion-item">
                                <button type="button" class="product-accordion-header" onclick="ProductDetail.toggleAccordion(this)">
                                    <span class="accordion-title">Physical Store Availability</span>
                                    <span class="accordion-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                                    </span>
                                </button>
                                <div class="product-accordion-body">
                                    <div class="store-availability-box">
                                        <div class="store-branch-item">
                                            <div>
                                                <div class="store-branch-name">Flagship Store — Concepcion Uno</div>
                                                <div class="store-branch-addr">911 J.P. Rizal St., Marikina City • Mon–Sun 11am–8pm</div>
                                            </div>
                                            <span class="store-branch-badge">IN STOCK</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Size Guide Modal -->
            <div class="size-guide-modal-overlay" id="size-guide-modal" onclick="if(event.target === this) ProductDetail.closeSizeGuide()">
                <div class="size-guide-modal">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #000; text-transform: uppercase;">US Shoe Size Chart & Measurements</h3>
                        <button onclick="ProductDetail.closeSizeGuide()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #000;">✕</button>
                    </div>
                    <p style="font-size: 0.85rem; color: #707072;">Standard US to EU / CM conversions for athletic footwear.</p>
                    <table class="size-guide-table">
                        <thead>
                            <tr>
                                <th>US Size</th>
                                <th>UK</th>
                                <th>EU</th>
                                <th>CM (Length)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>US 4</td><td>3.5</td><td>36</td><td>23.0 cm</td></tr>
                            <tr><td>US 5</td><td>4.5</td><td>37.5</td><td>23.5 cm</td></tr>
                            <tr><td>US 6</td><td>5.5</td><td>38.5</td><td>24.0 cm</td></tr>
                            <tr><td>US 7</td><td>6.0</td><td>40.0</td><td>25.0 cm</td></tr>
                            <tr><td>US 8</td><td>7.0</td><td>41.0</td><td>26.0 cm</td></tr>
                            <tr><td>US 9</td><td>8.0</td><td>42.5</td><td>27.0 cm</td></tr>
                            <tr><td>US 10</td><td>9.0</td><td>44.0</td><td>28.0 cm</td></tr>
                            <tr><td>US 11</td><td>10.0</td><td>45.0</td><td>29.0 cm</td></tr>
                            <tr><td>US 12</td><td>11.0</td><td>46.0</td><td>30.0 cm</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    switchImageIndex(idx) {
        if (idx < 0 || idx >= this.imagesList.length) return;
        this.currentImageIndex = idx;

        const mainImg = document.getElementById('product-main-display-img');
        if (mainImg) mainImg.src = this.imagesList[idx];

        document.querySelectorAll('.gallery-vertical-thumb-btn').forEach((b, i) => {
            if (i === idx) b.classList.add('active');
            else b.classList.remove('active');
        });
    },

    navigateGallery(direction) {
        let newIdx = this.currentImageIndex + direction;
        if (newIdx < 0) newIdx = this.imagesList.length - 1;
        if (newIdx >= this.imagesList.length) newIdx = 0;
        this.switchImageIndex(newIdx);
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

        // Update active class on 3-column buttons
        document.querySelectorAll('.nike-size-btn').forEach(btn => btn.classList.remove('active'));
        if (event && event.currentTarget) event.currentTarget.classList.add('active');

        const feedback = document.getElementById('size-feedback-msg');
        if (feedback) {
            feedback.textContent = `✓ Available: ${v.stock} unit${v.stock === 1 ? '' : 's'} in stock`;
        }
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
            showToast(`Added ${this.currentProduct.name} (${this.selectedVariant.size}) to Bag!`, 'success');
            Cart.openDrawer();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    toggleAccordion(btn) {
        const item = btn.closest('.product-accordion-item');
        if (item) {
            item.classList.toggle('active');
            const body = item.querySelector('.product-accordion-body');
            if (body) {
                body.style.display = item.classList.contains('active') ? 'block' : 'none';
            }
        }
    },

    openSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        if (modal) modal.classList.add('active');
    },

    closeSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        if (modal) modal.classList.remove('active');
    }
};
