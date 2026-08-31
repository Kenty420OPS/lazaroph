/**
 * LAZAROPH — Storefront, Catalog & Filtering Module
 */

const Store = {
    currentFilters: {
        category: 'all',
        gender: 'all',
        size: 'all',
        brand: 'all',
        minPrice: '',
        maxPrice: '',
        inStock: false,
        q: '',
        sort: 'newest'
    },
    allProducts: [],

    async init() {
        this.bindEvents();
    },

    bindEvents() {
        // Live search bar input
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.currentFilters.q = e.target.value;
                    if (App.currentView !== 'shop') {
                        App.navigate('shop');
                    } else {
                        this.loadCatalog();
                    }
                }, 300);
            });
        }

        // Sort selector
        const sortSelect = document.getElementById('catalog-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.loadCatalog();
            });
        }
    },

    async loadHomeFeatured() {
        try {
            const products = await API.getProducts({ sort: 'popular' });
            this.allProducts = products;

            // Render Trending Grid (Top 4 products)
            const grid = document.getElementById('home-trending-grid');
            if (grid) {
                const featured = products.slice(0, 4);
                grid.innerHTML = featured.map(p => this.renderProductCard(p)).join('');
            }

            // Render New Arrivals Grid (Top 4 newest)
            const newGrid = document.getElementById('home-new-arrivals-grid');
            if (newGrid) {
                const newArrivals = products.filter(p => p.isNewArrival).slice(0, 4);
                newGrid.innerHTML = newArrivals.map(p => this.renderProductCard(p)).join('');
            }
            // Load dynamic Featured Categories background images
            this.loadFeaturedCategories();
        } catch (err) {
            console.error('Failed to load featured products:', err);
        }
    },

    async loadFeaturedCategories() {
        try {
            const categories = await API.getFeaturedCategories();
            if (!categories || !categories.length) return;

            categories.forEach(cat => {
                const key = (cat.key || '').toLowerCase();
                const bg = document.getElementById(`cat-bg-${key}`);
                if (bg && cat.imageUrl) {
                    bg.style.backgroundImage = `linear-gradient(rgba(17,22,34,0.35), rgba(17,22,34,0.85)), url('${cat.imageUrl}')`;
                    bg.style.backgroundSize = 'cover';
                    bg.style.backgroundPosition = 'center';
                }
            });
        } catch (err) {
            console.error('Failed to load featured categories:', err);
        }
    },

    async loadCatalog() {
        const grid = document.getElementById('catalog-product-grid');
        const countSpan = document.getElementById('catalog-results-count');
        const brandBanner = document.getElementById('catalog-brand-banner');
        if (!grid) return;

        // Render Active Brand Banner if filtered
        if (brandBanner) {
            if (this.currentFilters.brand && this.currentFilters.brand !== 'all') {
                brandBanner.innerHTML = `
                    <div class="brand-filter-alert">
                        <div>
                            <span style="color: #6b7280; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Brand Collection:</span>
                            <h2 style="font-size: 1.35rem; font-weight: 900; color: #000; text-transform: uppercase; margin: 2px 0 0 0;">${this.currentFilters.brand}</h2>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="Store.setFilter('brand', 'all'); const rb = document.querySelector('input[name=filter_brand][value=all]'); if(rb) rb.checked=true;">
                             Clear Brand Filter
                        </button>
                    </div>
                `;
                brandBanner.classList.remove('hidden');
            } else {
                brandBanner.innerHTML = '';
                brandBanner.classList.add('hidden');
            }
        }

        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #000000; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="margin-top: 16px; color: #6b7280; font-weight: 600;">Loading authentic products...</p>
        </div>`;

        try {
            const products = await API.getProducts(this.currentFilters);
            this.allProducts = products;

            if (countSpan) {
                countSpan.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
            }

            if (products.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; background: #ffffff; border: 1px dashed #d1d5db; border-radius: var(--radius-lg);">
                        <h3 style="font-size: 1.5rem; margin-bottom: 8px; font-weight: 800;">No matching products found</h3>
                        <p style="color: #6b7280; margin-bottom: 24px;">Try adjusting your brand, size, price range, or category filters.</p>
                        <button class="btn btn-secondary" onclick="Store.resetFilters()">Reset All Filters</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = products.map(p => this.renderProductCard(p)).join('');
        } catch (err) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #dc2626; padding: 40px; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid #fee2e2;">
                    <div style="font-size: 2rem; margin-bottom: 8px;"></div>
                    <div style="font-weight: 700; margin-bottom: 6px;">Failed to load products: ${err.message}</div>
                    <p style="color: #6b7280; font-size: 0.85rem; margin-bottom: 16px;">Make sure the Java server is running or retry.</p>
                    <button class="btn btn-secondary btn-sm" onclick="Store.loadCatalog()"> Retry</button>
                </div>
            `;
        }
    },

    async loadBrandFilters() {
        const container = document.getElementById('filter-brand-options');
        if (!container) return;

        try {
            const brands = await API.getBrands();
            container.innerHTML = `
                <label class="filter-checkbox-label">
                    <input type="radio" name="filter_brand" value="all" ${this.currentFilters.brand === 'all' ? 'checked' : ''} onchange="Store.setFilter('brand', 'all')">
                    <span>All Brands</span>
                </label>
                ${brands.map(b => `
                    <label class="filter-checkbox-label">
                        <input type="radio" name="filter_brand" value="${b.name}" ${this.currentFilters.brand === b.name ? 'checked' : ''} onchange="Store.setFilter('brand', '${b.name}')">
                        <span>${b.name} (${b.productCount || 0})</span>
                    </label>
                `).join('')}
            `;
        } catch (err) {
            console.error('Failed to load brand filters:', err);
        }
    },

    renderProductCard(product) {
        const price = product.discountPrice || product.price;
        const hasDiscount = product.discountPrice && product.discountPrice < product.price;

        // Size pills preview (top 5 variants)
        let sizesHtml = '';
        if (product.variants && product.variants.length > 0) {
            const topSizes = product.variants.slice(0, 5);
            sizesHtml = topSizes.map(v => `
                <span class="size-pill-preview ${v.stock <= 0 ? 'out-of-stock' : ''}">
                    ${v.size}
                </span>
            `).join('');
            if (product.variants.length > 5) {
                sizesHtml += `<span class="size-pill-preview">+${product.variants.length - 5}</span>`;
            }
        }
        // Calculate main image url in case older products don't have it natively
        const mUrl = product.mainImageUrl || (product.images && product.images.length > 0 ? product.images[0].imageUrl : '/images/placeholder-product.png');

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-card-media" onclick="App.navigate('product', { id: ${product.id} })" style="cursor: pointer;">
                    <img src="${mUrl}" alt="${product.name}" class="product-card-img" onerror="if(!this.dataset.errored){this.dataset.errored='true';this.src='/images/placeholder-product.png';}">
                    <div class="product-card-badges">
                        ${hasDiscount ? '<span class="badge badge-sale">SALE</span>' : ''}
                        ${product.isNewArrival ? '<span class="badge badge-new">NEW</span>' : ''}
                        <span class="badge badge-legit">100% LEGIT</span>
                    </div>
                    <button class="product-wishlist-btn" onclick="event.stopPropagation(); Store.toggleWishlist(${product.id})" title="Add to Wishlist">
                        
                    </button>
                </div>
                <div class="product-card-body">
                    <div class="product-card-meta">
                        <span>${product.categoryName || 'Authentic'} • ${product.gender || 'UNISEX'}</span>
                    </div>
                    <h3 class="product-card-title">
                        <a href="javascript:void(0)" onclick="App.navigate('product', { id: ${product.id} })">${product.name}</a>
                    </h3>
                    <div class="product-card-price-row">
                        <span class="product-price">${formatMoney(price)}</span>
                        ${hasDiscount ? `<span class="product-original-price">${formatMoney(product.price)}</span>` : ''}
                    </div>
                    ${sizesHtml ? `<div class="product-card-sizes" style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 14px;">${sizesHtml}</div>` : ''}
                    <div class="product-card-footer" style="margin-top: auto;">
                        <button class="btn btn-primary btn-sm btn-block" onclick="App.navigate('product', { id: ${product.id} })">
                            View Options
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setFilter(key, value) {
        this.currentFilters[key] = value;
        this.loadCatalog();
    },

    resetFilters() {
        this.currentFilters = {
            category: 'all',
            gender: 'all',
            size: 'all',
            brand: 'all',
            minPrice: '',
            maxPrice: '',
            inStock: false,
            q: '',
            sort: 'newest'
        };

        // Reset filter UI form elements
        const priceMin = document.getElementById('filter-price-min');
        const priceMax = document.getElementById('filter-price-max');
        const inStockCheck = document.getElementById('filter-instock');
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        if (inStockCheck) inStockCheck.checked = false;

        document.querySelectorAll('.filter-size-btn').forEach(btn => btn.classList.remove('active'));

        this.loadCatalog();
    },

    async toggleWishlist(productId) {
        if (!Auth.currentUser) {
            Auth.openAuthModal('login');
            showToast('Please log in to add items to your wishlist.', 'info');
            return;
        }

        try {
            await API.toggleWishlist(productId);
            showToast('Wishlist updated!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
