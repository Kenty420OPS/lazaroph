/**
 * LAZAROPH — Admin Management Dashboard Module
 * Easy No-Code Product Management, Variant Inventory & Order Management
 */

const Admin = {
    currentTab: 'dashboard',
    editingProductId: null,
    productImages: [],
    categories: [],
    brands: [],

    async init() {
        if (!Auth.currentUser || Auth.currentUser.role !== 'ADMIN') {
            App.navigate('home');
            showToast('Access denied. Administrator privileges required.', 'error');
            return;
        }

        try {
            this.categories = await API.getCategories();
            this.brands = await API.getBrands();
        } catch (ignored) {}

        this.switchTab('dashboard');
    },

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.admin-nav-btn[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        const content = document.getElementById('admin-content-area');
        if (!content) return;

        if (tab === 'dashboard') {
            this.loadDashboard(content);
        } else if (tab === 'products') {
            this.loadProducts(content);
        } else if (tab === 'add-product') {
            this.loadProductForm(content, null);
        } else if (tab === 'brands') {
            this.loadBrands(content);
        } else if (tab === 'inventory') {
            this.loadInventory(content);
        } else if (tab === 'orders') {
            this.loadOrders(content);
        } else if (tab === 'custom-orders') {
            this.loadCustomOrders(content);
        } else if (tab === 'customers') {
            this.loadCustomers(content);
        } else if (tab === 'settings') {
            this.loadSettings(content);
        }
    },

    async loadDashboard(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading executive dashboard...</div>`;

        try {
            const stats = await API.getAdminStats();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">STORE OVERVIEW</div>
                        <h1 class="admin-page-title">EXECUTIVE DASHBOARD</h1>
                    </div>
                    <button class="btn btn-primary" onclick="Admin.switchTab('add-product')">
                        + Add New Product
                    </button>
                </div>

                <!-- KPI Metrics Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-header">
                            <span class="kpi-title">Total Gross Sales</span>
                            <div class="kpi-icon">₱</div>
                        </div>
                        <div class="kpi-value">${formatMoney(stats.totalSales)}</div>
                    </div>

                    <div class="kpi-card kpi-orders">
                        <div class="kpi-header">
                            <span class="kpi-title">Total Orders</span>
                            <div class="kpi-icon">📦</div>
                        </div>
                        <div class="kpi-value">${stats.totalOrders}</div>
                    </div>

                    <div class="kpi-card kpi-customers">
                        <div class="kpi-header">
                            <span class="kpi-title">Registered Customers</span>
                            <div class="kpi-icon">👥</div>
                        </div>
                        <div class="kpi-value">${stats.totalCustomers}</div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-header">
                            <span class="kpi-title">Live Products</span>
                            <div class="kpi-icon">👟</div>
                        </div>
                        <div class="kpi-value">${stats.totalProducts}</div>
                    </div>

                    <div class="kpi-card kpi-stock">
                        <div class="kpi-header">
                            <span class="kpi-title">Low / Out of Stock</span>
                            <div class="kpi-icon">⚠️</div>
                        </div>
                        <div class="kpi-value" style="color: var(--color-warning);">${stats.lowStockCount}</div>
                    </div>
                </div>

                <!-- Recent Activity & Low Stock Matrix -->
                <div class="form-grid-2">
                    <!-- Recent Orders -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 16px;">
                            Recent Orders
                        </h3>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(stats.recentOrders || []).map(o => `
                                        <tr>
                                            <td><strong style="color: #ffffff;">${o.orderNumber}</strong></td>
                                            <td>${o.customerName}</td>
                                            <td>${formatMoney(o.total)}</td>
                                            <td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Low Stock Variant Alerts -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 16px;">
                            Low Stock Variant Warnings
                        </h3>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Size</th>
                                        <th>Color</th>
                                        <th>Stock</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(stats.lowStockProducts || []).slice(0, 6).map(v => `
                                        <tr>
                                            <td><strong>${v.productName}</strong></td>
                                            <td><span class="badge badge-outline">${v.size}</span></td>
                                            <td>${v.color}</td>
                                            <td><strong style="color: ${v.stock === 0 ? 'var(--color-danger)' : 'var(--color-warning)'};">${v.stock}</strong></td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.quickStockPrompt(${v.variantId}, ${v.stock})">
                                                    Restock
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load stats: ${err.message}</div>`;
        }
    },

    async loadProducts(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading product catalog...</div>`;

        try {
            const products = await API.getAdminProducts();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">CATALOG MANAGEMENT</div>
                        <h1 class="admin-page-title">ALL PRODUCTS (${products.length})</h1>
                    </div>
                    <button class="btn btn-primary" onclick="Admin.switchTab('add-product')">
                        + Add New Product
                    </button>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Thumbnail</th>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Total Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.map(p => `
                                    <tr>
                                        <td>
                                            <img src="${p.mainImageUrl}" style="width: 48px; height: 48px; object-fit: contain; background: #0e131d; border-radius: 4px; padding: 2px;" onerror="this.src='/images/placeholder-product.png'">
                                        </td>
                                        <td>
                                            <strong style="color: #ffffff; display: block;">${p.name}</strong>
                                            <span style="font-size: 0.78rem; color: var(--color-text-muted);">${p.brandName || ''} • ${p.gender || ''}</span>
                                        </td>
                                        <td><code>${p.sku}</code></td>
                                        <td>${p.categoryName || 'General'}</td>
                                        <td>
                                            <strong>${formatMoney(p.discountPrice || p.price)}</strong>
                                            ${p.discountPrice ? `<span style="font-size: 0.75rem; text-decoration: line-through; color: var(--color-text-muted); display: block;">${formatMoney(p.price)}</span>` : ''}
                                        </td>
                                        <td>
                                            <span class="badge ${p.totalStock <= 0 ? 'badge-sale' : (p.totalStock <= 5 ? 'badge-outline' : 'badge-legit')}">
                                                ${p.totalStock} units
                                            </span>
                                        </td>
                                        <td><span class="status-pill status-${p.status === 'ACTIVE' ? 'confirmed' : 'cancelled'}">${p.status}</span></td>
                                        <td>
                                            <div style="display: flex; gap: 8px;">
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.editProduct(${p.id})">Edit</button>
                                                <button class="btn btn-secondary btn-sm" style="color: var(--color-danger);" onclick="Admin.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load products: ${err.message}</div>`;
        }
    },

    async editProduct(id) {
        try {
            const product = await API.getProductById(id);
            const content = document.getElementById('admin-content-area');
            this.loadProductForm(content, product);
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            await API.deleteProduct(id);
            showToast(`"${name}" deleted successfully.`, 'success');
            this.switchTab('products');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    loadProductForm(container, product) {
        this.editingProductId = product ? product.id : null;
        this.productImages = product && product.images ? [...product.images] : [
            { imageUrl: product ? product.mainImageUrl : '', isMain: true }
        ];

        const p = product || {
            name: '',
            sku: 'LZPH-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            description: '',
            features: '',
            materials: '',
            careInstructions: '',
            price: '',
            discountPrice: '',
            categoryId: 1,
            subcategory: 'Running Shoes',
            brandId: 2,
            gender: 'MEN',
            sizeType: 'US_MEN_SHOES',
            status: 'ACTIVE',
            isFeatured: false,
            isNewArrival: true,
            isSale: false,
            variants: []
        };

        container.innerHTML = `
            <div class="admin-header">
                <div>
                    <div class="section-subtitle">${product ? 'UPDATE CATALOG' : 'NEW CATALOG ENTRY'}</div>
                    <h1 class="admin-page-title">${product ? `EDIT: ${p.name}` : 'ADD NEW PRODUCT'}</h1>
                </div>
                <button class="btn btn-secondary" onclick="Admin.switchTab('products')">
                    ← Back to Products
                </button>
            </div>

            <form id="admin-product-form" onsubmit="Admin.saveProductForm(event)">
                <div class="admin-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                        1. Basic Product Information
                    </h3>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" id="form-p-name" required value="${p.name}" placeholder="e.g. LAZAROPH Runner Pro X">
                        </div>
                        <div class="form-group">
                            <label class="form-label">SKU (Stock Keeping Unit) *</label>
                            <input type="text" class="form-control" id="form-p-sku" required value="${p.sku}" placeholder="e.g. LZPH-SH-RUN02">
                        </div>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label class="form-label">Category *</label>
                            <select class="form-control" id="form-p-category" onchange="Admin.onCategoryChange(this.value)">
                                <option value="1" ${p.categoryId == 1 ? 'selected' : ''}>Shoes</option>
                                <option value="2" ${p.categoryId == 2 ? 'selected' : ''}>Apparel</option>
                                <option value="3" ${p.categoryId == 3 ? 'selected' : ''}>Slides</option>
                                <option value="4" ${p.categoryId == 4 ? 'selected' : ''}>Watches</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Subcategory</label>
                            <input type="text" class="form-control" id="form-p-subcat" value="${p.subcategory || ''}" placeholder="e.g. Sneakers, T-Shirts">
                        </div>
                        <div class="form-group">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label class="form-label" style="margin-bottom: 0;">Brand *</label>
                                <div style="display: flex; gap: 6px;">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800; text-transform: uppercase;" onclick="Admin.openBrandModal(null, true)">
                                        + Add Brand
                                    </button>
                                    <button type="button" class="btn btn-danger btn-sm" style="font-size: 0.72rem; padding: 2px 8px; font-weight: 800; text-transform: uppercase;" onclick="Admin.deleteCurrentProductBrand()" title="Delete currently selected brand">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                            <select class="form-control" id="form-p-brand" onchange="Admin.onProductBrandSelectChange(this)">
                                ${(this.brands || []).filter(b => b.status === 'ACTIVE' || b.id == p.brandId).map(b => `
                                    <option value="${b.id}" ${p.brandId == b.id ? 'selected' : ''}>${b.name}</option>
                                `).join('')}
                                <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;">➕ + Add Brand...</option>
                                <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;">🗑️ - Delete Selected Brand</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label class="form-label">Target Gender</label>
                            <select class="form-control" id="form-p-gender">
                                <option value="MEN" ${p.gender === 'MEN' ? 'selected' : ''}>Men</option>
                                <option value="WOMEN" ${p.gender === 'WOMEN' ? 'selected' : ''}>Women</option>
                                <option value="KIDS" ${p.gender === 'KIDS' ? 'selected' : ''}>Kids</option>
                                <option value="UNISEX" ${p.gender === 'UNISEX' ? 'selected' : ''}>Unisex</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Base Retail Price (₱) *</label>
                            <input type="number" step="0.01" class="form-control" id="form-p-price" required value="${p.price}" placeholder="2499.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Discount Price (₱ Optional)</label>
                            <input type="number" step="0.01" class="form-control" id="form-p-discount" value="${p.discountPrice || ''}" placeholder="2199.00">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Product Description *</label>
                        <textarea class="form-control" id="form-p-desc" required placeholder="Comprehensive description of product ergonomics, aesthetics, and authenticity...">${p.description}</textarea>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label class="form-label">Key Features (1 per line)</label>
                            <textarea class="form-control" id="form-p-features" style="min-height: 80px;" placeholder="Responsive midsole\nEngineered mesh...">${p.features || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Materials & Specs</label>
                            <textarea class="form-control" id="form-p-materials" style="min-height: 80px;" placeholder="Synthetic leather, EVA Foam...">${p.materials || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Care Instructions</label>
                            <textarea class="form-control" id="form-p-care" style="min-height: 80px;" placeholder="Wipe with damp cloth...">${p.careInstructions || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Image Manager -->
                <div class="admin-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0; color: #ffffff;">
                            2. Product Photography & Images
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <input type="file" id="prod-file-upload-input" accept="image/*" multiple style="display: none;" onchange="Admin.handleProductMultipleFileUpload(this)">
                            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('prod-file-upload-input').click()">
                                📁 Upload Photo(s)
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="Admin.addImageRow()">
                                + Add Image URL
                            </button>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 16px;">
                        Upload product photos directly from your device (PNG, JPG, WebP) or enter image URLs.
                    </p>

                    <div id="admin-images-container" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        ${this.productImages.map((img, i) => `
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <div style="width: 44px; height: 38px; background: #fff; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                                    <img src="${img.imageUrl || '/images/placeholder-product.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/logo.png'">
                                </div>
                                <input type="text" class="form-control image-url-input" value="${img.imageUrl || ''}" oninput="this.previousElementSibling.querySelector('img').src=this.value" placeholder="/images/runner-x1-black-main.png or data:image/..." style="flex-grow: 1;">
                                <button type="button" class="btn btn-secondary btn-sm" onclick="Admin.removeImageRow(${i})">Remove</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- US Shoe Sizing & Variant Inventory Entry -->
                <div class="admin-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #ffffff;">
                        3. Size System & Variant Inventory
                    </h3>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 20px;">
                        Choose the size format. For shoes, US sizes are generated automatically. Enter initial stock for each available size.
                    </p>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Size Type System *</label>
                            <select class="form-control" id="form-p-sizetype" onchange="Admin.renderSizeVariantsChecklist(this.value)">
                                <option value="US_MEN_SHOES" ${p.sizeType === 'US_MEN_SHOES' ? 'selected' : ''}>US Men's Shoe Size (US 6 to US 14)</option>
                                <option value="US_WOMEN_SHOES" ${p.sizeType === 'US_WOMEN_SHOES' ? 'selected' : ''}>US Women's Shoe Size (US 5 to US 12)</option>
                                <option value="US_KIDS_SHOES" ${p.sizeType === 'US_KIDS_SHOES' ? 'selected' : ''}>US Kids' Shoe Size (US 1C to 6Y)</option>
                                <option value="APPAREL" ${p.sizeType === 'APPAREL' ? 'selected' : ''}>Apparel Size (XS to XXL)</option>
                                <option value="NO_SIZE" ${p.sizeType === 'NO_SIZE' ? 'selected' : ''}>No Size / Watches / Standard One Size</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Primary Color Name & Hex</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" class="form-control" id="form-p-color-name" value="Triple Black" placeholder="e.g. Triple Black, Pure White">
                                <input type="color" id="form-p-color-hex" value="#111111" style="height: 48px; width: 60px; background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer;">
                            </div>
                        </div>
                    </div>

                    <div class="admin-sizes-manager-box">
                        <h4 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                            Active Sizes & Stock Quantities
                        </h4>
                        <div id="admin-sizes-checklist" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                            <!-- Populated dynamically by renderSizeVariantsChecklist -->
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div style="margin-top: 30px; display: flex; gap: 16px;">
                    <button type="submit" class="btn btn-primary btn-lg" id="btn-save-product">
                        💾 SAVE PRODUCT TO STORE
                    </button>
                    <button type="button" class="btn btn-secondary btn-lg" onclick="Admin.switchTab('products')">
                        Cancel
                    </button>
                </div>
            </form>
        `;

        this.renderSizeVariantsChecklist(p.sizeType, p.variants);
    },

    onCategoryChange(catId) {
        const sizeSelect = document.getElementById('form-p-sizetype');
        if (!sizeSelect) return;

        if (catId === '1') {
            sizeSelect.value = 'US_MEN_SHOES';
        } else if (catId === '2' || catId === '3') {
            sizeSelect.value = 'APPAREL';
        } else if (catId === '4') {
            sizeSelect.value = 'NO_SIZE';
        }
        this.renderSizeVariantsChecklist(sizeSelect.value);
    },

    handleProductMultipleFileUpload(input) {
        const files = input.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file, idx) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                this.productImages.push({ imageUrl: dataUrl, isMain: this.productImages.length === 0 });
                const container = document.getElementById('admin-images-container');
                if (container) {
                    const div = document.createElement('div');
                    div.style.cssText = 'display: flex; gap: 10px; align-items: center;';
                    div.innerHTML = `
                        <div style="width: 44px; height: 38px; background: #fff; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                            <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        <input type="text" class="form-control image-url-input" value="${dataUrl}" oninput="this.previousElementSibling.querySelector('img').src=this.value" style="flex-grow: 1;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">Remove</button>
                    `;
                    container.appendChild(div);
                }
            };
            reader.readAsDataURL(file);
        });
        showToast(`${files.length} photo(s) selected & loaded!`, 'success');
    },

    addImageRow() {
        this.productImages.push({ imageUrl: '', isMain: false });
        const container = document.getElementById('admin-images-container');
        if (container) {
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; gap: 10px; align-items: center;';
            div.innerHTML = `
                <div style="width: 44px; height: 38px; background: #fff; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                    <img src="/images/placeholder-product.png" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <input type="text" class="form-control image-url-input" placeholder="/images/photo.png or https://..." oninput="this.previousElementSibling.querySelector('img').src=this.value" style="flex-grow: 1;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">Remove</button>
            `;
            container.appendChild(div);
        }
    },

    removeImageRow(index) {
        this.productImages.splice(index, 1);
        const container = document.getElementById('admin-images-container');
        if (container && container.children[index]) {
            container.children[index].remove();
        }
    },

    renderSizeVariantsChecklist(sizeType, existingVariants = []) {
        const container = document.getElementById('admin-sizes-checklist');
        if (!container) return;

        let sizeList = [];
        if (sizeType === 'US_MEN_SHOES') {
            sizeList = ['US 6', 'US 6.5', 'US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 11.5', 'US 12', 'US 12.5', 'US 13', 'US 14'];
        } else if (sizeType === 'US_WOMEN_SHOES') {
            sizeList = ['US 5', 'US 5.5', 'US 6', 'US 6.5', 'US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 11.5', 'US 12'];
        } else if (sizeType === 'US_KIDS_SHOES') {
            sizeList = ['US 1C', 'US 2C', 'US 3C', 'US 4C', 'US 5C', 'US 6C', 'US 7C', 'US 8C', 'US 9C', 'US 10C', 'US 1Y', 'US 2Y', 'US 3Y', 'US 4Y', 'US 5Y', 'US 6Y'];
        } else if (sizeType === 'APPAREL') {
            sizeList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
        } else {
            sizeList = ['One Size'];
        }

        container.innerHTML = sizeList.map(sz => {
            const existing = existingVariants.find(v => v.size === sz);
            const isChecked = existing ? existing.stock > 0 : true;
            const stockVal = existing ? existing.stock : (sizeType === 'NO_SIZE' ? 15 : 10);

            return `
                <div class="size-stock-input-row">
                    <label>
                        <input type="checkbox" class="size-checkbox" value="${sz}" ${isChecked ? 'checked' : ''} style="margin-right: 6px;">
                        ${sz}
                    </label>
                    <input type="number" min="0" class="size-stock-input" data-size="${sz}" value="${stockVal}" placeholder="Stock">
                </div>
            `;
        }).join('');
    },

    async saveProductForm(e) {
        e.preventDefault();

        const btn = document.getElementById('btn-save-product');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saving to Database...';
        }

        const name = document.getElementById('form-p-name').value;
        const sku = document.getElementById('form-p-sku').value;
        const categoryId = parseInt(document.getElementById('form-p-category').value);
        const subcategory = document.getElementById('form-p-subcat').value;
        const brandId = parseInt(document.getElementById('form-p-brand').value);
        const gender = document.getElementById('form-p-gender').value;
        const price = document.getElementById('form-p-price').value;
        const discountPrice = document.getElementById('form-p-discount').value;
        const description = document.getElementById('form-p-desc').value;
        const features = document.getElementById('form-p-features').value;
        const materials = document.getElementById('form-p-materials').value;
        const careInstructions = document.getElementById('form-p-care').value;
        const sizeType = document.getElementById('form-p-sizetype').value;
        const colorName = document.getElementById('form-p-color-name').value || 'Standard';
        const colorHex = document.getElementById('form-p-color-hex').value || '#111111';

        // Collect Images
        const imgInputs = document.querySelectorAll('.image-url-input');
        const images = [];
        imgInputs.forEach((inp, idx) => {
            const url = inp.value.trim();
            if (url) {
                images.push({ imageUrl: url, isMain: idx === 0, sortOrder: idx + 1 });
            }
        });
        if (images.length === 0) {
            images.push({ imageUrl: '/images/placeholder-product.png', isMain: true, sortOrder: 1 });
        }

        // Collect Size Variants
        const variants = [];
        const sizeBoxes = document.querySelectorAll('.size-checkbox:checked');
        sizeBoxes.forEach(box => {
            const sz = box.value;
            const stockInp = document.querySelector(`.size-stock-input[data-size="${sz}"]`);
            const stock = stockInp ? parseInt(stockInp.value) || 0 : 0;

            variants.push({
                size: sz,
                color: colorName,
                colorHex: colorHex,
                stock: stock,
                price: price
            });
        });

        const payload = {
            id: this.editingProductId,
            name,
            sku,
            categoryId,
            subcategory,
            brandId,
            gender,
            price,
            discountPrice,
            description,
            features,
            materials,
            careInstructions,
            sizeType,
            status: 'ACTIVE',
            isNewArrival: true,
            images,
            variants
        };

        try {
            await API.saveProduct(payload);
            showToast(`Product "${name}" saved successfully! It is now live on the store.`, 'success');
            this.switchTab('products');
        } catch (err) {
            showToast(err.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '💾 SAVE PRODUCT TO STORE';
            }
        }
    },

    async loadInventory(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading variant inventory matrix...</div>`;

        try {
            const matrix = await API.getAdminInventory();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">REAL-TIME STOCK MATRIX</div>
                        <h1 class="admin-page-title">INVENTORY MANAGEMENT (${matrix.length} VARIANTS)</h1>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Variant SKU</th>
                                    <th>Size</th>
                                    <th>Color</th>
                                    <th>Current Stock</th>
                                    <th>Status</th>
                                    <th>Inline Restock</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${matrix.map(m => `
                                    <tr>
                                        <td><strong style="color: #ffffff;">${m.productName}</strong></td>
                                        <td><code>${m.skuVariant}</code></td>
                                        <td><strong style="color: var(--color-brand-cyan);">${m.size}</strong></td>
                                        <td>
                                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${m.colorHex || '#000'}; vertical-align: middle; margin-right: 4px;"></span>
                                            ${m.color}
                                        </td>
                                        <td>
                                            <strong style="font-size: 1.1rem; color: ${m.stock === 0 ? 'var(--color-danger)' : (m.stock <= 5 ? 'var(--color-warning)' : 'var(--color-success)')};">
                                                ${m.stock}
                                            </strong>
                                        </td>
                                        <td>
                                            <span class="status-pill ${m.stock === 0 ? 'stock-out' : (m.stock <= 5 ? 'stock-low' : 'stock-in')}">
                                                ${m.stock === 0 ? 'OUT OF STOCK' : (m.stock <= 5 ? 'LOW STOCK' : 'IN STOCK')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <input type="number" min="0" value="${m.stock}" id="stock-inp-${m.variantId}" style="width: 70px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 4px; padding: 4px 8px; color: #ffffff; font-weight: 700;">
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.updateVariantStockInline(${m.variantId})">
                                                    Update
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load inventory: ${err.message}</div>`;
        }
    },

    async updateVariantStockInline(variantId) {
        const inp = document.getElementById(`stock-inp-${variantId}`);
        if (!inp) return;
        const newStock = parseInt(inp.value);
        if (isNaN(newStock) || newStock < 0) {
            showToast('Please enter a valid non-negative stock count.', 'error');
            return;
        }

        try {
            await API.updateInventoryStock(variantId, newStock);
            showToast('Variant stock updated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    quickStockPrompt(variantId, current) {
        const val = prompt('Enter new stock quantity:', current);
        if (val !== null) {
            const num = parseInt(val);
            if (!isNaN(num) && num >= 0) {
                API.updateInventoryStock(variantId, num)
                    .then(() => {
                        showToast('Stock updated!', 'success');
                        this.switchTab('dashboard');
                    })
                    .catch(e => showToast(e.message, 'error'));
            }
        }
    },

    async loadOrders(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading customer orders...</div>`;

        try {
            const orders = await API.getAdminOrders();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">ORDER FULFILLMENT</div>
                        <h1 class="admin-page-title">ALL CUSTOMER ORDERS (${orders.length})</h1>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Date</th>
                                    <th>Customer & Phone</th>
                                    <th>Shipping Address</th>
                                    <th>Items Ordered</th>
                                    <th>Total</th>
                                    <th>Status Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(o => `
                                    <tr>
                                        <td>
                                            <strong style="color: #ffffff;">${o.orderNumber}</strong>
                                            <span style="display: block; font-size: 0.75rem; color: var(--color-text-muted);">${o.paymentMethod}</span>
                                            ${o.paymentReference ? `<span style="display: block; font-size: 0.72rem; color: var(--color-brand-cyan); font-weight: 700;">Ref: ${o.paymentReference}</span>` : ''}
                                        </td>
                                        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <strong>${o.customerName}</strong>
                                            <div style="font-size: 0.8rem; color: var(--color-text-muted);">${o.customerPhone}</div>
                                        </td>
                                        <td style="max-width: 200px; font-size: 0.82rem; color: var(--color-text-secondary);">
                                            ${o.shippingAddress}, ${o.shippingCity}
                                        </td>
                                        <td>
                                            <ul style="list-style: none; font-size: 0.82rem;">
                                                ${o.items.map(it => `
                                                    <li>${it.productName} (<strong style="color: #fff;">${it.size}</strong>) × ${it.quantity}</li>
                                                `).join('')}
                                            </ul>
                                        </td>
                                        <td><strong style="color: var(--color-brand-red); font-size: 1.05rem;">${formatMoney(o.total)}</strong></td>
                                        <td>
                                            <select class="form-control" style="padding: 4px 8px; font-size: 0.82rem; width: 130px;" onchange="Admin.updateOrderStatus(${o.id}, this.value)">
                                                <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                                <option value="CONFIRMED" ${o.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                                                <option value="PROCESSING" ${o.status === 'PROCESSING' ? 'selected' : ''}>Processing</option>
                                                <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                                                <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                                                <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load orders: ${err.message}</div>`;
        }
    },

    async updateOrderStatus(orderId, status) {
        try {
            await API.updateOrderStatus(orderId, status);
            showToast(`Order status updated to ${status}!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async loadCustomOrders(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading customized jersey pipeline...</div>`;

        try {
            const customOrders = await API.getAdminCustomOrders();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">CUSTOM SPORTSWEAR PIPELINE</div>
                        <h1 class="admin-page-title">CUSTOMIZED JERSEY ORDERS (${customOrders.length})</h1>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Player Name</th>
                                    <th>Number</th>
                                    <th>Team</th>
                                    <th>Size & Color</th>
                                    <th>Instructions</th>
                                    <th>Production Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customOrders.map(co => `
                                    <tr>
                                        <td><strong>${co.orderNumber}</strong></td>
                                        <td>
                                            ${co.customerName}
                                            <div style="font-size: 0.78rem; color: var(--color-text-muted);">${co.customerEmail}</div>
                                        </td>
                                        <td><strong style="color: #ffffff; font-size: 1.1rem;">${co.jerseyName}</strong></td>
                                        <td><span class="badge badge-brand" style="font-size: 0.95rem;">#${co.jerseyNumber}</span></td>
                                        <td><strong style="color: var(--color-brand-cyan);">${co.teamName}</strong></td>
                                        <td>${co.size} • ${co.color}</td>
                                        <td style="max-width: 180px; font-size: 0.8rem; color: var(--color-text-secondary);">
                                            ${co.customizationNotes || 'None'}
                                        </td>
                                        <td>
                                            <select class="form-control" style="padding: 4px 8px; font-size: 0.82rem; width: 150px;" onchange="Admin.updateCustomStatus(${co.id}, this.value)">
                                                <option value="PENDING_DESIGN" ${co.status === 'PENDING_DESIGN' ? 'selected' : ''}>Pending Design</option>
                                                <option value="DESIGN_APPROVED" ${co.status === 'DESIGN_APPROVED' ? 'selected' : ''}>Design Approved</option>
                                                <option value="IN_PRODUCTION" ${co.status === 'IN_PRODUCTION' ? 'selected' : ''}>In Production</option>
                                                <option value="READY" ${co.status === 'READY' ? 'selected' : ''}>Ready for Packing</option>
                                                <option value="SHIPPED" ${co.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                                                <option value="COMPLETED" ${co.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load custom orders: ${err.message}</div>`;
        }
    },

    async updateCustomStatus(id, status) {
        try {
            await API.updateCustomOrderStatus(id, status);
            showToast(`Custom order status updated to ${status}!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async loadCustomers(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading customer database...</div>`;

        try {
            const users = await API.getAdminCustomers();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">USER DIRECTORY</div>
                        <h1 class="admin-page-title">ALL REGISTERED ACCOUNTS (${users.length})</h1>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Address / City</th>
                                    <th>Role</th>
                                    <th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td>#${u.id}</td>
                                        <td><strong style="color: #ffffff;">${u.name}</strong></td>
                                        <td>${u.email}</td>
                                        <td>${u.phone || 'N/A'}</td>
                                        <td>${u.city ? `${u.city}, ${u.province || ''}` : 'N/A'}</td>
                                        <td><span class="badge ${u.role === 'ADMIN' ? 'badge-brand' : 'badge-outline'}">${u.role}</span></td>
                                        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load users: ${err.message}</div>`;
        }
    },

    async loadSettings(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading store & admin settings...</div>`;

        try {
            const settings = await API.getAdminSettings();
            const u = Auth.currentUser || {};

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">STORE CONFIGURATION</div>
                        <h1 class="admin-page-title">STORE & ADMIN SETTINGS</h1>
                    </div>
                </div>

                <div class="form-grid-2">
                    <!-- 1. Admin Profile & Contact Info -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            1. Administrator Account & Mobile
                        </h3>
                        <form id="form-admin-profile" onsubmit="Admin.saveAdminProfileForm(event)">
                            <div class="form-group">
                                <label class="form-label">Admin Full Name *</label>
                                <input type="text" class="form-control" id="settings-admin-name" required value="${u.name || ''}" placeholder="LAZAROPH Administrator">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Admin Email Address *</label>
                                <input type="email" class="form-control" id="settings-admin-email" required value="${u.email || ''}" placeholder="admin@lazaroph.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Admin Phone / Contact Number *</label>
                                <input type="text" class="form-control" id="settings-admin-phone" required value="${u.phone || settings.adminPhone || '282948572'}" placeholder="282948572 or 09171234567" style="border-color: var(--color-brand-cyan); font-weight: 700; font-size: 1.05rem;">
                                <span style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 4px; display: block;">
                                    This number updates your administrator profile and store master contact.
                                </span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Change Password (Optional)</label>
                                <input type="password" class="form-control" id="settings-admin-password" placeholder="Leave blank to keep current password">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-admin-profile" style="margin-top: 10px;">
                                💾 UPDATE ADMIN PROFILE & NUMBER
                            </button>
                        </form>
                    </div>

                    <!-- 2. Official Receiving Payment Details (GCash / Maya / Banks) -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                            2. Receiving Payment Numbers & Accounts
                        </h3>
                        <form id="form-store-settings" onsubmit="Admin.saveStoreSettingsForm(event)">
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label class="form-label">GCash Mobile Number *</label>
                                    <input type="text" class="form-control" id="settings-gcash-num" required value="${settings.gcashNumber || '0917-282-9485'}" placeholder="0917-282-9485" style="font-weight: 700; color: #00e5ff;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">GCash Account Name</label>
                                    <input type="text" class="form-control" id="settings-gcash-name" value="${settings.gcashName || 'LAZAROPH PHILIPPINES'}">
                                </div>
                            </div>
                            <!-- GCash QR Code Configuration -->
                            <div class="form-group">
                                <label class="form-label">GCash QR Code Image URL / File Path</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="text" class="form-control" id="settings-gcash-qr" value="${settings.gcashQrUrl || '/images/qr-gcash-demo.png'}" placeholder="/images/qr-gcash-demo.png" style="flex-grow: 1;" oninput="document.getElementById('prev-gcash-qr').src = this.value">
                                    <img id="prev-gcash-qr" src="${settings.gcashQrUrl || '/images/qr-gcash-demo.png'}" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px;" onerror="this.src='/images/qr-gcash-demo.png'">
                                </div>
                                <span style="font-size: 0.75rem; color: var(--color-text-muted);">Displayed to customers at checkout when paying via GCash.</span>
                            </div>

                            <div class="form-grid-2" style="margin-top: 14px;">
                                <div class="form-group">
                                    <label class="form-label">Maya (PayMaya) Number *</label>
                                    <input type="text" class="form-control" id="settings-maya-num" required value="${settings.mayaNumber || '0917-282-9485'}" placeholder="0917-282-9485" style="font-weight: 700; color: #00e5ff;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Maya Account Name</label>
                                    <input type="text" class="form-control" id="settings-maya-name" value="${settings.mayaName || 'LAZAROPH PHILIPPINES'}">
                                </div>
                            </div>
                            <!-- Maya QR Code Configuration -->
                            <div class="form-group">
                                <label class="form-label">Maya / QR Ph Image URL / File Path</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="text" class="form-control" id="settings-maya-qr" value="${settings.mayaQrUrl || '/images/qr-maya-demo.png'}" placeholder="/images/qr-maya-demo.png" style="flex-grow: 1;" oninput="document.getElementById('prev-maya-qr').src = this.value">
                                    <img id="prev-maya-qr" src="${settings.mayaQrUrl || '/images/qr-maya-demo.png'}" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px;" onerror="this.src='/images/qr-maya-demo.png'">
                                </div>
                                <span style="font-size: 0.75rem; color: var(--color-text-muted);">Displayed to customers at checkout when paying via Maya.</span>
                            </div>

                            <div class="form-group" style="margin-top: 14px;">
                                <label class="form-label">BDO Bank Account</label>
                                <input type="text" class="form-control" id="settings-bdo" value="${settings.bdoAccount || '0012-3456-7890 (Lazaro PH)'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">BPI Bank Account</label>
                                <input type="text" class="form-control" id="settings-bpi" value="${settings.bpiAccount || '9876-5432-10 (Lazaro PH)'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Public Store Hotline / Telephone</label>
                                <input type="text" class="form-control" id="settings-store-phone" value="${settings.storePhone || '282948572'}">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-store-settings" style="margin-top: 10px;">
                                💾 SAVE PAYMENT, QR CODES & HOTLINE
                            </button>
                        </form>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load settings: ${err.message}</div>`;
        }
    },

    async saveAdminProfileForm(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-admin-profile');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saving...';
        }

        const name = document.getElementById('settings-admin-name').value;
        const email = document.getElementById('settings-admin-email').value;
        const phone = document.getElementById('settings-admin-phone').value;
        const password = document.getElementById('settings-admin-password').value;

        try {
            const updated = await API.updateAdminProfile({ name, email, phone, password });
            Auth.currentUser = updated;
            localStorage.setItem('lazaroph_user', JSON.stringify(updated));
            showToast('Admin contact number and profile updated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '💾 UPDATE ADMIN PROFILE & NUMBER';
            }
        }
    },

    async saveStoreSettingsForm(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-store-settings');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saving...';
        }

        const gcashNumber = document.getElementById('settings-gcash-num').value;
        const gcashName = document.getElementById('settings-gcash-name').value;
        const gcashQrUrl = document.getElementById('settings-gcash-qr').value;
        const mayaNumber = document.getElementById('settings-maya-num').value;
        const mayaName = document.getElementById('settings-maya-name').value;
        const mayaQrUrl = document.getElementById('settings-maya-qr').value;
        const bdoAccount = document.getElementById('settings-bdo').value;
        const bpiAccount = document.getElementById('settings-bpi').value;
        const storePhone = document.getElementById('settings-store-phone').value;

        try {
            await API.saveAdminSettings({
                gcashNumber,
                gcashName,
                gcashQrUrl,
                mayaNumber,
                mayaName,
                mayaQrUrl,
                bdoAccount,
                bpiAccount,
                storePhone,
                adminPhone: storePhone
            });
            showToast('Receiving payment numbers and QR codes updated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '💾 SAVE PAYMENT, QR CODES & HOTLINE';
            }
        }
    },

    // ==========================================================
    // BRAND MANAGEMENT MODULE
    // ==========================================================

    async loadBrands(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;"><div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite;"></div><p style="margin-top: 14px; color: #6b7280; font-weight: 600;">Loading brand directory...</p></div>`;

        try {
            const brands = await API.getAdminBrands();
            this.brands = brands;

            const activeCount = brands.filter(b => b.status === 'ACTIVE').length;
            const inactiveCount = brands.filter(b => b.status === 'INACTIVE').length;
            const totalProducts = brands.reduce((acc, b) => acc + (b.productCount || 0), 0);

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">PARTNER &amp; HOUSE LABELS</div>
                        <h1 class="admin-page-title">BRAND MANAGEMENT</h1>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="Admin.openBrandModal(null)">
                            + Add Brand
                        </button>
                    </div>
                </div>

                <!-- Brand KPI Summary -->
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Total Brands</span><div class="kpi-icon">🏷️</div></div>
                        <div class="kpi-value">${brands.length}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Active Brands</span><div class="kpi-icon">🟢</div></div>
                        <div class="kpi-value">${activeCount}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Inactive Brands</span><div class="kpi-icon">⚪</div></div>
                        <div class="kpi-value">${inactiveCount}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Catalog Products Linked</span><div class="kpi-icon">📦</div></div>
                        <div class="kpi-value">${totalProducts}</div>
                    </div>
                </div>

                <!-- Search & Filters Toolbar -->
                <div class="admin-card" style="margin-bottom: 20px; padding: 16px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div style="position: relative; flex: 1; min-width: 260px;">
                            <input type="text" class="form-control" id="admin-brand-search-input" placeholder="Search brands by name or description..." oninput="Admin.filterAdminBrands(this.value)">
                        </div>
                        <div style="color: #6b7280; font-size: 0.85rem; font-weight: 700;">
                            Showing <span id="admin-brand-count">${brands.length}</span> Brands
                        </div>
                    </div>
                </div>

                <!-- Brands Grid Table -->
                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table" id="admin-brands-table">
                            <thead>
                                <tr>
                                    <th style="width: 70px;">Logo</th>
                                    <th>Brand Name</th>
                                    <th>Slug</th>
                                    <th>Description</th>
                                    <th style="text-align: center;">Products</th>
                                    <th style="text-align: center;">Status</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="admin-brands-tbody">
                                ${this.renderBrandRows(brands)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: #dc2626; padding: 40px;">Failed to load brands: ${err.message}</div>`;
        }
    },

    renderBrandRows(brands) {
        if (!brands || brands.length === 0) {
            return `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">No brands found. Click "+ Add Brand" to create one.</td></tr>`;
        }

        return brands.map(b => `
            <tr data-brand-id="${b.id}">
                <td>
                    <div style="width: 52px; height: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px; overflow: hidden;">
                        <img src="${b.logoUrl || '/images/logo.png'}" alt="${b.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/logo.png'">
                    </div>
                </td>
                <td style="font-weight: 800; font-size: 0.95rem; color: #000000;">
                    ${b.name}
                </td>
                <td>
                    <code style="font-size: 0.75rem; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${b.slug}</code>
                </td>
                <td style="color: #4b5563; font-size: 0.85rem; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${b.description || '<span style="color:#9ca3af;">No description</span>'}
                </td>
                <td style="text-align: center;">
                    <span class="badge ${b.productCount > 0 ? 'badge-brand' : 'badge-secondary'}" style="font-size: 0.75rem; font-weight: 800;">
                        ${b.productCount || 0} Products
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="badge ${b.status === 'ACTIVE' ? 'badge-legit' : 'badge-danger'}" style="cursor: pointer;" onclick="Admin.toggleBrandStatus(${b.id}, '${b.status}')" title="Click to toggle status">
                        ${b.status === 'ACTIVE' ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                    </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-secondary btn-sm" onclick='Admin.openBrandModal(${JSON.stringify(b).replace(/'/g, "&apos;")})' title="Edit Brand">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" style="color: ${b.status === 'ACTIVE' ? '#eab308' : '#22c55e'};" onclick="Admin.toggleBrandStatus(${b.id}, '${b.status}')" title="Toggle Active / Inactive">
                        ${b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin.deleteBrand(${b.id}, '${b.name.replace(/'/g, "\\'")}')" title="Delete Brand">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    },

    filterAdminBrands(query) {
        const q = (query || '').toLowerCase().trim();
        const tbody = document.getElementById('admin-brands-tbody');
        const countSpan = document.getElementById('admin-brand-count');
        if (!tbody) return;

        const filtered = (this.brands || []).filter(b => 
            b.name.toLowerCase().includes(q) || 
            (b.description && b.description.toLowerCase().includes(q)) ||
            (b.slug && b.slug.toLowerCase().includes(q))
        );

        if (countSpan) countSpan.textContent = filtered.length;
        tbody.innerHTML = this.renderBrandRows(filtered);
    },

    onProductBrandSelectChange(selectElem) {
        if (!selectElem) return;
        if (selectElem.value === '__ADD_NEW__') {
            this.openBrandModal(null, true);
        } else if (selectElem.value === '__DELETE_CURRENT__') {
            this.deleteCurrentProductBrand();
        } else {
            this._lastSelectedBrandId = selectElem.value;
        }
    },

    async deleteCurrentProductBrand() {
        const brandSelect = document.getElementById('form-p-brand');
        if (!brandSelect) return;

        let brandId = parseInt(brandSelect.value);
        if (!brandId || isNaN(brandId) || brandId <= 0) {
            brandId = parseInt(this._lastSelectedBrandId);
        }
        if (!brandId || isNaN(brandId) || brandId <= 0) {
            showToast('Please select a valid brand to delete.', 'warning');
            return;
        }

        const brand = (this.brands || []).find(b => b.id === brandId);
        const brandName = brand ? brand.name : 'Selected Brand';

        if (!confirm(`Are you sure you want to delete brand "${brandName}"?`)) {
            if (brandSelect.value === '__DELETE_CURRENT__') {
                brandSelect.value = this._lastSelectedBrandId || (this.brands && this.brands[0] ? this.brands[0].id : '1');
            }
            return;
        }

        try {
            await API.deleteAdminBrand(brandId);
            showToast(`Brand "${brandName}" deleted successfully!`, 'success');

            // Refresh local brands state
            this.brands = await API.getAdminBrands();
            const activeBrands = (this.brands || []).filter(b => b.status === 'ACTIVE');

            brandSelect.innerHTML = activeBrands.map(b => `
                <option value="${b.id}">${b.name}</option>
            `).join('') + `
                <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;">➕ + Add Brand...</option>
                <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;">🗑️ - Delete Selected Brand</option>
            `;

            if (activeBrands.length > 0) {
                brandSelect.value = activeBrands[0].id;
                this._lastSelectedBrandId = activeBrands[0].id;
            }
        } catch (err) {
            showToast(err.message, 'error');
            if (brandSelect.value === '__DELETE_CURRENT__') {
                brandSelect.value = this._lastSelectedBrandId || '1';
            }
        }
    },

    openBrandModal(brand, fromProductForm = false) {
        this._brandModalFromProduct = fromProductForm;
        const brandSelect = document.getElementById('form-p-brand');
        if (brandSelect && brandSelect.value !== '__ADD_NEW__') {
            this._lastSelectedBrandId = brandSelect.value;
        }

        let modal = document.getElementById('modal-admin-brand');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-admin-brand';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const isEdit = !!brand;
        const b = brand || {
            id: 0,
            name: '',
            slug: '',
            logoUrl: '/images/brand-nike.png',
            description: '',
            status: 'ACTIVE'
        };

        modal.innerHTML = `
            <div class="modal-container" style="max-width: 580px;">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? `EDIT BRAND: ${b.name}` : '➕ ADD NEW BRAND'}</h3>
                    <button type="button" class="modal-close" onclick="Admin.closeBrandModal()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-admin-brand" onsubmit="Admin.saveBrandModal(event)">
                        <input type="hidden" id="brand-form-id" value="${b.id}">

                        <div class="form-group">
                            <label class="form-label">Brand Name *</label>
                            <input type="text" class="form-control" id="brand-form-name" required value="${b.name}" placeholder="e.g. Nike, Adidas, Puma, New Balance...">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Brand Logo / Image *</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input type="text" class="form-control" id="brand-form-logo" required value="${b.logoUrl || '/images/logo.png'}" oninput="document.getElementById('brand-logo-preview-img').src=this.value" placeholder="/images/brand-nike.png, https://... or upload photo">
                                <div style="width: 58px; height: 46px; background: #fff; border: 2px dashed #000; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px; flex-shrink: 0; cursor: pointer;" onclick="document.getElementById('brand-file-input').click()" title="Click to upload logo from device">
                                    <img id="brand-logo-preview-img" src="${b.logoUrl || '/images/logo.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/logo.png'">
                                </div>
                            </div>

                            <!-- Upload Image Button & Hidden File Input -->
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 8px;">
                                <input type="file" id="brand-file-input" accept="image/*" style="display: none;" onchange="Admin.handleBrandFileUpload(this)">
                                <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800; padding: 4px 12px; display: flex; align-items: center; gap: 6px;" onclick="document.getElementById('brand-file-input').click()">
                                    📁 Upload Photo / Image File
                                </button>
                                <span style="font-size: 0.72rem; color: #6b7280;">Supports PNG, JPG, SVG, WebP</span>
                            </div>

                            <!-- Quick Preset Logos -->
                            <div style="margin-top: 10px;">
                                <span style="font-size: 0.72rem; color: #6b7280; font-weight: 700;">Or Pick Preset Brand Logo:</span>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Nike', '/images/brand-nike.png')">Nike</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Adidas', '/images/brand-adidas.png')">Adidas</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Puma', '/images/brand-puma.png')">Puma</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('New Balance', '/images/brand-nb.png')">New Balance</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Converse', '/images/brand-converse.png')">Converse</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Vans', '/images/brand-vans.png')">Vans</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Under Armour', '/images/brand-ua.png')">Under Armour</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Asics', '/images/brand-asics.png')">Asics</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Reebok', '/images/brand-reebok.png')">Reebok</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Jordan', '/images/brand-jordan.png')">Jordan</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Casio', '/images/brand-casio.png')">Casio</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Seiko', '/images/brand-seiko.png')">Seiko</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('LAZAROPH Signature', '/images/logo.png')">LAZAROPH</button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Brand Description</label>
                            <textarea class="form-control" id="brand-form-desc" rows="3" placeholder="Brief background of the sports-fashion label...">${b.description || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Brand Status *</label>
                            <select class="form-control" id="brand-form-status">
                                <option value="ACTIVE" ${b.status === 'ACTIVE' ? 'selected' : ''}>🟢 ACTIVE (Available in Product creation & Customer store)</option>
                                <option value="INACTIVE" ${b.status === 'INACTIVE' ? 'selected' : ''}>⚪ INACTIVE (Hidden from new product dropdown)</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary btn-block" onclick="Admin.closeBrandModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-brand-modal">
                                💾 ${isEdit ? 'Update Brand' : 'Save Brand'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    handleBrandFileUpload(input) {
        const file = input.files && input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const logoInput = document.getElementById('brand-form-logo');
            const previewImg = document.getElementById('brand-logo-preview-img');

            if (logoInput) logoInput.value = dataUrl;
            if (previewImg) previewImg.src = dataUrl;
            showToast(`Image "${file.name}" uploaded successfully!`, 'success');
        };
        reader.readAsDataURL(file);
    },

    selectPresetBrandLogo(name, logoUrl) {
        const nameInput = document.getElementById('brand-form-name');
        const logoInput = document.getElementById('brand-form-logo');
        const previewImg = document.getElementById('brand-logo-preview-img');

        if (nameInput && !nameInput.value) nameInput.value = name;
        if (logoInput) logoInput.value = logoUrl;
        if (previewImg) previewImg.src = logoUrl;
    },

    closeBrandModal() {
        const modal = document.getElementById('modal-admin-brand');
        if (modal) modal.classList.remove('active');

        if (this._brandModalFromProduct) {
            const brandSelect = document.getElementById('form-p-brand');
            if (brandSelect && brandSelect.value === '__ADD_NEW__') {
                brandSelect.value = this._lastSelectedBrandId || (this.brands && this.brands[0] ? this.brands[0].id : '1');
            }
            this._brandModalFromProduct = false;
        }
    },

    async saveBrandModal(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-brand-modal');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saving Brand...';
        }

        const id = parseInt(document.getElementById('brand-form-id').value) || 0;
        const name = document.getElementById('brand-form-name').value.trim();
        const logoUrl = document.getElementById('brand-form-logo').value.trim();
        const description = document.getElementById('brand-form-desc').value.trim();
        const status = document.getElementById('brand-form-status').value;

        try {
            await API.saveAdminBrand({ id, name, logoUrl, description, status });
            showToast(`Brand "${name}" saved successfully!`, 'success');
            
            // Refresh local brands state
            this.brands = await API.getAdminBrands();

            // If triggered from Product Form, update brand select and auto-select new brand
            if (this._brandModalFromProduct) {
                const brandSelect = document.getElementById('form-p-brand');
                if (brandSelect) {
                    const activeBrands = (this.brands || []).filter(b => b.status === 'ACTIVE');
                    brandSelect.innerHTML = activeBrands.map(b => `
                        <option value="${b.id}">${b.name}</option>
                    `).join('') + `
                        <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;">➕ + Add Brand...</option>
                        <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;">🗑️ - Delete Selected Brand</option>
                    `;

                    const newBrand = (this.brands || []).find(b => b.name.toLowerCase() === name.toLowerCase()) || activeBrands[activeBrands.length - 1];
                    if (newBrand) {
                        brandSelect.value = newBrand.id;
                        this._lastSelectedBrandId = newBrand.id;
                    }
                }
                this._brandModalFromProduct = false;
            }

            this.closeBrandModal();

            // Reload brands table if on brands tab
            if (this.currentTab === 'brands') {
                const content = document.getElementById('admin-content-area');
                if (content) this.loadBrands(content);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '💾 Save Brand';
            }
        }
    },

    async toggleBrandStatus(id, currentStatus) {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await API.updateAdminBrandStatus(id, newStatus);
            showToast(`Brand status updated to ${newStatus}`, 'success');
            this.brands = await API.getAdminBrands();
            if (this.currentTab === 'brands') {
                const content = document.getElementById('admin-content-area');
                if (content) this.loadBrands(content);
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async deleteBrand(id, name) {
        if (!confirm(`Are you sure you want to delete brand "${name}"? If products are linked, it will be safely deactivated.`)) return;

        try {
            await API.deleteAdminBrand(id);
            showToast(`Brand "${name}" processed successfully.`, 'success');
            this.brands = await API.getAdminBrands();
            if (this.currentTab === 'brands') {
                const content = document.getElementById('admin-content-area');
                if (content) this.loadBrands(content);
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
