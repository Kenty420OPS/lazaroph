/**
 * LAZAROPH — Brands Directory & Customer Filter Module
 */

const Brands = {
    allBrands: [],

    async init() {
        await this.loadBrandsDirectory();
    },

    async loadHomeShowcase() {
        const container = document.getElementById('home-brands-grid');
        if (!container) return;

        try {
            const brands = await API.getBrands();
            this.allBrands = brands;

            container.innerHTML = brands.slice(0, 12).map(b => `
                <div class="brand-showcase-card" onclick="App.navigate('shop', { brand: '${b.name}' })" title="Shop ${b.name}">
                    <div class="brand-logo-wrap">
                        <img src="${b.logoUrl || '/images/logo.png'}" alt="${b.name}" class="brand-logo-img" onerror="this.src='/images/logo.png'">
                    </div>
                    <div class="brand-name">${b.name}</div>
                    <span class="brand-count-badge">${b.productCount || 0} Products</span>
                </div>
            `).join('');
        } catch (err) {
            console.error('Failed to load home brands showcase:', err);
        }
    },

    async loadBrandsDirectory() {
        const container = document.getElementById('brands-directory-grid');
        const countSpan = document.getElementById('brands-total-count');
        if (!container) return;

        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
                <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 14px; color: #6b7280; font-weight: 600;">Loading authentic brand partners...</p>
            </div>
        `;

        try {
            const brands = await API.getBrands();
            this.allBrands = brands;

            if (countSpan) {
                countSpan.textContent = `${brands.length} Official Brands`;
            }

            this.renderBrandCards(brands);
        } catch (err) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #dc2626; padding: 40px;">Failed to load brands: ${err.message}</div>`;
        }
    },

    renderBrandCards(brandsToRender) {
        const container = document.getElementById('brands-directory-grid');
        if (!container) return;

        if (brandsToRender.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px;">
                    <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">No brands found</h3>
                    <p style="color: #6b7280; margin-bottom: 16px;">Try searching for another brand name.</p>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('brands-search-input').value=''; Brands.filter('');">Show All Brands</button>
                </div>
            `;
            return;
        }

        container.innerHTML = brandsToRender.map(b => `
            <div class="brand-directory-card" onclick="App.navigate('shop', { brand: '${b.name}' })">
                <div class="brand-card-top">
                    <div class="brand-card-img-wrap">
                        <img src="${b.logoUrl || '/images/logo.png'}" alt="${b.name}" class="brand-card-img" onerror="this.src='/images/logo.png'">
                    </div>
                    <span class="badge badge-brand">${b.productCount || 0} Available</span>
                </div>
                <div class="brand-card-body">
                    <h3 class="brand-card-title">${b.name}</h3>
                    <p class="brand-card-desc">${b.description || 'Verified authentic sportswear, footwear & lifestyle catalog.'}</p>
                    <div class="brand-card-footer">
                        <span class="brand-shop-link">Browse Collection →</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filter(query) {
        const q = (query || '').toLowerCase().trim();
        if (!q) {
            this.renderBrandCards(this.allBrands);
            return;
        }
        const filtered = this.allBrands.filter(b => 
            b.name.toLowerCase().includes(q) || 
            (b.description && b.description.toLowerCase().includes(q))
        );
        this.renderBrandCards(filtered);
    }
};
