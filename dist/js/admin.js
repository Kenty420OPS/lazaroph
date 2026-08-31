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
    unreadCheckInterval: null,

    async init(initialTab = 'dashboard') {
        if (!AdminAuth.isVerified()) {
            App.navigate('admin/login');
            showToast('Access denied. Administrator privileges required.', 'error');
            return;
        }

        const currentAdmin = AdminAuth.getAdmin();
        const nameEl = document.getElementById('admin-sidebar-user-name');
        if (nameEl && currentAdmin) {
            nameEl.textContent = currentAdmin.name;
        }

        try {
            this.categories = await API.getCategories();
            this.brands = await API.getBrands();
            this.checkUnreadMessages();
        } catch (ignored) {}

        // Check unread chat messages periodically (clean existing interval to prevent timer leaks)
        if (this.unreadCheckInterval) {
            clearInterval(this.unreadCheckInterval);
        }
        this.unreadCheckInterval = setInterval(() => this.checkUnreadMessages(), 8000);

        this.switchTab(initialTab || 'dashboard');
    },

    // =========================================================================
    // SHARED HIGH-PERFORMANCE DELETE ENGINE & NON-BLOCKING CONFIRMATIONS
    // =========================================================================
    safeEscape(val) {
        if (val === null || val === undefined) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    confirmModal({ title = 'Confirm Deletion', message = 'Are you sure you want to delete this item?', warningText = '', confirmText = 'Yes, Delete', cancelText = 'Cancel' } = {}) {
        return new Promise((resolve) => {
            let modal = document.getElementById('modal-admin-delete-confirm');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-admin-delete-confirm';
                document.body.appendChild(modal);
            }

            modal.className = 'admin-delete-modal-overlay active';
            modal.classList.remove('hidden-modal');
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.style.pointerEvents = 'auto';

            const safeTitle = Admin.safeEscape(title);
            const safeMessage = Admin.safeEscape(message);
            const safeWarning = Admin.safeEscape(warningText);
            const safeCancel = Admin.safeEscape(cancelText);
            const safeConfirm = Admin.safeEscape(confirmText);

            modal.innerHTML = `
                <div class="admin-delete-modal-card">
                    <div class="admin-delete-modal-header">
                        <div class="admin-delete-modal-icon"></div>
                        <h3 class="admin-delete-modal-title">${safeTitle}</h3>
                    </div>
                    <div class="admin-delete-modal-body">
                        <p style="margin: 0; font-size: 0.95rem; color: #ffffff; font-weight: 600;">${safeMessage}</p>
                        ${safeWarning ? `
                            <div class="admin-delete-modal-warning-tag">
                                <span></span>
                                <span>${safeWarning}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="admin-delete-modal-footer">
                        <button type="button" class="btn btn-secondary" id="admin-confirm-cancel-btn" style="padding: 8px 16px; font-weight: 700;">${safeCancel}</button>
                        <button type="button" class="btn btn-confirm-delete" id="admin-confirm-proceed-btn">${safeConfirm}</button>
                    </div>
                </div>
            `;

            const cleanup = (result) => {
                modal.classList.add('hidden-modal');
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                modal.style.pointerEvents = 'none';
                document.removeEventListener('keydown', onKeyDown);
                resolve(result);
            };

            const onKeyDown = (e) => {
                if (e.key === 'Escape') cleanup(false);
                else if (e.key === 'Enter') cleanup(true);
            };

            document.addEventListener('keydown', onKeyDown);

            const cancelBtn = document.getElementById('admin-confirm-cancel-btn');
            const proceedBtn = document.getElementById('admin-confirm-proceed-btn');

            if (cancelBtn) cancelBtn.onclick = (e) => { e.stopPropagation(); cleanup(false); };
            if (proceedBtn) proceedBtn.onclick = (e) => { e.stopPropagation(); cleanup(true); };
            modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
        });
    },

    async executeDelete({ btn, targetRowSelector, deleteAction, successMsg = 'Deleted successfully.', onComplete } = {}) {
        let originalHtml = '';
        let targetEl = null;

        if (btn) {
            originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('btn-delete-loading');
            btn.innerHTML = `<span class="btn-spinner" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></span> Deleting...`;
        }

        if (targetRowSelector) {
            if (typeof targetRowSelector === 'string') {
                if (targetRowSelector.startsWith('#')) {
                    targetEl = document.getElementById(targetRowSelector.substring(1)) || document.querySelector(targetRowSelector);
                } else {
                    targetEl = document.querySelector(targetRowSelector);
                }
            } else {
                targetEl = targetRowSelector;
            }

            if (targetEl) {
                targetEl.classList.add('row-deleting');
            }
        }

        try {
            await deleteAction();

            if (targetEl) {
                targetEl.classList.remove('row-deleting');
                targetEl.classList.add('row-deleted');
                setTimeout(() => {
                    if (targetEl && targetEl.parentNode) {
                        targetEl.parentNode.removeChild(targetEl);
                    }
                }, 300);
            }

            showToast(successMsg, 'success');
            if (typeof onComplete === 'function') {
                onComplete();
            }
            return true;
        } catch (err) {
            console.error('[Admin Delete Error]:', err);
            if (targetEl) {
                targetEl.classList.remove('row-deleting');
            }
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('btn-delete-loading');
                btn.innerHTML = originalHtml;
            }
            showToast(err.message || 'Deletion failed. Please check network or permissions.', 'error');
            return false;
        }
    },

    async checkUnreadMessages() {
        try {
            const data = await API.getUnreadChatCount();
            const count = data.unreadCount || 0;
            const badge = document.getElementById('admin-chat-unread-badge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (ignored) {}
    },

    toggleMobileSidebar(forceState) {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('admin-mobile-overlay');
        if (!sidebar) return;
        const willOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('mobile-open');
        if (willOpen) {
            sidebar.classList.add('mobile-open');
            if (overlay) overlay.classList.add('active');
            document.body.classList.add('no-scroll');
        } else {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    },

    switchTab(tab) {
        this.currentTab = tab;

        if (tab !== 'chat') {
            this.stopAdminChatPolling();
            this.renderedChatConvId = null;
        }

        // Auto-close mobile sidebar drawer when a tab is chosen
        this.toggleMobileSidebar(false);

        document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.admin-nav-btn[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Sync mobile horizontal navigation pills
        document.querySelectorAll('.admin-pill-btn').forEach(p => p.classList.remove('active'));
        const activePill = document.querySelector(`.admin-pill-btn[data-pill="${tab}"]`);
        if (activePill) {
            activePill.classList.add('active');
            try {
                activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } catch (ignored) {}
        }

        const content = document.getElementById('admin-content-area');
        if (!content) return;

        if (tab === 'dashboard') {
            this.loadDashboard(content);
        } else if (tab === 'sales' || tab === 'gross-sales') {
            this.loadGrossSales(content);
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
        } else if (tab === 'chat') {
            this.loadChat(content);
        } else if (tab === 'custom-orders') {
            this.loadCustomOrders(content);
        } else if (tab === 'customers') {
            this.loadCustomers(content);
        } else if (tab === 'settings') {
            this.loadSettings(content);
        } else if (tab === 'homepage-management' || tab === 'featured-categories') {
            this.loadHomepageManagement(content);
        } else if (tab === 'admin-management') {
            this.loadAdminManagement(content);
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

                <!-- KPI Metrics Cards (All Interactive & Clickable!) -->
                <div class="kpi-grid">
                    <div class="kpi-card kpi-card-clickable" onclick="Admin.switchTab('sales')" title="Click to view full Gross Sales Details & Financial Breakdown">
                        <div class="kpi-header">
                            <span class="kpi-title">Gross Sales (Click to View)</span>
                            <div class="kpi-icon">₱</div>
                        </div>
                        <div class="kpi-value" style="color: #10b981;">${formatMoney(stats.totalSales)}</div>
                        <div class="kpi-footer-hint"> View itemized sales breakdown →</div>
                    </div>

                    <div class="kpi-card kpi-card-clickable kpi-orders" onclick="Admin.switchTab('orders')" title="Click to view Customer Orders">
                        <div class="kpi-header">
                            <span class="kpi-title">Total Orders</span>
                            
                        </div>
                        <div class="kpi-value">${stats.totalOrders}</div>
                        <div class="kpi-footer-hint">Manage all orders →</div>
                    </div>

                    <div class="kpi-card kpi-card-clickable kpi-customers" onclick="Admin.switchTab('customers')" title="Click to view Registered Customers">
                        <div class="kpi-header">
                            <span class="kpi-title">Registered Customers</span>
                            
                        </div>
                        <div class="kpi-value">${stats.totalCustomers}</div>
                        <div class="kpi-footer-hint">View customer directory →</div>
                    </div>

                    <div class="kpi-card kpi-card-clickable" onclick="Admin.switchTab('products')" title="Click to view Live Products">
                        <div class="kpi-header">
                            <span class="kpi-title">Live Products</span>
                            
                        </div>
                        <div class="kpi-value">${stats.totalProducts}</div>
                        <div class="kpi-footer-hint">Manage catalog items →</div>
                    </div>

                    <div class="kpi-card kpi-card-clickable kpi-stock" onclick="Admin.filterOrdersByStatus ? Admin.filterOrdersByStatus('PENDING') : Admin.switchTab('orders')" title="Click to view Pending Orders">
                        <div class="kpi-header">
                            <span class="kpi-title">Pending Orders</span>
                            <div class="kpi-icon">⏳</div>
                        </div>
                        <div class="kpi-value" style="color: var(--color-warning);">${stats.pendingOrdersCount !== undefined ? stats.pendingOrdersCount : (stats.orders ? stats.orders.filter(o => o.status === 'PENDING').length : 0)}</div>
                        <div class="kpi-footer-hint">View pending queue →</div>
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
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.quickStockPrompt('${v.variantId}', ${v.stock})">
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
            this.products = products || [];

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">CATALOG MANAGEMENT</div>
                        <h1 class="admin-page-title">ALL PRODUCTS (${this.products.length})</h1>
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
                                ${this.products.map(p => `
                                    <tr id="product-row-${p.id}">
                                        <td>
                                            <img src="${p.mainImageUrl}" style="width: 48px; height: 48px; object-fit: contain; background: #0e131d; border-radius: 4px; padding: 2px;" onerror="this.src='images/placeholder-product.png'">
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
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.editProduct('${p.id}')">Edit</button>
                                                <button class="btn btn-secondary btn-sm" style="color: var(--color-danger); font-weight: 700;" onclick="Admin.handleDeleteProduct('${p.id}', this)">Delete</button>
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
            container.innerHTML = `
                <div style="color: var(--color-danger); padding: 40px; text-align: center;">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;"></div>
                    <div style="font-weight: 700; margin-bottom: 8px;">Failed to load products: ${err.message}</div>
                    <button class="btn btn-secondary btn-sm" onclick="Admin.loadProducts(document.getElementById('admin-content-area'))"> Retry</button>
                </div>
            `;
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

    async handleDeleteProduct(id, btn) {
        const product = (this.products || []).find(p => String(p.id) === String(id));
        const name = product ? product.name : `Product #${id}`;
        return this.deleteProduct(id, name, btn);
    },

    async deleteProduct(id, name, btn) {
        const confirmed = await this.confirmModal({
            title: 'Delete Product',
            message: `Are you sure you want to permanently delete "${name}"?`,
            warningText: 'This will remove the product, images, and size variants from the store catalog.',
            confirmText: 'Yes, Delete Product'
        });
        if (!confirmed) return;

        await this.executeDelete({
            btn,
            targetRowSelector: `#product-row-${id}`,
            deleteAction: () => API.deleteProduct(id),
            successMsg: `"${name}" deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.products)) {
                    this.products = this.products.filter(p => String(p.id) !== String(id));
                }
                // Update header count
                const titleEl = document.querySelector('.admin-page-title');
                if (titleEl && Array.isArray(this.products)) {
                    titleEl.textContent = `ALL PRODUCTS (${this.products.length})`;
                }
            }
        });
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
                                         Delete
                                    </button>
                                </div>
                            </div>
                            <select class="form-control" id="form-p-brand" onchange="Admin.onProductBrandSelectChange(this)">
                                ${(this.brands || []).filter(b => b.status === 'ACTIVE' || b.id == p.brandId).map(b => `
                                    <option value="${b.id}" ${p.brandId == b.id ? 'selected' : ''}>${b.name}</option>
                                `).join('')}
                                <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;"> + Add Brand...</option>
                                <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;"> - Delete Selected Brand</option>
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
                            2. Product Photography &amp; Images
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <input type="file" id="prod-file-upload-input" accept="image/*" multiple style="display: none;" onchange="Admin.handleProductMultipleFileUpload(this)">
                            <button type="button" class="btn btn-primary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('prod-file-upload-input').click()">
                                 Browse Device Photos
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="Admin.addImageUrlPrompt()">
                                + Add Image URL
                            </button>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 16px;">
                        Attach product photos directly from your computer/phone (PNG, JPG, WebP, SVG) or paste web URLs.
                    </p>

                    <!-- Interactive Drag & Drop Area -->
                    <div class="admin-image-dropzone" id="admin-image-dropzone" 
                         onclick="document.getElementById('prod-file-upload-input').click()"
                         ondragover="event.preventDefault(); this.classList.add('dragover')"
                         ondragleave="this.classList.remove('dragover')"
                         ondrop="event.preventDefault(); this.classList.remove('dragover'); Admin.handleDropFiles(event.dataTransfer.files)">
                        <div class="dropzone-icon"></div>
                        <div class="dropzone-title">Click to upload photos or drag &amp; drop here</div>
                        <div class="dropzone-sub">Supports PNG, JPG, WebP, SVG files from your device</div>
                    </div>

                    <!-- Live Image Cards Preview Grid -->
                    <div class="admin-image-cards-grid" id="admin-image-cards-grid">
                        <!-- Populated by Admin.renderImageCardsGrid() -->
                    </div>

                    <div style="margin-top: 10px; font-size: 0.8rem; color: #9ca3af;">
                         <em>Tip: The first image with the black " MAIN COVER" badge will be the primary catalog display photo. Click "Set Main" on any image to switch.</em>
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
                         SAVE PRODUCT TO STORE
                    </button>
                    <button type="button" class="btn btn-secondary btn-lg" onclick="Admin.switchTab('products')">
                        Cancel
                    </button>
                </div>
            </form>
        `;

        this.renderSizeVariantsChecklist(p.sizeType, p.variants);
        this.renderImageCardsGrid();
    },

    renderImageCardsGrid() {
        const grid = document.getElementById('admin-image-cards-grid');
        if (!grid) return;

        if (!this.productImages || this.productImages.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 16px; text-align: center; color: #9ca3af; font-size: 0.85rem;">
                    No photos attached yet. Click the upload box above or add an image URL.
                </div>
            `;
            return;
        }

        grid.innerHTML = this.productImages.map((img, i) => {
            const isMain = i === 0 || img.isMain;
            const url = img.imageUrl || '/images/placeholder-product.png';

            return `
                <div class="admin-image-card ${isMain ? 'is-main' : ''}">
                    ${isMain ? `<span class="admin-image-main-badge"> MAIN COVER</span>` : ''}
                    <div class="admin-image-card-thumb">
                        <img src="${url}" alt="Product Photo ${i + 1}" onerror="if(!this.src.includes('placeholder-product.png')) { this.src='/images/placeholder-product.png'; showToast('Warning: Image format may be unsupported by your browser (e.g., HEIC/HEIF).', 'warning'); }">
                    </div>
                    <div class="admin-image-card-actions">
                        ${!isMain ? `
                            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.setMainImage(${i})">
                                Make Main
                            </button>
                        ` : '<span style="font-weight: 800; font-size: 0.68rem; color: #000;">Primary</span>'}
                        <button type="button" class="btn btn-danger btn-sm" style="font-weight: 700; font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.removeImageCard(${i})" title="Delete image">
                            DELETE
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
        try {
            const files = input.files;
            if (!files || files.length === 0) return;
            this.handleDropFiles(files).finally(() => {
                input.value = ''; // Reset input ONLY after upload finishes
            }).catch(err => {
                alert('Async Error in DropFiles: ' + err.message);
            });
        } catch (err) {
            alert('Sync Error in FileUpload: ' + err.message);
        }
    },

    async handleDropFiles(files) {
        try {
            if (!files || files.length === 0) return;

            const imageFiles = Array.from(files).filter(f => {
                if (f.type && f.type.startsWith('image/')) return true;
                const ext = f.name ? f.name.toLowerCase() : '';
                return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp') || ext.endsWith('.svg') || ext.endsWith('.gif') || ext.endsWith('.avif') || ext.endsWith('.heic') || ext.endsWith('.heif');
            });
            
            if (imageFiles.length === 0) {
                showToast('Unsupported file type selected. Please choose a valid image file (JPG, PNG).', 'error');
                return;
            }

            // Check for HEIC/HEIF
            for (const file of imageFiles) {
                if (file.name && (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) || file.type === 'image/heic' || file.type === 'image/heif') {
                    showToast(`Unsupported format: ${file.name}. Please convert iPhone HEIC photos to JPG/PNG before uploading.`, 'error');
                    return;
                }
            }

            showToast(`Uploading ${imageFiles.length} photo(s) to Firebase Storage...`, 'info');
        } catch (err) {
            alert('Sync Error in DropFiles Init: ' + err.message);
            throw err;
        }

        let loadedCount = 0;
        for (const file of imageFiles) {
            try {
                let downloadUrl;
                if (typeof LazarophFirebase !== 'undefined' && LazarophFirebase.uploadProductImage) {
                    downloadUrl = await LazarophFirebase.uploadProductImage(file);
                } else {
                    downloadUrl = await new Promise((res, rej) => {
                        const reader = new FileReader();
                        reader.onload = e => res(e.target.result);
                        reader.onerror = rej;
                        reader.readAsDataURL(file);
                    });
                }

                this.productImages.push({
                    imageUrl: downloadUrl,
                    isMain: this.productImages.length === 0
                });
                loadedCount++;
            } catch (err) {
                console.error('[Admin] Image upload error:', err);
                showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
            }
        }

        if (loadedCount > 0) {
            this.renderImageCardsGrid();
            showToast(`Successfully uploaded ${loadedCount} photo(s) to product!`, 'success');
        }
    },

    addImageUrlPrompt() {
        const url = prompt('Enter direct image URL (e.g. /images/kd19-black.png or https://...):');
        if (url && url.trim().length > 0) {
            this.productImages.push({
                imageUrl: url.trim(),
                isMain: this.productImages.length === 0
            });
            this.renderImageCardsGrid();
            showToast('Image URL added!', 'success');
        }
    },

    setMainImage(index) {
        if (index < 0 || index >= this.productImages.length) return;
        const item = this.productImages.splice(index, 1)[0];
        item.isMain = true;
        this.productImages.forEach(img => img.isMain = false);
        this.productImages.unshift(item);
        this.renderImageCardsGrid();
        showToast('Primary cover photo updated!', 'info');
    },

    removeImageCard(index) {
        if (index < 0 || index >= this.productImages.length) return;
        this.productImages.splice(index, 1);
        if (this.productImages.length > 0) {
            this.productImages[0].isMain = true;
        }
        this.renderImageCardsGrid();
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
        const images = (this.productImages || [])
            .filter(img => img.imageUrl && img.imageUrl.trim().length > 0)
            .map((img, idx) => ({
                imageUrl: img.imageUrl.trim(),
                isMain: idx === 0 || img.isMain,
                sortOrder: idx + 1
            }));
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
                btn.textContent = ' SAVE PRODUCT TO STORE';
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
                                                <button class="btn btn-secondary btn-sm" onclick="Admin.updateVariantStockInline('${m.variantId}')">
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
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading customer orders & delivery records...</div>`;

        try {
            const orders = await API.getAdminOrders();
            this.orders = orders || [];

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">MANUAL DELIVERY & LOGISTICS MANAGEMENT</div>
                        <h1 class="admin-page-title">CUSTOMER ORDERS & DELIVERY (${this.orders.length})</h1>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Order Details</th>
                                    <th>Customer & City</th>
                                    <th>Courier & Delivery</th>
                                    <th>Delivery Fee</th>
                                    <th>Items Ordered</th>
                                    <th>Total</th>
                                    <th>Official Order Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.orders.map(o => {
                                    const courier = o.courier || (o.lbcTrackingNumber ? 'LBC' : 'LALAMOVE');
                                    let badgeHtml = `<span class="badge ${courier === 'LALAMOVE' ? 'badge-lalamove' : 'badge-lbc'}">${courier}</span>`;
                                    const feeDisplay = o.deliveryFeeConfirmed
                                        ? `<span style="color: #10b981; font-weight: 700;">${formatMoney(o.shippingFee || 0)}</span>`
                                        : `<span style="color: #f59e0b; font-weight: 700;">${o.shippingFee ? formatMoney(o.shippingFee) + ' (Pending)' : 'Quote Needed'}</span>`;

                                    const officialStatuses = [
                                        'Pending Payment',
                                        'Confirmed',
                                        'Preparing Order',
                                        'Ready for Pickup',
                                        'For Delivery',
                                        'Shipped',
                                        'Out for Delivery',
                                        'Delivered',
                                        'Cancelled'
                                    ];

                                    return `
                                        <tr id="order-row-${o.id}">
                                            <td>
                                                <div style="font-weight: 800; font-size: 0.95rem; color: #000000;">${o.orderNumber}</div>
                                                <div style="font-size: 0.75rem; color: #6b7280;">${new Date(o.createdAt).toLocaleDateString()}</div>
                                                <span style="font-size: 0.72rem; color: #374151; font-weight: 600;">${o.paymentMethod}</span>
                                            </td>
                                            <td>
                                                <strong style="color: #000000;">${o.customerName}</strong>
                                                <div style="font-size: 0.8rem; color: #4b5563;"> ${o.customerPhone}</div>
                                                <div style="font-size: 0.75rem; color: #6b7280;">${o.shippingCity || 'Marikina'}</div>
                                            </td>
                                            <td>
                                                ${badgeHtml}
                                                ${courier === 'LBC' && (o.lbcTrackingNumber || o.courierTrackingNumber) ? `
                                                    <div style="font-size: 0.72rem; color: #111827; margin-top: 4px;">
                                                        AWB: <code style="background: #fee2e2; padding: 1px 4px; border-radius: 3px;">${o.lbcTrackingNumber || o.courierTrackingNumber}</code>
                                                    </div>
                                                ` : ''}
                                            </td>
                                            <td>
                                                <div style="font-size: 0.9rem; font-weight: 700;">${feeDisplay}</div>
                                            </td>
                                            <td>
                                                <div style="font-size: 0.82rem; color: #1f2937; max-width: 180px;">
                                                    ${o.items.map(it => `${it.productName} (${it.size}) × ${it.quantity}`).join('<br>')}
                                                </div>
                                            </td>
                                            <td>
                                                <strong style="color: #000000; font-size: 1.05rem; font-weight: 900;">${formatMoney(o.total)}</strong>
                                            </td>
                                            <td>
                                                <select class="form-control" style="padding: 4px 8px; font-size: 0.8rem; width: 155px; border-color: #d1d5db; font-weight: 600;" onchange="Admin.updateOrderStatus('${o.id}', this.value)">
                                                    ${officialStatuses.map(st => `
                                                        <option value="${st}" ${o.status === st || (o.status && o.status.toLowerCase() === st.toLowerCase()) ? 'selected' : ''}>${st}</option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                            <td>
                                                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                                                    <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800; border: 1.5px solid #000000; background: #ffffff; color: #000000; padding: 4px 8px;" onclick="Admin.openDeliveryModal('${o.id}')">
                                                         Delivery Info
                                                    </button>
                                                    <button class="btn btn-primary btn-sm" style="font-size: 0.75rem; font-weight: 800; background: #000000; color: #ffffff; padding: 4px 8px;" onclick="Admin.openCustomerChat('${o.id}', '${o.orderNumber}')">
                                                         Chat
                                                    </button>
                                                    <button class="btn btn-sm" style="font-size: 0.75rem; font-weight: 800; background: rgba(220,38,38,0.1); color: #dc2626; border: 1px solid rgba(220,38,38,0.3); padding: 4px 8px;" onclick="Admin.handleDeleteOrder('${o.id}', this)">
                                                         Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Delivery Management Modal Container -->
                <div id="admin-delivery-modal-wrap"></div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load orders: ${err.message}</div>`;
        }
    },

    async handleDeleteOrder(orderId, btn) {
        const order = (this.orders || []).find(o => String(o.id) === String(orderId));
        const orderNumber = order ? order.orderNumber : orderId;
        return this.deleteOrder(orderId, orderNumber, btn);
    },

    async deleteOrder(orderId, orderNumber, btn) {
        const confirmed = await this.confirmModal({
            title: 'Delete Order Record',
            message: `Are you sure you want to permanently delete order #${orderNumber}?`,
            warningText: 'This will remove the order record from the ledger. This action cannot be reversed.',
            confirmText: 'Yes, Delete Order'
        });
        if (!confirmed) return;

        await this.executeDelete({
            btn,
            targetRowSelector: `#order-row-${orderId}`,
            deleteAction: () => API.deleteAdminOrder(orderId),
            successMsg: `Order #${orderNumber} deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.orders)) {
                    this.orders = this.orders.filter(o => String(o.id) !== String(orderId));
                }
            }
        });
    },

    async updateOrderStatus(orderId, status) {
        try {
            await API.updateOrderStatus(orderId, status);
            showToast(`Order status updated to ${status}! Customer notified.`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async openDeliveryModal(orderId) {
        try {
            const orders = await API.getAdminOrders();
            const order = orders.find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId));
            if (!order) return;

            const modalWrap = document.getElementById('admin-delivery-modal-wrap') || document.body;
            const courier = order.courier || 'LALAMOVE';

            const modalHtml = `
                <div class="modal-overlay" id="modal-delivery-manage" style="display: flex;" onclick="if(event.target === this) Admin.closeDeliveryModal()">
                    <div class="modal-container" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                        <div class="modal-header">
                            <h3 class="modal-title"> Delivery Management — #${order.orderNumber}</h3>
                            <button type="button" class="modal-close" onclick="Admin.closeDeliveryModal()"></button>
                        </div>
                        <div class="modal-body delivery-modal-body">
                            <form id="form-delivery-manage" onsubmit="Admin.saveDeliveryModalForm(event, '${order.id}')">
                                <!-- 1. Delivery Method -->
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 800; color: #000000;">Delivery Method *</label>
                                    <select class="form-control" id="adm-del-courier" onchange="Admin.toggleDeliveryModalFields(this.value)">
                                        <option value="LALAMOVE" ${courier === 'LALAMOVE' ? 'selected' : ''}> Lalamove (Same-Day / On-Demand)</option>
                                        <option value="LBC" ${courier === 'LBC' ? 'selected' : ''}> LBC Express (Nationwide Shipping)</option>
                                        <option value="STORE_PICKUP" ${courier === 'STORE_PICKUP' ? 'selected' : ''}> Store Pickup (Marikina Hub)</option>
                                    </select>
                                </div>

                                <!-- 2. Delivery Fee & Confirmation -->
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 800; color: #000000;">Delivery Fee (₱)</label>
                                        <input type="number" step="0.01" class="form-control" id="adm-del-fee" value="${order.shippingFee != null ? order.shippingFee : ''}" placeholder="e.g. 150.00">
                                    </div>
                                    <div class="form-group" style="display: flex; align-items: flex-end; padding-bottom: 8px;">
                                        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: #000000; cursor: pointer;">
                                            <input type="checkbox" id="adm-del-confirmed" ${order.deliveryFeeConfirmed || courier === 'STORE_PICKUP' ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #000000;">
                                            Fee Confirmed
                                        </label>
                                    </div>
                                </div>

                                <!-- 3. Lalamove Rider Details -->
                                <div id="adm-del-lalamove-box" style="display: ${courier === 'LALAMOVE' ? 'block' : 'none'}; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
                                    <div style="font-size: 0.82rem; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 10px;">
                                         Lalamove Rider Assignment
                                    </div>
                                    <div class="form-grid-2">
                                        <div class="form-group">
                                            <label class="form-label">Rider Name</label>
                                            <input type="text" class="form-control" id="adm-del-rider-name" value="${order.riderName || ''}" placeholder="e.g. Juan Ramos">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Rider Contact Number</label>
                                            <input type="tel" class="form-control" id="adm-del-rider-phone" value="${order.riderPhone || ''}" placeholder="e.g. 09179988776">
                                        </div>
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label class="form-label">Estimated Delivery Time</label>
                                        <input type="text" class="form-control" id="adm-del-rider-time" value="${order.estimatedDeliveryTime || 'Within 2-3 Hours'}" placeholder="e.g. Today by 4:00 PM">
                                    </div>
                                </div>

                                <!-- 4. LBC Details -->
                                <div id="adm-del-lbc-box" style="display: ${courier === 'LBC' ? 'block' : 'none'}; background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
                                    <div style="font-size: 0.82rem; font-weight: 800; color: #991b1b; text-transform: uppercase; margin-bottom: 10px;">
                                         LBC Shipping &amp; Tracking
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">LBC Tracking Number (AWB)</label>
                                        <input type="text" class="form-control" id="adm-del-lbc-track" value="${order.lbcTrackingNumber || order.courierTrackingNumber || ''}" placeholder="e.g. 180599201948">
                                    </div>
                                    <div class="form-grid-2">
                                        <div class="form-group">
                                            <label class="form-label">Shipping Date</label>
                                            <input type="text" class="form-control" id="adm-del-lbc-shipdate" value="${order.shippingDate || new Date().toLocaleDateString()}" placeholder="YYYY-MM-DD">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Estimated Delivery Date</label>
                                            <input type="text" class="form-control" id="adm-del-lbc-estdate" value="${order.estimatedDeliveryDate || '2-4 Business Days'}" placeholder="e.g. 2-3 Days">
                                        </div>
                                    </div>
                                </div>

                                <!-- 5. Delivery Notes & Overall Status -->
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 800; color: #000000;">Delivery Notes</label>
                                    <textarea class="form-control" id="adm-del-notes" style="min-height: 55px;" placeholder="Internal notes, rider instructions, address landmark notes...">${order.deliveryNotes || ''}</textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 800; color: #000000;">Order Status *</label>
                                    <select class="form-control" id="adm-del-status" style="font-weight: 700;">
                                        <option value="Pending Order" ${order.status === 'Pending Order' ? 'selected' : ''}>Pending Order</option>
                                        <option value="Payment Verification" ${order.status === 'Payment Verification' ? 'selected' : ''}>Payment Verification</option>
                                        <option value="Delivery Confirmation" ${order.status === 'Delivery Confirmation' ? 'selected' : ''}>Delivery Confirmation</option>
                                        <option value="Preparing Order" ${order.status === 'Preparing Order' ? 'selected' : ''}>Preparing Order</option>
                                        <option value="Ready for Pickup" ${order.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
                                        <option value="For Delivery" ${order.status === 'For Delivery' ? 'selected' : ''}>For Delivery</option>
                                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </div>

                                <div style="display: flex; gap: 10px; margin-top: 20px;">
                                    <button type="submit" class="btn btn-primary btn-block" style="flex: 2; padding: 12px; font-weight: 800;">
                                         SAVE DELIVERY &amp; NOTIFY CUSTOMER
                                    </button>
                                    <button type="button" class="btn btn-secondary" style="flex: 1; padding: 12px; font-weight: 700;" onclick="Admin.closeDeliveryModal()">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            modalWrap.innerHTML = modalHtml;
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    toggleDeliveryModalFields(courier) {
        const lalamoveBox = document.getElementById('adm-del-lalamove-box');
        const lbcBox = document.getElementById('adm-del-lbc-box');
        const feeInput = document.getElementById('adm-del-fee');
        const confirmedCheck = document.getElementById('adm-del-confirmed');

        if (lalamoveBox) lalamoveBox.style.display = courier === 'LALAMOVE' ? 'block' : 'none';
        if (lbcBox) lbcBox.style.display = courier === 'LBC' ? 'block' : 'none';

        if (courier === 'STORE_PICKUP') {
            if (feeInput) feeInput.value = '0.00';
            if (confirmedCheck) confirmedCheck.checked = true;
        }
    },

    closeDeliveryModal() {
        const modal = document.getElementById('modal-delivery-manage');
        if (modal) modal.remove();
    },

    async saveDeliveryModalForm(e, orderId) {
        e.preventDefault();

        const courier = document.getElementById('adm-del-courier').value;
        const fee = document.getElementById('adm-del-fee').value;
        const confirmed = document.getElementById('adm-del-confirmed').checked;
        const riderName = document.getElementById('adm-del-rider-name') ? document.getElementById('adm-del-rider-name').value : '';
        const riderPhone = document.getElementById('adm-del-rider-phone') ? document.getElementById('adm-del-rider-phone').value : '';
        const estTime = document.getElementById('adm-del-rider-time') ? document.getElementById('adm-del-rider-time').value : '';
        const lbcTrack = document.getElementById('adm-del-lbc-track') ? document.getElementById('adm-del-lbc-track').value : '';
        const shipDate = document.getElementById('adm-del-lbc-shipdate') ? document.getElementById('adm-del-lbc-shipdate').value : '';
        const estDate = document.getElementById('adm-del-lbc-estdate') ? document.getElementById('adm-del-lbc-estdate').value : '';
        const notes = document.getElementById('adm-del-notes').value;
        const status = document.getElementById('adm-del-status').value;

        try {
            await API.updateOrderDelivery(orderId, {
                courier,
                shippingFee: fee,
                deliveryFeeConfirmed: confirmed,
                riderName,
                riderPhone,
                estimatedDeliveryTime: estTime,
                lbcTrackingNumber: lbcTrack,
                shippingDate: shipDate,
                estimatedDeliveryDate: estDate,
                deliveryNotes: notes,
                status
            });

            showToast('Delivery updated! Customer received automatic notification.', 'success');
            this.closeDeliveryModal();
            this.loadOrders(document.getElementById('admin-content-area'));
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // ==========================================================
    // ADMIN MESSAGES / CHAT MANAGEMENT (3-Column Layout)
    // ==========================================================
    chatConversations: [],
    activeChatConvId: null,
    chatPollTimer: null,
    chatSearchQuery: '',

    async loadChat(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading customer messages...</div>`;

        try {
            this.chatConversations = await API.getConversations();

            container.innerHTML = `
                <div class="admin-header" style="margin-bottom: 16px;">
                    <div>
                        <div class="section-subtitle">CUSTOMER COMMUNICATION</div>
                        <h1 class="admin-page-title">MESSAGES &amp; LIVE CUSTOMER SUPPORT</h1>
                    </div>
                </div>

                <div class="admin-chat-layout">
                    <!-- Column 1: Conversations List -->
                    <div class="admin-chat-sidebar">
                        <div class="admin-chat-search">
                            <input type="text" class="form-control" placeholder=" Search customer or order #..." oninput="Admin.handleChatSearch(this.value)" style="font-size: 0.85rem; padding: 8px 12px; border-radius: 4px;">
                        </div>
                        <div class="admin-conv-list" id="admin-conv-list-items">
                            ${this.renderConversationListHtml()}
                        </div>
                    </div>

                    <!-- Column 2: Active Chat Feed -->
                    <div class="admin-chat-main" id="admin-chat-main-area">
                        <div style="margin: auto; text-align: center; color: #6b7280; padding: 40px;">
                            <div style="font-size: 2.5rem; margin-bottom: 8px;"></div>
                            <h3 style="color: #000000; font-size: 1.1rem; margin-bottom: 4px;">Select a Conversation</h3>
                            <p style="font-size: 0.85rem;">Click any customer on the left to review messages, send delivery fees, and dispatch notifications.</p>
                        </div>
                    </div>

                    <!-- Column 3: Customer Context Profile -->
                    <div class="admin-chat-profile" id="admin-chat-profile-area">
                        <div class="profile-card-header">Customer Profile</div>
                        <div style="font-size: 0.85rem; color: #6b7280; margin-top: 10px;">Select a conversation to view customer details, order breakdown, and delivery state.</div>
                    </div>
                </div>
            `;

            this.renderedChatConvId = null;
            // Auto-select first conversation if available
            if (this.chatConversations.length > 0 && !this.activeChatConvId) {
                this.selectChatConversation(this.chatConversations[0].id);
            } else if (this.activeChatConvId) {
                this.selectChatConversation(this.activeChatConvId);
            }

            this.startAdminChatPolling();
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load messages: ${err.message}</div>`;
        }
    },

    renderConversationListHtml() {
        const filtered = this.chatConversations.filter(c => {
            if (!this.chatSearchQuery) return true;
            const q = this.chatSearchQuery.toLowerCase();
            return (c.customerName && c.customerName.toLowerCase().includes(q)) ||
                   (c.orderNumber && c.orderNumber.toLowerCase().includes(q)) ||
                   (c.customerEmail && c.customerEmail.toLowerCase().includes(q));
        });

        if (filtered.length === 0) {
            return `<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 0.82rem;">No conversations found</div>`;
        }

        return filtered.map(c => {
            const isActive = this.activeChatConvId === c.id;
            const timeStr = c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return `
                <div class="admin-conv-item ${isActive ? 'active' : ''}" onclick="Admin.selectChatConversation('${c.id}')">
                    <div class="top-row">
                        <span class="customer-name">${c.customerName || 'Customer'}</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    ${c.orderNumber ? `<span class="order-badge">Order #${c.orderNumber}</span>` : ''}
                    <div class="msg-snippet">
                        ${c.lastMessage || 'No messages yet'}
                        ${c.unreadAdminCount > 0 ? `<span class="unread-dot" title="${c.unreadAdminCount} unread"></span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    handleChatSearch(query) {
        this.chatSearchQuery = query;
        const listElem = document.getElementById('admin-conv-list-items');
        if (listElem) listElem.innerHTML = this.renderConversationListHtml();
    },

    async selectChatConversation(convId) {
        this.activeChatConvId = convId;
        this.renderedChatConvId = null; // Reset shell so new conversation builds clean

        // Update active class in list
        document.querySelectorAll('.admin-conv-item').forEach(el => el.classList.remove('active'));
        const listElem = document.getElementById('admin-conv-list-items');
        if (listElem) listElem.innerHTML = this.renderConversationListHtml();

        const conv = this.chatConversations.find(c => String(c.id) === String(convId));
        if (!conv) return;

        // Load conversation messages and customer profile
        await this.renderActiveChatFeed(conv);
        await this.renderCustomerProfile(conv);
        this.checkUnreadMessages();
    },

    renderChatMessagesHtml(messages, customerName) {
        if (!messages || messages.length === 0) {
            return `
                <div style="text-align: center; color: #9ca3af; font-size: 0.85rem; padding: 40px;">
                    No messages yet in this conversation. Send a message below to start chatting.
                </div>
            `;
        }

        return messages.map(m => {
            const role = (m.senderRole || 'CUSTOMER').toLowerCase();
            const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const esc = window.escapeChatHtml || function(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
            
            if (role === 'system') {
                return `
                    <div class="chat-bubble-row system">
                        <div class="chat-bubble">
                            <strong> SYSTEM NOTIFICATION:</strong><br>${esc(m.message)}
                        </div>
                        <div class="chat-meta">${timeStr}</div>
                    </div>
                `;
            }

            // In Admin panel: Admin messages are right (customer-style bubble in black), Customer messages are left (white)
            const isFromAdmin = role === 'admin';
            const isPaymentProof = m.messageType === 'PAYMENT_PROOF';
            const isPaymentVerified = m.messageType === 'PAYMENT_VERIFIED';

            if (isPaymentVerified) {
                return `
                    <div class="chat-bubble-row system" style="background: rgba(16,185,129,0.08); border-left: 4px solid #10b981; border-radius: 6px; padding: 6px 12px; margin: 4px auto; max-width: 85%;">
                        <div style="font-weight: 800; color: #15803d; font-size: 0.8rem; line-height: 1.35;">
                            ${esc(m.message)}
                        </div>
                        <div class="chat-meta" style="color: #059669; font-weight: 700; margin-top: 2px;">${timeStr} • Verified by Administrator</div>
                    </div>
                `;
            }

            const hasImage = m.imageUrl && m.imageUrl !== 'null' && m.imageUrl !== 'undefined' && m.imageUrl.trim() !== '';

            let bubbleContent = '';
            if (isPaymentProof) {
                bubbleContent += '<div style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px;"> PROOF OF PAYMENT</div>';
            }
            if (m.message && m.message.trim() !== '') {
                bubbleContent += `<div class="chat-text">${esc(m.message.trim())}</div>`;
            }
            if (hasImage) {
                bubbleContent += `<div class="admin-chat-image-preview" onclick="Chat ? Chat.openLightbox('${esc(m.imageUrl)}') : window.open('${esc(m.imageUrl)}', '_blank')"><img src="${esc(m.imageUrl)}" alt="Attachment / Receipt" loading="lazy"><div style="padding: 3px 6px; font-size: 0.65rem; color: #cbd5e1; display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.85);"><span> Inspect</span><span style="color: #38bdf8; font-weight: 700;">ENLARGE</span></div></div>`;
                if (isPaymentProof) {
                    bubbleContent += '<button type="button" class="btn-verify-payment-chip" onclick="Admin.openAdminPaymentVerifyModal()"> Double Confirm: Verify Payment</button>';
                }
            }

            return `<div class="chat-bubble-row ${isFromAdmin ? 'customer' : 'admin'}"><div class="chat-bubble">${bubbleContent}</div><div class="chat-meta"><span>${timeStr}</span><span>• ${isFromAdmin ? 'Admin' : esc(customerName)}</span></div></div>`;
        }).join('');
    },

    async renderActiveChatFeed(conv) {
        const mainArea = document.getElementById('admin-chat-main-area');
        if (!mainArea || !conv) return;

        try {
            const data = await API.getConversationMessages(conv.id);
            const messages = data.messages || [];

            const feedElem = document.getElementById('admin-chat-feed-scroll');
            const isSameConvShell = feedElem && (this.renderedChatConvId === conv.id);

            if (!isSameConvShell) {
                // Initial render for this conversation: build full UI shell
                this.renderedChatConvId = conv.id;
                const lastMsgId = (messages.length > 0 && messages[messages.length - 1].id) ? messages[messages.length - 1].id : 0;
                this.lastRenderedMessagesHash = `${messages.length}_${lastMsgId}`;

                mainArea.innerHTML = `
                    <div class="admin-chat-main-header">
                        <div>
                            <div class="title">${this.escapeHtml(conv.customerName)}</div>
                            <div style="font-size: 0.78rem; color: #6b7280;">
                                ${this.escapeHtml(conv.customerEmail)} • ${this.escapeHtml(conv.customerPhone || 'No Phone')}
                                ${conv.orderNumber ? ` • <strong style="color: #000000;">Order #${this.escapeHtml(conv.orderNumber)}</strong>` : ''}
                            </div>
                        </div>
                        <div>
                            ${conv.orderId ? `
                                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800; border: 1px solid #000000;" onclick="Admin.openDeliveryModal('${conv.orderId}')">
                                     Manage Delivery
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="admin-chat-feed" id="admin-chat-feed-scroll">
                        ${this.renderChatMessagesHtml(messages, conv.customerName)}
                    </div>

                    <!-- Quick Action Chips for Admin -->
                    <div class="admin-quick-actions">
                        <span class="admin-action-chip" onclick="Admin.sendQuickAdminReply('Your delivery fee is confirmed at ₱150. Please confirm to proceed with dispatch.')"> Confirm Fee ₱150</span>
                        <span class="admin-action-chip" onclick="Admin.openAdminPaymentVerifyModal()"> Payment Verified</span>
                        <span class="admin-action-chip" onclick="Admin.sendQuickAdminReply('Your Lalamove rider has been assigned and is on the way with your order.')"> Rider Dispatched</span>
                        <span class="admin-action-chip" onclick="Admin.sendQuickAdminReply('Your package has been handed over to LBC Express. Tracking number will be active shortly.')"> LBC Handed Over</span>
                        <span class="admin-action-chip" onclick="Admin.sendQuickAdminReply('Your order is now ready for pickup at our Marikina branch!')"> Ready for Pickup</span>
                    </div>

                    <div class="admin-chat-footer">
                        <form onsubmit="Admin.handleAdminMsgSubmit(event)" style="display: flex; gap: 8px; align-items: center;">
                            <input type="file" id="admin-chat-file-input" accept="image/jpeg,image/png,image/webp,image/jpg" style="display: none;" onchange="Admin.handleAdminChatFileSelected(this)">
                            <button type="button" class="admin-chat-attach-btn" title="Upload Image / Proof" onclick="Admin.triggerAdminChatUpload()">+</button>
                            <input type="text" class="form-control" id="admin-chat-input" placeholder="Type reply to ${this.escapeHtml(conv.customerName)}..." autocomplete="off" style="border-color: #000000; flex: 1;">
                            <button type="submit" class="btn btn-primary" style="background: #000000; color: #ffffff; font-weight: 800; padding: 8px 20px; flex-shrink: 0;">
                                Send Reply
                            </button>
                        </form>
                    </div>
                `;

                const scrollElem = document.getElementById('admin-chat-feed-scroll');
                if (scrollElem) scrollElem.scrollTop = scrollElem.scrollHeight;
            } else {
                // Shell already exists! Check if messages actually changed
                const lastMsgId = (messages.length > 0 && messages[messages.length - 1].id) ? messages[messages.length - 1].id : 0;
                const currentHash = `${messages.length}_${lastMsgId}`;
                if (this.lastRenderedMessagesHash === currentHash) {
                    // Nothing changed! DO NOT touch anything in DOM to prevent typing glitches or focus loss
                    return;
                }
                this.lastRenderedMessagesHash = currentHash;

                // Only update the messages inside the scroll container, preserving the input and quick action chips!
                const scrollElem = document.getElementById('admin-chat-feed-scroll');
                if (scrollElem) {
                    const wasNearBottom = (scrollElem.scrollHeight - scrollElem.clientHeight) <= (scrollElem.scrollTop + 80);
                    scrollElem.innerHTML = this.renderChatMessagesHtml(messages, conv.customerName);
                    if (wasNearBottom) {
                        scrollElem.scrollTop = scrollElem.scrollHeight;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load chat feed:', err);
        }
    },

    async renderCustomerProfile(conv) {
        const profileArea = document.getElementById('admin-chat-profile-area');
        if (!profileArea) return;

        let order = null;
        if (conv.orderId) {
            try {
                const orders = await API.getAdminOrders();
                order = orders.find(o => String(o.id) === String(conv.orderId) || String(o.orderNumber) === String(conv.orderId));
            } catch (ignored) {}
        }

        profileArea.innerHTML = `
            <div class="profile-card-header">Customer Profile</div>

            <div class="profile-info-row">
                <div class="label">Customer Name</div>
                <div class="val">${conv.customerName}</div>
            </div>
            <div class="profile-info-row">
                <div class="label">Email Address</div>
                <div class="val" style="font-size: 0.82rem; word-break: break-all;">${conv.customerEmail}</div>
            </div>
            <div class="profile-info-row">
                <div class="label">Mobile Number</div>
                <div class="val">${conv.customerPhone || 'N/A'}</div>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">

            <div class="profile-card-header">Related Order Details</div>

            ${order ? `
                <div class="profile-info-row">
                    <div class="label">Order Number</div>
                    <div class="val">#${order.orderNumber}</div>
                </div>
                <div class="profile-info-row">
                    <div class="label">Order Status</div>
                    <div class="val">
                        <span class="status-pill status-${order.status ? order.status.toLowerCase().replace(/\\s+/g, '-') : 'pending'}" style="font-size: 0.75rem;">
                            ${order.status}
                        </span>
                    </div>
                </div>
                <div class="profile-info-row">
                    <div class="label">Delivery Method</div>
                    <div class="val">${order.courier || 'LALAMOVE'}</div>
                </div>
                <div class="profile-info-row">
                    <div class="label">Delivery Fee</div>
                    <div class="val" style="color: ${order.deliveryFeeConfirmed ? '#059669' : '#e11d48'};">
                        ${order.deliveryFeeConfirmed ? formatMoney(order.shippingFee) : 'To be Confirmed'}
                    </div>
                </div>
                <div class="profile-info-row">
                    <div class="label">Payment Status</div>
                    <div class="val">${order.paymentMethod} (${order.paymentReference || 'No Ref'})</div>
                </div>
                <div class="profile-info-row">
                    <div class="label">Order Total</div>
                    <div class="val" style="font-size: 1.05rem; font-weight: 900;">${formatMoney(order.total)}</div>
                </div>
                <button class="btn btn-secondary btn-block btn-sm" style="margin-top: 12px; font-weight: 800; border: 1.5px solid #000000;" onclick="Admin.openDeliveryModal('${order.id}')">
                     Edit Delivery / Fee
                </button>
            ` : `
                <div style="font-size: 0.82rem; color: #9ca3af;">No specific order tied to this conversation.</div>
            `}
        `;
    },

    async handleAdminMsgSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('admin-chat-input');
        if (!input || !input.value.trim() || !this.activeChatConvId) return;

        const text = input.value.trim();
        input.value = '';
        input.focus();

        await this.sendAdminMessage(text);

        const refreshedInput = document.getElementById('admin-chat-input');
        if (refreshedInput) refreshedInput.focus();
    },

    async sendQuickAdminReply(text) {
        await this.sendAdminMessage(text);
        const input = document.getElementById('admin-chat-input');
        if (input) input.focus();
    },

    async sendAdminMessage(text) {
        if (!this.activeChatConvId || !text.trim()) return;

        try {
            await API.sendChatMessage(this.activeChatConvId, text.trim());
            const conv = this.chatConversations.find(c => c.id === this.activeChatConvId);
            if (conv) {
                // Invalidate hash so new message is rendered into feed immediately
                this.lastRenderedMessagesHash = null;
                await this.renderActiveChatFeed(conv);
            }
            // Update conv list snippet
            this.chatConversations = await API.getConversations();
            const listElem = document.getElementById('admin-conv-list-items');
            if (listElem) listElem.innerHTML = this.renderConversationListHtml();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // =========================================================================
    // ADMIN PAYMENT VERIFICATION & ATTACHMENT (+) WITH DOUBLE CONFIRMATION
    // =========================================================================
    stagedAdminUpload: null,

    openAdminPaymentVerifyModal() {
        if (!this.activeChatConvId) {
            showToast('Please select a conversation first.', 'info');
            return;
        }

        const conv = this.chatConversations.find(c => c.id === this.activeChatConvId);
        if (!conv) return;

        let modal = document.getElementById('modal-admin-payment-confirm');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-admin-payment-confirm';
            modal.className = 'chat-confirm-modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="chat-confirm-modal-card">
                <div class="chat-confirm-modal-header" style="background: #0f172a;">
                    <h3><span></span> Double Confirmation: Verify Payment</h3>
                    <button type="button" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;" onclick="Admin.closeAdminPaymentVerifyModal()"></button>
                </div>
                <div class="chat-confirm-modal-body">
                    <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                        <div style="font-size: 0.88rem; font-weight: 800; color: #065f46; margin-bottom: 4px;">
                            Payment Verification Request
                        </div>
                        <div style="font-size: 0.8rem; color: #047857; line-height: 1.45;">
                            Customer: <strong>${this.escapeHtml(conv.customerName)}</strong><br>
                            ${conv.orderNumber ? `Order: <strong style="color: #000000;">#${this.escapeHtml(conv.orderNumber)}</strong><br>` : ''}
                            Email: ${this.escapeHtml(conv.customerEmail)} • Phone: ${this.escapeHtml(conv.customerPhone || 'N/A')}
                        </div>
                    </div>

                    <div style="font-size: 0.82rem; color: #374151; margin-bottom: 12px; line-height: 1.45;">
                        <strong>Double Confirmation Check:</strong><br>
                        Have you confirmed receipt of the customer's payment screenshot or reference in your bank/GCash merchant account?
                    </div>

                    <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.78rem; color: #92400e; line-height: 1.45;">
                        <strong> What happens next:</strong>
                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                            <li>Updates Order status to <strong style="color: #15803d;">PAID</strong></li>
                            <li>Sends official verified announcement into this chat</li>
                            <li>Notifies customer that packaging and dispatch will proceed</li>
                        </ul>
                    </div>
                </div>
                <div class="chat-confirm-modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="Admin.closeAdminPaymentVerifyModal()">Cancel</button>
                    <button type="button" id="btn-admin-verify-confirm" class="btn btn-sm" style="background: #10b981; color: #ffffff; font-weight: 800; padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer;" onclick="Admin.executePaymentVerification()">
                         Yes, Confirm & Mark Paid
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    },

    closeAdminPaymentVerifyModal() {
        const modal = document.getElementById('modal-admin-payment-confirm');
        if (modal) modal.style.display = 'none';
    },

    async executePaymentVerification() {
        if (!this.activeChatConvId) return;
        const btn = document.getElementById('btn-admin-verify-confirm');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;
        }

        try {
            await API.verifyChatPayment(this.activeChatConvId);
            this.closeAdminPaymentVerifyModal();
            showToast('Order payment successfully verified and marked as PAID!', 'success');

            const conv = this.chatConversations.find(c => c.id === this.activeChatConvId);
            if (conv) {
                this.lastRenderedMessagesHash = null;
                await this.renderActiveChatFeed(conv);
            }
            // Also refresh orders table if order exists
            if (this.loadOrders) this.loadOrders();
        } catch (err) {
            showToast(err.message || 'Failed to verify payment', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = ` Yes, Confirm & Mark Paid`;
            }
        }
    },

    triggerAdminChatUpload() {
        if (!this.activeChatConvId) {
            showToast('Please select a customer conversation first.', 'info');
            return;
        }
        const input = document.getElementById('admin-chat-file-input');
        if (input) {
            input.value = '';
            input.click();
        }
    },

    handleAdminChatFileSelected(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];

        const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileName = file.name.toLowerCase();
        const isValid = validExts.some(ext => fileName.endsWith(ext)) || file.type.startsWith('image/');
        if (!isValid) {
            showToast('Unsupported format. Please select a JPG, PNG, or WEBP image.', 'error');
            input.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('Image is too large. Maximum allowed size is 10MB.', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.stagedAdminUpload = {
                file,
                filename: file.name,
                dataUrl
            };
            this.openAdminUploadConfirmModal(file, dataUrl);
        };
        reader.readAsDataURL(file);
    },

    openAdminUploadConfirmModal(file, dataUrl) {
        let modal = document.getElementById('modal-admin-upload-confirm');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-admin-upload-confirm';
            modal.className = 'chat-confirm-modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="chat-confirm-modal-card">
                <div class="chat-confirm-modal-header">
                    <h3><span></span> Double Confirmation: Send Image Attachment</h3>
                    <button type="button" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;" onclick="Admin.closeAdminUploadConfirmModal()"></button>
                </div>
                <div class="chat-confirm-modal-body">
                    <div style="font-size: 0.82rem; color: #374151; margin-bottom: 10px;">
                        <strong>Preview Image Attachment:</strong>
                    </div>
                    <div class="chat-confirm-preview-frame">
                        <img src="${dataUrl}" alt="Admin Attachment Preview">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.78rem; font-weight: 700; color: #111827; display: block; margin-bottom: 4px;">Optional Note to Customer</label>
                        <input type="text" id="admin-confirm-upload-caption" class="form-control" placeholder="e.g. Here is your LBC / Lalamove waybill receipt" style="width: 100%; padding: 8px 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box;">
                    </div>
                </div>
                <div class="chat-confirm-modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="Admin.closeAdminUploadConfirmModal()">Cancel</button>
                    <button type="button" id="btn-admin-confirm-upload" class="btn btn-sm" style="background: #000000; color: #ffffff; font-weight: 800; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;" onclick="Admin.submitAdminChatAttachment()">
                         Confirm & Send Image
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    },

    closeAdminUploadConfirmModal() {
        const modal = document.getElementById('modal-admin-upload-confirm');
        if (modal) modal.style.display = 'none';
        this.stagedAdminUpload = null;
    },

    async submitAdminChatAttachment() {
        if (!this.stagedAdminUpload || !this.activeChatConvId) return;
        const btn = document.getElementById('btn-admin-confirm-upload');
        const captionInput = document.getElementById('admin-confirm-upload-caption');
        const caption = captionInput ? captionInput.value.trim() : '';

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="btn-spinner"></span> Sending...`;
        }

        try {
            await API.uploadChatImage(this.activeChatConvId, {
                filename: this.stagedAdminUpload.filename,
                imageData: this.stagedAdminUpload.dataUrl,
                message: caption || 'Attached photo from Administrator.',
                messageType: 'IMAGE'
            });

            this.closeAdminUploadConfirmModal();
            showToast('Image attachment sent to customer!', 'success');

            const conv = this.chatConversations.find(c => c.id === this.activeChatConvId);
            if (conv) {
                this.lastRenderedMessagesHash = null;
                await this.renderActiveChatFeed(conv);
            }
        } catch (err) {
            showToast(err.message || 'Failed to send image attachment', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = ` Confirm & Send Image`;
            }
        }
    },

    openCustomerChat(orderId, orderNumber) {
        this.activeChatConvId = null;
        this.switchTab('chat');
        setTimeout(async () => {
            this.chatConversations = await API.getConversations();
            const conv = this.chatConversations.find(c => c.orderId === orderId);
            if (conv) {
                this.selectChatConversation(conv.id);
            } else {
                // Start conversation for this order
                try {
                    const newConv = await API.startConversation({ orderId: orderId });
                    this.chatConversations = await API.getConversations();
                    this.selectChatConversation(newConv.id);
                } catch (e) {
                    console.error(e);
                }
            }
        }, 100);
    },

    startAdminChatPolling() {
        this.stopAdminChatPolling();
        this.chatPollTimer = setInterval(async () => {
            if (this.currentTab === 'chat' && this.activeChatConvId) {
                const conv = this.chatConversations.find(c => c.id === this.activeChatConvId);
                if (conv) {
                    await this.renderActiveChatFeed(conv);
                }
            }
        }, 3500);
    },

    stopAdminChatPolling() {
        if (this.chatPollTimer) {
            clearInterval(this.chatPollTimer);
            this.chatPollTimer = null;
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    async printLbcWaybill(orderId) {
        try {
            const orders = await API.getAdminOrders();
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const printWindow = window.open('', '_blank', 'width=700,height=800');
            if (!printWindow) {
                showToast('Please allow popups to print the LBC Waybill.', 'error');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>LBC Express Consignment Waybill - ${order.orderNumber}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; margin: 20px; color: #000; background: #fff; }
                        .waybill-box { border: 2px solid #000; padding: 15px; border-radius: 4px; max-width: 600px; margin: 0 auto; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
                        .logo { font-size: 24px; font-weight: 900; color: #dc2626; letter-spacing: -1px; }
                        .barcode { text-align: center; margin: 15px 0; font-family: monospace; font-size: 22px; letter-spacing: 4px; font-weight: bold; }
                        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
                        .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; }
                        .val { font-size: 13px; font-weight: bold; margin-top: 2px; }
                        .items-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
                        .items-table th, .items-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
                        .footer { margin-top: 15px; font-size: 9px; text-align: center; color: #555; border-top: 1px dashed #999; padding-top: 8px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="no-print" style="text-align: center; margin-bottom: 15px;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #dc2626; color: #fff; border: none; border-radius: 4px; cursor: pointer;"> PRINT THERMAL WAYBILL (AWB)</button>
                    </div>
                    <div class="waybill-box">
                        <div class="header">
                            <div>
                                <div class="logo">LBC EXPRESS</div>
                                <div style="font-size: 10px; font-weight: bold;">NATIONWIDE AIR & SEA CARGO</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; font-weight: bold;">SERVICE: N-EXP COP</div>
                                <div style="font-size: 10px;">ORIGIN: MARIKINA HUB (1805)</div>
                            </div>
                        </div>

                        <div class="barcode">
                            ||| | |||| | ||||| || |||| ||||| |||<br>
                            <span style="font-size: 18px;">${order.courierTrackingNumber || '180599201948'}</span>
                        </div>

                        <div class="grid-2">
                            <div>
                                <div class="label">SHIPPER (CONSIGNOR):</div>
                                <div class="val">LAZAROPH MARIKINA</div>
                                <div style="font-size: 11px;">911 J.P. Rizal St, Concepcion Uno, Marikina City</div>
                                <div style="font-size: 11px;">Tel: 282948572</div>
                            </div>
                            <div>
                                <div class="label">CONSIGNEE (RECIPIENT):</div>
                                <div class="val">${order.customerName}</div>
                                <div style="font-size: 11px;">${order.shippingAddress}</div>
                                <div style="font-size: 11px;">${order.shippingCity}, ${order.shippingProvince} ${order.shippingZip}</div>
                                <div style="font-size: 11px;">Contact: ${order.customerPhone}</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 10px;">
                            <div class="label">PACKAGE CONTENTS / AUTHENTIC MERCHANDISE:</div>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th>Size</th>
                                        <th>Qty</th>
                                        <th>Declared Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(it => `
                                        <tr>
                                            <td><strong>${it.productName}</strong></td>
                                            <td>${it.size}</td>
                                            <td>${it.quantity}</td>
                                            <td>${formatMoney(it.subtotal)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; border-top: 1px solid #000; padding-top: 6px;">
                            <span>TOTAL DECLARED VALUE: ${formatMoney(order.total)}</span>
                            <span>PAYMENT: ${order.paymentMethod} (PAID)</span>
                        </div>

                        <div class="footer">
                            Official LBC Express Waybill generated by LAZAROPH E-Commerce Platform.<br>
                            Authentic Sneakers & Sportswear Logistics. For inquiries visit lbcexpress.com
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async loadCustomOrders(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading custom design orders...</div>`;

        try {
            const customOrders = await API.getAdminCustomOrders();
            this.customOrders = customOrders || [];

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">CUSTOMIZATION STUDIO ORDERS</div>
                        <h1 class="admin-page-title">JERSEY & APPAREL CUSTOM ORDERS (${this.customOrders.length})</h1>
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
                                ${this.customOrders.map(co => `
                                    <tr id="custom-order-row-${co.id}">
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
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <select class="form-control" style="padding: 4px 8px; font-size: 0.82rem; width: 140px;" onchange="Admin.updateCustomStatus('${co.id}', this.value)">
                                                    <option value="PENDING_DESIGN" ${co.status === 'PENDING_DESIGN' ? 'selected' : ''}>Pending Design</option>
                                                    <option value="DESIGN_APPROVED" ${co.status === 'DESIGN_APPROVED' ? 'selected' : ''}>Design Approved</option>
                                                    <option value="IN_PRODUCTION" ${co.status === 'IN_PRODUCTION' ? 'selected' : ''}>In Production</option>
                                                    <option value="READY" ${co.status === 'READY' ? 'selected' : ''}>Ready for Packing</option>
                                                    <option value="SHIPPED" ${co.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                                                    <option value="COMPLETED" ${co.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                                                </select>
                                                <button type="button" class="btn btn-sm" style="font-size: 0.75rem; padding: 4px 8px; background: rgba(220,38,38,0.1); color: #dc2626; border: 1px solid rgba(220,38,38,0.3);" onclick="Admin.handleDeleteCustomOrder('${co.id}', this)" title="Delete custom order">
                                                    
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
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load custom orders: ${err.message}</div>`;
        }
    },

    async handleDeleteCustomOrder(id, btn) {
        const order = (this.customOrders || []).find(co => String(co.id) === String(id));
        const orderNumber = order ? order.orderNumber : id;
        return this.deleteCustomOrder(id, orderNumber, btn);
    },

    async deleteCustomOrder(id, orderNumber, btn) {
        const confirmed = await this.confirmModal({
            title: 'Delete Custom Order',
            message: `Are you sure you want to permanently delete custom order #${orderNumber}?`,
            warningText: 'This will remove the custom design order record from the system.',
            confirmText: 'Yes, Delete Order'
        });
        if (!confirmed) return;

        await this.executeDelete({
            btn,
            targetRowSelector: `#custom-order-row-${id}`,
            deleteAction: () => API.deleteCustomOrder(id),
            successMsg: `Custom order #${orderNumber} deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.customOrders)) {
                    this.customOrders = this.customOrders.filter(co => String(co.id) !== String(id));
                }
            }
        });
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
            this.customers = users || [];

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">USER DIRECTORY</div>
                        <h1 class="admin-page-title">ALL REGISTERED ACCOUNTS (${this.customers.length})</h1>
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
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.customers.map(u => `
                                    <tr id="customer-row-${u.id || u.uid}">
                                        <td>#${u.id || u.uid}</td>
                                        <td><strong style="color: #ffffff;">${Admin.safeEscape(u.name)}</strong></td>
                                        <td>${Admin.safeEscape(u.email)}</td>
                                        <td>${u.phone ? Admin.safeEscape(u.phone) : 'N/A'}</td>
                                        <td>${u.city ? `${Admin.safeEscape(u.city)}, ${Admin.safeEscape(u.province || '')}` : 'N/A'}</td>
                                        <td><span class="badge ${u.role === 'ADMIN' ? 'badge-brand' : 'badge-outline'}">${u.role}</span></td>
                                        <td>${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                                        <td style="text-align: right;">
                                            <button class="btn btn-secondary btn-sm" style="color: var(--color-danger); font-weight: 700;" onclick="Admin.handleDeleteCustomer('${u.id || u.uid}', this)" title="Delete Customer Account">
                                                 Delete
                                            </button>
                                        </td>
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

    async handleDeleteCustomer(uid, btn) {
        const user = (this.customers || []).find(u => String(u.id || u.uid) === String(uid));
        const name = user ? user.name : `User #${uid}`;
        return this.deleteCustomer(uid, name, btn);
    },

    async deleteCustomer(uid, name, btn) {
        const confirmed = await this.confirmModal({
            title: 'Delete Customer Account',
            message: `Are you sure you want to permanently delete customer account "${name}"?`,
            warningText: 'This will remove the customer profile from the directory.',
            confirmText: 'Yes, Delete Customer'
        });
        if (!confirmed) return;

        await this.executeDelete({
            btn,
            targetRowSelector: `#customer-row-${uid}`,
            deleteAction: () => API.deleteCustomer(uid),
            successMsg: `Customer "${name}" deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.customers)) {
                    this.customers = this.customers.filter(u => String(u.id || u.uid) !== String(uid));
                }
            }
        });
    },

    async loadSettings(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Loading store & admin settings...</div>`;

        try {
            const settings = await API.getAdminSettings();
            const u = AdminAuth.getAdmin() || Auth.currentUser || {};

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
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #000000;">
                            1. Administrator Account &amp; Mobile
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
                                <input type="text" class="form-control" id="settings-admin-phone" required value="${u.phone || settings.adminPhone || '282948572'}" placeholder="282948572 or 09171234567" style="font-weight: 700;">
                                <span style="font-size: 0.78rem; color: #6b7280; margin-top: 4px; display: block;">
                                    This number updates your administrator profile and store master contact.
                                </span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Change Password (Optional)</label>
                                <input type="password" class="form-control" id="settings-admin-password" placeholder="Leave blank to keep current password">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-admin-profile" style="margin-top: 10px;">
                                 UPDATE ADMIN PROFILE &amp; NUMBER
                            </button>
                        </form>
                    </div>

                    <!-- 2. Official Receiving Payment Details (GCash / Maya / Banks) -->
                    <div class="admin-card">
                        <h3 style="font-size: 1.15rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #000000;">
                            2. Receiving Payment Numbers &amp; QR Codes
                        </h3>
                        <form id="form-store-settings" onsubmit="Admin.saveStoreSettingsForm(event)">
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label class="form-label">GCash Mobile Number *</label>
                                    <input type="text" class="form-control" id="settings-gcash-num" required value="${settings.gcashNumber || '0917-282-9485'}" placeholder="0917-282-9485" style="font-weight: 700;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">GCash Account Name</label>
                                    <input type="text" class="form-control" id="settings-gcash-name" value="${settings.gcashName || 'LAZAROPH PHILIPPINES'}">
                                </div>
                            </div>

                            <!-- GCash QR Code Configuration with Dedicated Add Image Button -->
                            <div class="form-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <label class="form-label" style="margin-bottom: 0;">GCash QR Code Image</label>
                                    <input type="file" id="upload-gcash-qr-input" accept="image/*" style="display: none;" onchange="Admin.handleQrUpload(this, 'settings-gcash-qr', 'prev-gcash-qr')">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('upload-gcash-qr-input').click()">
                                         Upload GCash QR Image
                                    </button>
                                </div>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <div class="admin-qr-preview-box" onclick="document.getElementById('upload-gcash-qr-input').click()" title="Click to upload or change GCash QR Code photo">
                                        <img id="prev-gcash-qr" src="${settings.gcashQrUrl || '/images/qr-gcash-demo.png'}" alt="GCash QR Preview" onerror="this.src='/images/qr-gcash-demo.png'">
                                        <span class="qr-upload-hint">Upload</span>
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <input type="text" class="form-control" id="settings-gcash-qr" value="${settings.gcashQrUrl || '/images/qr-gcash-demo.png'}" placeholder="/images/qr-gcash-demo.png or upload image file" oninput="document.getElementById('prev-gcash-qr').src = this.value">
                                        <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Click the button or box to attach your merchant QR code photo from your device.</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-grid-2" style="margin-top: 14px;">
                                <div class="form-group">
                                    <label class="form-label">Maya (PayMaya) Number *</label>
                                    <input type="text" class="form-control" id="settings-maya-num" required value="${settings.mayaNumber || '0917-282-9485'}" placeholder="0917-282-9485" style="font-weight: 700;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Maya Account Name</label>
                                    <input type="text" class="form-control" id="settings-maya-name" value="${settings.mayaName || 'LAZAROPH PHILIPPINES'}">
                                </div>
                            </div>

                            <!-- Maya QR Code Configuration with Dedicated Add Image Button -->
                            <div class="form-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <label class="form-label" style="margin-bottom: 0;">Maya / QR Ph Image</label>
                                    <input type="file" id="upload-maya-qr-input" accept="image/*" style="display: none;" onchange="Admin.handleQrUpload(this, 'settings-maya-qr', 'prev-maya-qr')">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('upload-maya-qr-input').click()">
                                         Upload Maya QR Image
                                    </button>
                                </div>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <div class="admin-qr-preview-box" onclick="document.getElementById('upload-maya-qr-input').click()" title="Click to upload or change Maya QR Code photo">
                                        <img id="prev-maya-qr" src="${settings.mayaQrUrl || '/images/qr-maya-demo.png'}" alt="Maya QR Preview" onerror="this.src='/images/qr-maya-demo.png'">
                                        <span class="qr-upload-hint">Upload</span>
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <input type="text" class="form-control" id="settings-maya-qr" value="${settings.mayaQrUrl || '/images/qr-maya-demo.png'}" placeholder="/images/qr-maya-demo.png or upload image file" oninput="document.getElementById('prev-maya-qr').src = this.value">
                                        <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Click the button or box to attach your merchant Maya/QR Ph photo from your device.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- BDO Bank Account & QR Ph Upload -->
                            <div class="form-group" style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #e5e7eb;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <label class="form-label" style="margin-bottom: 0;">BDO Bank Account &amp; QR Ph</label>
                                    <input type="file" id="upload-bdo-qr-input" accept="image/*" style="display: none;" onchange="Admin.handleQrUpload(this, 'settings-bdo-qr', 'prev-bdo-qr')">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('upload-bdo-qr-input').click()">
                                         Upload BDO QR Image
                                    </button>
                                </div>
                                <div class="form-grid-2" style="margin-bottom: 8px;">
                                    <input type="text" class="form-control" id="settings-bdo" value="${settings.bdoAccount || '0012-3456-7890 (Lazaro PH)'}" placeholder="BDO Account Number &amp; Name">
                                    <input type="text" class="form-control" id="settings-bdo-qr" value="${settings.bdoQrUrl || ''}" placeholder="BDO QR image path or upload file" oninput="document.getElementById('prev-bdo-qr').src = this.value || '/images/placeholder-product.png'">
                                </div>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <div class="admin-qr-preview-box" onclick="document.getElementById('upload-bdo-qr-input').click()" title="Click to upload or change BDO QR Code photo">
                                        <img id="prev-bdo-qr" src="${settings.bdoQrUrl || '/images/placeholder-product.png'}" alt="BDO QR Preview" onerror="this.src='/images/placeholder-product.png'">
                                        <span class="qr-upload-hint">Upload</span>
                                    </div>
                                    <span style="font-size: 0.75rem; color: #6b7280;">Upload BDO digital bank QR Ph code for direct scan-to-pay bank transfers.</span>
                                </div>
                            </div>

                            <!-- BPI Bank Account & QR Ph Upload -->
                            <div class="form-group" style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #e5e7eb;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <label class="form-label" style="margin-bottom: 0;">BPI Bank Account &amp; QR Ph</label>
                                    <input type="file" id="upload-bpi-qr-input" accept="image/*" style="display: none;" onchange="Admin.handleQrUpload(this, 'settings-bpi-qr', 'prev-bpi-qr')">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800;" onclick="document.getElementById('upload-bpi-qr-input').click()">
                                         Upload BPI QR Image
                                    </button>
                                </div>
                                <div class="form-grid-2" style="margin-bottom: 8px;">
                                    <input type="text" class="form-control" id="settings-bpi" value="${settings.bpiAccount || '9876-5432-10 (Lazaro PH)'}" placeholder="BPI Account Number &amp; Name">
                                    <input type="text" class="form-control" id="settings-bpi-qr" value="${settings.bpiQrUrl || ''}" placeholder="BPI QR image path or upload file" oninput="document.getElementById('prev-bpi-qr').src = this.value || '/images/placeholder-product.png'">
                                </div>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <div class="admin-qr-preview-box" onclick="document.getElementById('upload-bpi-qr-input').click()" title="Click to upload or change BPI QR Code photo">
                                        <img id="prev-bpi-qr" src="${settings.bpiQrUrl || '/images/placeholder-product.png'}" alt="BPI QR Preview" onerror="this.src='/images/placeholder-product.png'">
                                        <span class="qr-upload-hint">Upload</span>
                                    </div>
                                    <span style="font-size: 0.75rem; color: #6b7280;">Upload BPI digital bank QR Ph code for direct scan-to-pay bank transfers.</span>
                                </div>
                            </div>

                            <!-- Public Store Hotline -->
                            <div class="form-group" style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #e5e7eb;">
                                <label class="form-label">Public Store Hotline / Telephone</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: #f3f4f6; border: 1.5px solid #d1d5db; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg width="18" height="18" fill="none" stroke="#000000" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    </div>
                                    <input type="text" class="form-control" id="settings-store-phone" value="${settings.storePhone || '282948572'}" placeholder="282948572 or 0917-282-9485" style="font-weight: 700;">
                                </div>
                                <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Official store contact phone shown on customer receipts, invoices, and tracking pages.</span>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-store-settings" style="margin-top: 14px; background: #000000; color: #ffffff; font-weight: 800;">
                                 SAVE PAYMENT, QR CODES &amp; HOTLINE
                            </button>
                        </form>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-danger); padding: 40px;">Failed to load settings: ${err.message}</div>`;
        }
    },

    handleQrUpload(input, targetInputId, previewImgId) {
        const file = input.files && input.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const targetInp = document.getElementById(targetInputId);
            if (targetInp) targetInp.value = dataUrl;

            const preview = document.getElementById(previewImgId);
            if (preview) preview.src = dataUrl;

            showToast('QR Code image attached! Click "SAVE PAYMENT" below to save.', 'success');
        };
        reader.readAsDataURL(file);
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
            if (typeof AdminAuth !== 'undefined') {
                AdminAuth.setAdmin(updated);
            }
            const nameEl = document.getElementById('admin-sidebar-user-name');
            if (nameEl && updated.name) {
                nameEl.textContent = updated.name;
            }
            showToast('Admin contact number and profile updated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = ' UPDATE ADMIN PROFILE & NUMBER';
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
        const bdoQrUrl = document.getElementById('settings-bdo-qr') ? document.getElementById('settings-bdo-qr').value : '';
        const bpiAccount = document.getElementById('settings-bpi').value;
        const bpiQrUrl = document.getElementById('settings-bpi-qr') ? document.getElementById('settings-bpi-qr').value : '';
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
                bdoQrUrl,
                bpiAccount,
                bpiQrUrl,
                storePhone,
                adminPhone: storePhone
            });
            showToast('Receiving payment numbers and QR codes updated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = ' SAVE PAYMENT, QR CODES & HOTLINE';
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
                        <div class="kpi-header"><span class="kpi-title">Total Brands</span></div>
                        <div class="kpi-value">${brands.length}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Active Brands</span></div>
                        <div class="kpi-value">${activeCount}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Inactive Brands</span></div>
                        <div class="kpi-value">${inactiveCount}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header"><span class="kpi-title">Catalog Products Linked</span></div>
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
            <tr id="brand-row-${b.id}" data-brand-id="${b.id}">
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
                    <span class="badge ${b.status === 'ACTIVE' ? 'badge-legit' : 'badge-danger'}" style="cursor: pointer;" onclick="Admin.toggleBrandStatus('${b.id}', '${b.status}')" title="Click to toggle status">
                        ${b.status === 'ACTIVE' ? ' ACTIVE' : ' INACTIVE'}
                    </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-secondary btn-sm" onclick="Admin.openBrandModalById('${b.id}')" title="Edit Brand">
                         Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" style="color: ${b.status === 'ACTIVE' ? '#eab308' : '#22c55e'};" onclick="Admin.toggleBrandStatus('${b.id}', '${b.status}')" title="Toggle Active / Inactive">
                        ${b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-danger btn-sm" style="font-weight: 700;" onclick="Admin.handleDeleteBrand('${b.id}', this)" title="Delete Brand">
                        DELETE
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

        const confirmed = await this.confirmModal({
            title: 'Delete Brand',
            message: `Are you sure you want to delete brand "${brandName}" from available options?`,
            warningText: 'This will remove the brand from the catalog selection.',
            confirmText: 'Yes, Delete'
        });

        if (!confirmed) {
            if (brandSelect.value === '__DELETE_CURRENT__') {
                brandSelect.value = this._lastSelectedBrandId || (this.brands && this.brands[0] ? this.brands[0].id : '1');
            }
            return;
        }

        try {
            await API.deleteAdminBrand(brandId);
            showToast(`Brand "${brandName}" deleted successfully!`, 'success');

            if (Array.isArray(this.brands)) {
                this.brands = this.brands.filter(b => b.id !== brandId);
            }
            const activeBrands = (this.brands || []).filter(b => b.status === 'ACTIVE');

            brandSelect.innerHTML = activeBrands.map(b => `
                <option value="${b.id}">${b.name}</option>
            `).join('') + `
                <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;"> + Add Brand...</option>
                <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;"> - Delete Selected Brand</option>
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

    openBrandModalById(id, fromProductForm = false) {
        const brand = (this.brands || []).find(b => String(b.id) === String(id));
        this.openBrandModal(brand, fromProductForm);
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
            logoUrl: 'images/brand-nike.png',
            description: '',
            status: 'ACTIVE'
        };

        modal.innerHTML = `
            <div class="modal-container" style="max-width: 580px;">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? `EDIT BRAND: ${b.name}` : ' ADD NEW BRAND'}</h3>
                    <button type="button" class="modal-close" onclick="Admin.closeBrandModal()"></button>
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
                                <input type="text" class="form-control" id="brand-form-logo" required value="${b.logoUrl || 'images/logo.png'}" oninput="document.getElementById('brand-logo-preview-img').src=this.value" placeholder="images/brand-nike.png, https://... or upload photo">
                                <div style="width: 58px; height: 46px; background: #fff; border: 2px dashed #000; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px; flex-shrink: 0; cursor: pointer;" onclick="document.getElementById('brand-file-input').click()" title="Click to upload logo from device">
                                    <img id="brand-logo-preview-img" src="${b.logoUrl || 'images/logo.png'}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='images/logo.png'">
                                </div>
                            </div>

                            <!-- Upload Image Button & Hidden File Input -->
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 8px;">
                                <input type="file" id="brand-file-input" accept="image/*" style="display: none;" onchange="Admin.handleBrandFileUpload(this)">
                                <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; font-weight: 800; padding: 4px 12px; display: flex; align-items: center; gap: 6px;" onclick="document.getElementById('brand-file-input').click()">
                                     Upload Photo / Image File
                                </button>
                                <span style="font-size: 0.72rem; color: #6b7280;">Supports PNG, JPG, SVG, WebP</span>
                            </div>

                            <!-- Quick Preset Logos -->
                            <div style="margin-top: 10px;">
                                <span style="font-size: 0.72rem; color: #6b7280; font-weight: 700;">Or Pick Preset Brand Logo:</span>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Nike', 'images/brand-nike.png')">Nike</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Adidas', 'images/brand-adidas.png')">Adidas</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Puma', 'images/brand-puma.png')">Puma</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('New Balance', 'images/brand-nb.png')">New Balance</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Converse', 'images/brand-converse.png')">Converse</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Vans', 'images/brand-vans.png')">Vans</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Under Armour', 'images/brand-ua.png')">Under Armour</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Asics', 'images/brand-asics.png')">Asics</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Reebok', 'images/brand-reebok.png')">Reebok</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Jordan', 'images/brand-jordan.png')">Jordan</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Casio', 'images/brand-casio.png')">Casio</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('Seiko', 'images/brand-seiko.png')">Seiko</button>
                                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.68rem; padding: 2px 6px;" onclick="Admin.selectPresetBrandLogo('LAZAROPH Signature', 'images/logo.png')">LAZAROPH</button>
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
                                <option value="ACTIVE" ${b.status === 'ACTIVE' ? 'selected' : ''}> ACTIVE (Available in Product creation & Customer store)</option>
                                <option value="INACTIVE" ${b.status === 'INACTIVE' ? 'selected' : ''}> INACTIVE (Hidden from new product dropdown)</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary btn-block" onclick="Admin.closeBrandModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary btn-block" id="btn-save-brand-modal">
                                 ${isEdit ? 'Update Brand' : 'Save Brand'}
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
                        <option value="__ADD_NEW__" style="font-weight: 800; color: #000000; background: #f3f4f6;"> + Add Brand...</option>
                        <option value="__DELETE_CURRENT__" style="font-weight: 800; color: #dc2626; background: #fee2e2;"> - Delete Selected Brand</option>
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
                btn.textContent = ' Save Brand';
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

    async handleDeleteBrand(id, btn) {
        const brand = (this.brands || []).find(b => String(b.id) === String(id));
        const name = brand ? brand.name : `Brand #${id}`;
        return this.deleteBrand(id, name, btn);
    },

    async deleteBrand(id, name, btn) {
        const brand = (this.brands || []).find(b => String(b.id) === String(id));
        const productCount = brand ? (brand.productCount || 0) : 0;

        if (productCount > 0) {
            const userChoice = await this.confirmModal({
                title: 'Brand Linked to Products',
                message: `Brand "${name}" is currently linked to ${productCount} active catalog product(s). Would you like to safely deactivate this brand instead of permanent deletion?`,
                warningText: 'Deactivating hides the brand from storefront filters while preserving existing product data.',
                confirmText: 'Deactivate Brand',
                cancelText: 'Permanently Delete'
            });

            if (userChoice) {
                await this.toggleBrandStatus(id, 'ACTIVE');
                return;
            }
        } else {
            const confirmed = await this.confirmModal({
                title: 'Delete Brand',
                message: `Are you sure you want to permanently delete brand "${name}"?`,
                warningText: 'This brand will be permanently removed from the store brand directory.',
                confirmText: 'Yes, Delete Brand',
                cancelText: 'Cancel'
            });
            if (!confirmed) return;
        }

        await this.executeDelete({
            btn,
            targetRowSelector: `#brand-row-${id}`,
            deleteAction: () => API.deleteAdminBrand(id),
            successMsg: `Brand "${name}" deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.brands)) {
                    this.brands = this.brands.filter(b => String(b.id) !== String(id));
                }
                const countSpan = document.getElementById('admin-brand-count');
                if (countSpan && this.brands) {
                    countSpan.textContent = this.brands.length;
                }
            }
        });
    },

    // =========================================================================
    // ADMIN MANAGEMENT MODULE (/admin/admin-management)
    // =========================================================================
    async loadAdminManagement(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;"><span class="btn-spinner"></span> Loading administrator directory...</div>`;

        try {
            const admins = await API.getAdminList();
            this.adminUsers = admins || [];
            const currentAdmin = AdminAuth.getAdmin() || {};

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">SUPER ADMIN CONTROL CENTER</div>
                        <h1 class="admin-page-title">ADMINISTRATOR MANAGEMENT</h1>
                        <p style="color: var(--color-text-muted); font-size: 0.88rem; margin-top: 4px;">
                            Manage Super Admin accounts, assign roles, enforce 2-step security verification, and update credentials.
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="Admin.openCreateAdminModal()">
                        + Add New Administrator
                    </button>
                </div>

                <!-- Super Admin Overview Banner -->
                <div style="background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.25); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.8rem;"></span>
                        <div>
                            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Two-Step Super Admin Security Active</div>
                            <div style="color: #94a3b8; font-size: 0.82rem;">
                                Logged in as: <strong style="color: #fff;">${escapeHtml(currentAdmin.name)}</strong> (${escapeHtml(currentAdmin.email)}) • Security Lockout enabled after 5 failed PIN attempts.
                            </div>
                        </div>
                    </div>
                    <span class="status-badge super-admin" style="font-size: 0.8rem; padding: 4px 12px;">
                        ${admins.length} Super Admin(s) Seeded &amp; Configured
                    </span>
                </div>

                <!-- Admin Accounts Table Card -->
                <div class="admin-card" style="padding: 0; overflow: hidden;">
                    <div style="padding: 16px 20px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="font-size: 1.05rem; font-weight: 800; text-transform: uppercase; color: #ffffff; margin: 0;">
                            Authorized Administrators (${admins.length})
                        </h3>
                        <span style="font-size: 0.78rem; color: #94a3b8;">Primary Super Admins (1, 2, 3)</span>
                    </div>

                    <div style="overflow-x: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Administrator Name</th>
                                    <th>Email Address</th>
                                    <th>Assigned Role</th>
                                    <th>Account Status</th>
                                    <th>Security PIN Status</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${admins.map(a => {
                                    const isSelf = currentAdmin.id === a.id;
                                    const isActive = a.status === 'ACTIVE';
                                    const isLocked = !!a.isLocked;

                                    return `
                                        <tr id="admin-user-row-${a.id}">
                                            <td style="font-weight: 700; color: #94a3b8;">#${a.id}</td>
                                            <td>
                                                <div style="font-weight: 700; color: #ffffff;">${escapeHtml(a.name)}</div>
                                                ${isSelf ? '<span style="font-size: 0.7rem; color: var(--color-accent); font-weight: 700;">(YOU)</span>' : ''}
                                            </td>
                                            <td>
                                                <span style="font-family: monospace; color: #cbd5e1;">${escapeHtml(a.email)}</span>
                                            </td>
                                            <td>
                                                <span class="status-badge super-admin">${escapeHtml(a.role || 'SUPER_ADMIN')}</span>
                                            </td>
                                            <td>
                                                <span class="status-badge ${isActive ? 'active' : 'disabled'}">
                                                    ${isActive ? '● ACTIVE' : '○ DISABLED'}
                                                </span>
                                            </td>
                                            <td>
                                                ${isLocked ? 
                                                    '<span style="color: #ef4444; font-weight: 700; font-size: 0.8rem;"> Locked (Failed PINs)</span>' : 
                                                    '<span style="color: #10b981; font-weight: 600; font-size: 0.8rem;"> 2FA Configured</span>'}
                                            </td>
                                            <td style="text-align: right; white-space: nowrap;">
                                                <div style="display: inline-flex; gap: 6px;">
                                                    <button class="btn btn-sm btn-secondary" style="font-size: 0.78rem; padding: 4px 10px;" onclick="Admin.openResetAdminModal('${a.id}', '${escapeHtml(a.name)}')">
                                                         Reset Credentials
                                                    </button>
                                                    ${!isSelf ? `
                                                        <button class="btn btn-sm" style="font-size: 0.78rem; padding: 4px 10px; background: ${isActive ? '#f59e0b' : '#10b981'}; color: #000; font-weight: 700;" onclick="Admin.toggleAdminStatus('${a.id}', '${a.status}')">
                                                            ${isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button class="btn btn-sm" style="font-size: 0.78rem; padding: 4px 8px; background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.4);" onclick="Admin.handleDeleteAdminUser('${a.id}', this)" title="Delete Administrator">
                                                            
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `
                <div class="admin-header">
                    <h1 class="admin-page-title">ADMINISTRATOR MANAGEMENT</h1>
                </div>
                <div class="auth-alert auth-alert-error" style="display: block;">
                    Failed to load administrators: ${escapeHtml(err.message)}
                </div>
            `;
        }
    },

    openCreateAdminModal() {
        let modal = document.getElementById('modal-create-admin');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-create-admin';
            modal.className = 'modal modal-overlay active';
            document.body.appendChild(modal);
        }

        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0, 0, 0, 0.85)';
        modal.style.backdropFilter = 'blur(6px)';
        modal.style.webkitBackdropFilter = 'blur(6px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        modal.style.padding = '20px';
        modal.style.boxSizing = 'border-box';

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="Admin.closeCreateAdminModal()" style="position: absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;"></div>
            <div class="modal-content" style="position: relative; z-index: 1000000; width: 100%; max-width: 520px; padding: 0; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95); overflow: hidden; max-height: 92vh; overflow-y: auto;">
                <div style="background: #1e293b; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;"></span>
                        <strong style="color: #fff; font-size: 1rem;">Create Super Administrator</strong>
                    </div>
                    <button type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;" onclick="Admin.closeCreateAdminModal()">&times;</button>
                </div>
                <div style="padding: 24px;">
                    <div id="create-admin-alert" class="auth-alert" style="display: none; margin-bottom: 16px;"></div>
                    <form id="create-admin-form" onsubmit="Admin.handleCreateAdmin(event)">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Full Name *</label>
                            <input type="text" class="form-control" id="new-admin-name" required placeholder="e.g. Clark Montoya" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Administrator Email *</label>
                            <input type="email" class="form-control" id="new-admin-email" required placeholder="e.g. admin4@lazaroph.com" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div class="form-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Login Password *</label>
                                <input type="password" class="form-control" id="new-admin-pass" required placeholder="Min 6 chars" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Confirm Password *</label>
                                <input type="password" class="form-control" id="new-admin-pass-confirm" required placeholder="Re-enter password" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                            </div>
                        </div>
                        <div class="form-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Security PIN *</label>
                                <input type="password" class="form-control" id="new-admin-pin" required maxlength="12" placeholder="e.g. 992104 (min 4)" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Confirm Security PIN *</label>
                                <input type="password" class="form-control" id="new-admin-pin-confirm" required maxlength="12" placeholder="Re-enter PIN" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block;">Assigned Role</label>
                            <input type="text" class="form-control" value="SUPER_ADMIN" disabled style="background: #1e293b; color: #f43f5e; font-weight: 700; border: 1px solid #334155; border-radius: 6px; padding: 10px 14px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                            <button type="button" class="btn" style="background: #ffffff; color: #000000; font-weight: 800; border-radius: 4px; padding: 10px 20px; font-size: 0.88rem; border: none; cursor: pointer;" onclick="Admin.closeCreateAdminModal()">CANCEL</button>
                            <button type="submit" class="btn btn-primary" id="btn-save-new-admin" style="font-weight: 800; border-radius: 4px; padding: 10px 20px; font-size: 0.88rem; cursor: pointer;">CREATE SUPER ADMIN</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeCreateAdminModal() {
        const modal = document.getElementById('modal-create-admin');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    },

    async handleCreateAdmin(event) {
        event.preventDefault();
        const name = (document.getElementById('new-admin-name') ? document.getElementById('new-admin-name').value : '').trim();
        const email = (document.getElementById('new-admin-email') ? document.getElementById('new-admin-email').value : '').trim();
        const password = document.getElementById('new-admin-pass') ? document.getElementById('new-admin-pass').value : '';
        const confirmPassword = document.getElementById('new-admin-pass-confirm') ? document.getElementById('new-admin-pass-confirm').value : '';
        const securityPassword = document.getElementById('new-admin-pin') ? document.getElementById('new-admin-pin').value : '';
        const confirmSecurity = document.getElementById('new-admin-pin-confirm') ? document.getElementById('new-admin-pin-confirm').value : '';
        const alertEl = document.getElementById('create-admin-alert');
        const btn = document.getElementById('btn-save-new-admin');

        const showError = (msg) => {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span> ${escapeHtml(msg)}</span>`;
            } else {
                showToast(msg, 'error');
            }
        };

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }

        if (!name) {
            showError('Please enter the administrator\'s full name.');
            return;
        }

        if (!email || !email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }

        if (!password || password.length < 6) {
            showError('Login password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            showError('Login passwords do not match.');
            return;
        }

        if (!securityPassword || securityPassword.length < 4) {
            showError('Security PIN must be at least 4 digits/characters.');
            return;
        }

        if (securityPassword !== confirmSecurity) {
            showError('Security PINs do not match.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> Creating...';
        }

        try {
            await API.createAdmin({
                name,
                email,
                password,
                confirmPassword,
                securityPassword,
                confirmSecurity,
                role: 'SUPER_ADMIN'
            });

            this.closeCreateAdminModal();
            showToast(`Administrator ${name} created successfully!`, 'success');
            const content = document.getElementById('admin-content-area');
            if (content) this.loadAdminManagement(content);
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'CREATE SUPER ADMIN';
            }
            showError(err.message || 'Failed to create administrator.');
        }
    },

    openResetAdminModal(adminId, adminName) {
        let modal = document.getElementById('modal-reset-admin');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-reset-admin';
            modal.className = 'modal modal-overlay active';
            document.body.appendChild(modal);
        }

        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0, 0, 0, 0.85)';
        modal.style.backdropFilter = 'blur(6px)';
        modal.style.webkitBackdropFilter = 'blur(6px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        modal.style.padding = '20px';
        modal.style.boxSizing = 'border-box';

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="Admin.closeResetAdminModal()" style="position: absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;"></div>
            <div class="modal-content" style="position: relative; z-index: 1000000; width: 100%; max-width: 480px; padding: 0; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95); overflow: hidden; max-height: 92vh; overflow-y: auto;">
                <div style="background: #1e293b; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;"></span>
                        <strong style="color: #fff; font-size: 1rem;">Reset Credentials: ${escapeHtml(adminName)}</strong>
                    </div>
                    <button type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;" onclick="Admin.closeResetAdminModal()">&times;</button>
                </div>
                <div style="padding: 24px;">
                    <div id="reset-admin-alert" class="auth-alert" style="display: none; margin-bottom: 16px;"></div>
                    <form onsubmit="Admin.handleResetAdmin(event, '${adminId}')">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; display: block;">NEW LOGIN PASSWORD</label>
                            <input type="password" class="form-control" id="reset-admin-pass" placeholder="Leave blank to keep unchanged" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; font-size: 0.95rem; width: 100%; box-sizing: border-box;">
                        </div>
                        <div class="form-group" style="margin-bottom: 22px;">
                            <label class="form-label" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; display: block;">NEW SECURITY PIN</label>
                            <input type="password" class="form-control" id="reset-admin-pin" maxlength="12" placeholder="Leave blank to keep unchanged" style="background: #090d16; border: 1px solid #334155; color: #ffffff; border-radius: 6px; padding: 10px 14px; font-size: 0.95rem; width: 100%; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="btn" style="background: #ffffff; color: #000000; font-weight: 800; border-radius: 4px; padding: 10px 20px; font-size: 0.88rem; border: none; cursor: pointer;" onclick="Admin.closeResetAdminModal()">CANCEL</button>
                            <button type="submit" class="btn" id="btn-save-reset-admin" style="background: #000000; color: #ffffff; font-weight: 800; border-radius: 4px; padding: 10px 20px; font-size: 0.88rem; border: 1px solid #1e293b; cursor: pointer;">SAVE NEW CREDENTIALS</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeResetAdminModal() {
        const modal = document.getElementById('modal-reset-admin');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    },

    async handleResetAdmin(event, adminId) {
        event.preventDefault();
        const password = document.getElementById('reset-admin-pass').value;
        const securityPassword = document.getElementById('reset-admin-pin').value;
        const btn = document.getElementById('btn-save-reset-admin');

        if (!password && !securityPassword) {
            showToast('Please specify at least one credential to reset.', 'warning');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
        }

        try {
            await API.resetAdminSecurity(adminId, password, securityPassword);
            this.closeResetAdminModal();
            showToast('Administrator credentials reset successfully!', 'success');
            const content = document.getElementById('admin-content-area');
            if (content) this.loadAdminManagement(content);
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'SAVE NEW CREDENTIALS';
            }
            showToast(err.message, 'error');
        }
    },

    async toggleAdminStatus(adminId, currentStatus) {
        const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        const confirmed = await this.confirmModal({
            title: `${newStatus === 'DISABLED' ? 'Disable' : 'Enable'} Administrator`,
            message: `Are you sure you want to change this administrator status to ${newStatus}?`,
            warningText: newStatus === 'DISABLED' ? 'This administrator will temporarily lose access to the portal.' : '',
            confirmText: `Yes, ${newStatus === 'DISABLED' ? 'Disable' : 'Enable'}`
        });
        if (!confirmed) return;

        try {
            await API.updateAdminStatus(adminId, newStatus);
            showToast(`Administrator status changed to ${newStatus}.`, 'success');
            const content = document.getElementById('admin-content-area');
            if (content) this.loadAdminManagement(content);
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async handleDeleteAdminUser(adminId, btn) {
        const admin = (this.adminUsers || []).find(a => String(a.id) === String(adminId));
        const name = admin ? admin.name : `Admin #${adminId}`;
        return this.deleteAdminUser(adminId, name, btn);
    },

    async deleteAdminUser(adminId, adminName, btn) {
        const currentAdmin = AdminAuth.getAdmin() || {};
        if (String(currentAdmin.id) === String(adminId) || currentAdmin.name === adminName || currentAdmin.email === adminName) {
            showToast('You cannot delete your own currently active administrator account.', 'warning');
            return;
        }

        try {
            const adminList = await API.getAdminList();
            const activeSuperAdmins = (adminList || []).filter(a => (a.role === 'SUPER_ADMIN' || a.role === 'ADMIN') && a.status === 'ACTIVE' && String(a.id) !== String(adminId));
            if (activeSuperAdmins.length === 0) {
                showToast('Cannot delete the last remaining active Administrator.', 'error');
                return;
            }
        } catch (ignored) {}

        const confirmed = await this.confirmModal({
            title: 'Delete Administrator',
            message: `Are you sure you want to permanently revoke and delete administrator access for "${adminName}"?`,
            warningText: 'This administrator will no longer be able to log in to the LAZAROPH Admin portal.',
            confirmText: 'Yes, Delete Admin'
        });
        if (!confirmed) return;

        await this.executeDelete({
            btn,
            targetRowSelector: `#admin-user-row-${adminId}`,
            deleteAction: () => API.deleteAdmin(adminId),
            successMsg: `Administrator "${adminName}" deleted successfully.`,
            onComplete: () => {
                if (Array.isArray(this.adminUsers)) {
                    this.adminUsers = this.adminUsers.filter(a => String(a.id) !== String(adminId));
                }
            }
        });
    },

    // =========================================================================
    // HOMEPAGE MANAGEMENT — FEATURED CATEGORIES MODULE
    // =========================================================================
    stagedCategoryUploads: {},

    async loadHomepageManagement(container) {
        container.innerHTML = `<div style="text-align: center; padding: 60px 0;"><span class="btn-spinner"></span> Loading Featured Categories...</div>`;

        try {
            const categories = await API.getFeaturedCategories();

            container.innerHTML = `
                <div class="admin-header">
                    <div>
                        <div class="section-subtitle">HOMEPAGE MANAGEMENT</div>
                        <h1 class="admin-page-title">FEATURED CATEGORIES</h1>
                        <p style="color: var(--color-text-muted); font-size: 0.88rem; margin-top: 4px;">
                            Manage the 5 homepage category cards (<strong>MEN</strong>, <strong>WOMEN</strong>, <strong>KIDS</strong>, <strong>SLIDES</strong>, <strong>WATCHES</strong>).
                            Choose and upload photos from your computer to update the storefront homepage in real time.
                        </p>
                    </div>
                    <button class="btn btn-secondary" onclick="App.navigate('home')">
                        View Storefront ↗
                    </button>
                </div>

                <div style="background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                    <div style="font-size: 1.5rem;"></div>
                    <div style="font-size: 0.84rem; color: #4b5563; line-height: 1.5;">
                        <strong style="color: #000000;">Super Admin Image Uploader:</strong> Click <strong>Choose Image</strong> to select a photo (JPG, PNG, or WEBP up to 10MB) directly from your computer. You'll see an instant preview of how it looks on the homepage card. Click <strong>Upload / Save</strong> to apply it to the live store.
                    </div>
                </div>

                <div class="featured-cats-grid">
                    ${categories.map(cat => {
                        const key = (cat.key || '').toLowerCase();
                        const isUploaded = cat.imageUrl && cat.imageUrl.includes('uploads/');
                        return `
                            <div class="category-upload-card" id="cat-card-manage-${key}">
                                <div class="category-upload-header">
                                    <div>
                                        <span style="font-size: 0.72rem; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">CATEGORY</span>
                                        <h3 style="font-size: 1.3rem; font-weight: 900; color: #000000; text-transform: uppercase; margin: 2px 0 0 0;">${cat.name}</h3>
                                    </div>
                                    <span class="badge ${isUploaded ? 'badge-primary' : 'badge-secondary'}" id="cat-source-badge-${key}" style="font-size: 0.72rem;">
                                        ${isUploaded ? 'Custom Photo' : 'Default Image'}
                                    </span>
                                </div>

                                <!-- Current Image Preview with Live Card Mockup -->
                                <div class="category-upload-preview" id="cat-preview-box-${key}">
                                    <div class="category-upload-preview-bg" id="cat-preview-img-${key}" style="background-image: linear-gradient(rgba(17,22,34,0.35), rgba(17,22,34,0.85)), url('${cat.imageUrl}');"></div>
                                    <div class="category-upload-preview-overlay">
                                        <span class="badge badge-brand" style="margin-bottom: 6px; font-size: 0.65rem; width: fit-content;">${cat.badge || cat.name}</span>
                                        <div style="font-size: 1.15rem; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: -0.01em;">${cat.name}</div>
                                        <div style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 8px; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cat.description || ''}</div>
                                        <span style="display: inline-block; background: #ffffff; color: #000000; font-size: 0.68rem; font-weight: 800; padding: 4px 10px; border-radius: 3px; width: fit-content;">${cat.buttonText || 'SHOP ' + cat.name}</span>
                                    </div>
                                </div>

                                <!-- Staged File Details -->
                                <div id="cat-file-detail-${key}" style="display: none; margin-top: 12px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 0.8rem; color: #166534;"></div>

                                <!-- Error Alert Banner -->
                                <div id="cat-error-${key}" style="display: none; margin-top: 12px; padding: 8px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 0.8rem; color: #991b1b;"></div>

                                <!-- Success Banner -->
                                <div id="cat-success-${key}" style="display: none; margin-top: 12px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; font-size: 0.8rem; color: #15803d;"></div>

                                <!-- Action Buttons -->
                                <div class="category-upload-actions">
                                    <input type="file" id="cat-file-input-${key}" accept="image/jpeg,image/png,image/webp,image/jpg" style="display: none;" onchange="Admin.handleCategoryFileSelected('${key}', this)">

                                    <div style="display: flex; gap: 8px;">
                                        <button type="button" class="btn-choose-image" style="flex: 1;" onclick="document.getElementById('cat-file-input-${key}').click()">
                                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            Choose Image
                                        </button>
                                        ${isUploaded ? `
                                            <button type="button" class="btn btn-secondary" style="padding: 8px 12px; font-size: 0.78rem;" title="Reset to default image" onclick="Admin.resetCategoryPhoto('${key}', this)">
                                                ↺ Reset
                                            </button>
                                        ` : ''}
                                    </div>

                                    <button type="button" class="btn-upload-save" id="cat-save-btn-${key}" disabled onclick="Admin.uploadCategoryPhoto('${key}')">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                                        Upload / Save
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: #e11d48;">Failed to load featured categories: ${err.message}</div>`;
        }
    },

    handleCategoryFileSelected(categoryKey, input) {
        const errBox = document.getElementById(`cat-error-${categoryKey}`);
        const successBox = document.getElementById(`cat-success-${categoryKey}`);
        const detailBox = document.getElementById(`cat-file-detail-${categoryKey}`);
        const saveBtn = document.getElementById(`cat-save-btn-${categoryKey}`);
        const previewBg = document.getElementById(`cat-preview-img-${categoryKey}`);

        if (errBox) errBox.style.display = 'none';
        if (successBox) successBox.style.display = 'none';

        if (!input.files || !input.files[0]) {
            return;
        }

        const file = input.files[0];

        // 1. Validate file format
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

        if (!file.type.startsWith('image/') || (!validMimeTypes.includes(file.type) && !hasValidExt)) {
            if (errBox) {
                errBox.textContent = 'The file format is unsupported. Please choose a JPG, JPEG, PNG, or WEBP image.';
                errBox.style.display = 'block';
            }
            input.value = '';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.background = '#000000';
                saveBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg> Upload / Save`;
            }
            if (detailBox) detailBox.style.display = 'none';
            return;
        }

        // 2. Validate file size (Max 10MB)
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            if (errBox) {
                errBox.textContent = `The file is too large (${sizeMb}MB). Maximum allowed size is 10MB.`;
                errBox.style.display = 'block';
            }
            input.value = '';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.background = '#000000';
                saveBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg> Upload / Save`;
            }
            if (detailBox) detailBox.style.display = 'none';
            return;
        }

        // 3. Read image file and show instant local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            Admin.stagedCategoryUploads[categoryKey] = {
                categoryKey,
                filename: file.name,
                fileSize: file.size,
                dataUrl
            };

            // Update preview background immediately
            if (previewBg) {
                previewBg.style.backgroundImage = `linear-gradient(rgba(17,22,34,0.35), rgba(17,22,34,0.85)), url('${dataUrl}')`;
            }

            // Display file details
            if (detailBox) {
                const formattedSize = file.size > 1024 * 1024
                    ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                    : (file.size / 1024).toFixed(0) + ' KB';
                detailBox.innerHTML = `<strong>Selected:</strong> ${file.name} (${formattedSize}) — Ready to save!`;
                detailBox.style.display = 'block';
            }

            // Enable and highlight Save button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.style.background = '#e11d48';
                saveBtn.innerHTML = ` Click to Save & Apply`;
            }
        };

        reader.onerror = () => {
            if (errBox) {
                errBox.textContent = 'Failed to read image file from your computer.';
                errBox.style.display = 'block';
            }
        };

        reader.readAsDataURL(file);
    },

    async uploadCategoryPhoto(categoryKey) {
        const staged = Admin.stagedCategoryUploads[categoryKey];
        const saveBtn = document.getElementById(`cat-save-btn-${categoryKey}`);
        const errBox = document.getElementById(`cat-error-${categoryKey}`);
        const successBox = document.getElementById(`cat-success-${categoryKey}`);
        const detailBox = document.getElementById(`cat-file-detail-${categoryKey}`);

        if (!staged || !staged.dataUrl) {
            if (errBox) {
                errBox.textContent = 'Please choose an image first before saving.';
                errBox.style.display = 'block';
            }
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="btn-spinner"></span> Uploading...`;
        }

        try {
            const res = await API.uploadFeaturedCategory({
                categoryKey: staged.categoryKey,
                filename: staged.filename,
                imageData: staged.dataUrl
            });

            const uploadedUrl = res.imageUrl || res.category.imageUrl;

            if (successBox) {
                successBox.textContent = `Photo saved successfully! Homepage card background updated.`;
                successBox.style.display = 'block';
            }

            if (detailBox) detailBox.style.display = 'none';

            // Clean staged upload cache for this category
            delete Admin.stagedCategoryUploads[categoryKey];

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.background = '#000000';
                saveBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg> Upload / Save`;
            }

            showToast(`Photo for ${categoryKey.toUpperCase()} uploaded and saved successfully!`, 'success');

            // Update storefront homepage in DOM immediately
            if (typeof Store !== 'undefined' && typeof Store.loadFeaturedCategories === 'function') {
                Store.loadFeaturedCategories();
            }

            // Refresh the admin view after short delay to update badges & reset buttons
            setTimeout(() => {
                const content = document.getElementById('admin-content-area');
                if (content && Admin.currentTab === 'homepage-management') {
                    Admin.loadHomepageManagement(content);
                }
            }, 1000);

        } catch (err) {
            if (errBox) {
                errBox.textContent = err.message || 'Failed to upload photo.';
                errBox.style.display = 'block';
            }
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = ` Click to Save & Apply`;
            }
            showToast(err.message || 'Failed to upload image.', 'error');
        }
    },

    async resetCategoryPhoto(categoryKey, btn) {
        const confirmed = await this.confirmModal({
            title: 'Reset Category Photo',
            message: `Are you sure you want to reset the ${categoryKey.toUpperCase()} category image back to default?`,
            warningText: 'The custom uploaded photo will be removed and reverted to default.',
            confirmText: 'Yes, Reset'
        });
        if (!confirmed) return;

        let originalHtml = '';
        if (btn) {
            originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span class="btn-spinner" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></span> Resetting...`;
        }

        try {
            await API.resetFeaturedCategory(categoryKey);
            showToast(`Category ${categoryKey.toUpperCase()} reset to default image.`, 'success');

            if (typeof Store !== 'undefined' && typeof Store.loadFeaturedCategories === 'function') {
                Store.loadFeaturedCategories();
            }

            const previewBg = document.getElementById(`cat-preview-${categoryKey}`);
            const badge = document.getElementById(`cat-badge-${categoryKey}`);
            const detailBox = document.getElementById(`cat-file-detail-${categoryKey}`);

            if (previewBg) {
                const defaultImgs = {
                    men: 'images/category-men.png',
                    women: 'images/category-women.png',
                    kids: 'images/category-kids.png',
                    slides: 'images/category-slides.png',
                    watches: 'images/category-watches.png'
                };
                const defaultImg = defaultImgs[categoryKey] || 'images/logo.png';
                previewBg.style.backgroundImage = `linear-gradient(rgba(17,22,34,0.35), rgba(17,22,34,0.85)), url('${defaultImg}')`;
            }
            if (badge) {
                badge.style.background = '#6b7280';
                badge.textContent = 'Default Preset Image';
            }
            if (detailBox) {
                detailBox.style.display = 'none';
            }
            if (btn) {
                btn.style.display = 'none';
            }
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
            showToast(err.message || 'Failed to reset category image.', 'error');
        }
    },

    // =========================================================================
    // DEDICATED GROSS SALES & FINANCIAL AUDIT ENGINE
    // =========================================================================
    async loadGrossSales(container, period = 'all', customStart = null, customEnd = null) {
        this.currentSalesPeriod = period;
        this.customSalesStart = customStart;
        this.customSalesEnd = customEnd;

        container.innerHTML = `
            <div class="admin-header">
                <div>
                    <div class="section-subtitle">FINANCIAL REPORT &amp; REVENUE AUDIT</div>
                    <h1 class="admin-page-title">GROSS SALES</h1>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="Admin.switchTab('dashboard')">← Back to Overview</button>
                    <button class="btn btn-primary" onclick="window.print()"> Print Sales Report</button>
                </div>
            </div>

            <div id="gross-sales-main-container">
                <div style="text-align: center; padding: 60px 0;">
                    <span class="btn-spinner" style="width: 32px; height: 32px; display: inline-block;"></span>
                    <p style="margin-top: 12px; color: #94a3b8;">Calculating financial metrics and fetching sales ledger...</p>
                </div>
            </div>
        `;

        await this.renderGrossSalesLedger(period, customStart, customEnd);
    },

    async renderGrossSalesLedger(period = 'all', customStart = null, customEnd = null) {
        const bodyEl = document.getElementById('gross-sales-main-container');
        if (!bodyEl) return;

        let salesData = null;
        try {
            let url = `/api/sales?period=${period}`;
            if (period === 'custom' && customStart && customEnd) {
                url = `/api/sales?startDate=${customStart}&endDate=${customEnd}`;
            }
            salesData = await API.request(url);
        } catch (e) {
            console.warn('[Admin Sales Breakdown] Calculating sales from local order store:', e);
        }

        if (!salesData || !salesData.orders) {
            const orders = (typeof FallbackStore !== 'undefined' && FallbackStore.getOrders) ? FallbackStore.getOrders() : [];
            const now = new Date();
            let filtered = [...orders];

            if (period === 'today') {
                const todayStr = now.toISOString().slice(0, 10);
                filtered = filtered.filter(o => (o.createdAt || '').slice(0, 10) === todayStr);
            } else if (period === 'week') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(o => new Date(o.createdAt || now) >= sevenDaysAgo);
            } else if (period === 'month') {
                const currentMonth = now.toISOString().slice(0, 7);
                filtered = filtered.filter(o => (o.createdAt || '').slice(0, 7) === currentMonth);
            } else if (period === 'year') {
                const currentYear = now.getFullYear().toString();
                filtered = filtered.filter(o => (o.createdAt || '').slice(0, 4) === currentYear);
            } else if (period === 'custom' && customStart && customEnd) {
                const start = new Date(customStart);
                const end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
                filtered = filtered.filter(o => {
                    const d = new Date(o.createdAt || now);
                    return d >= start && d <= end;
                });
            }

            const validOrders = filtered.filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED');
            const grossSales = validOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
            const totalItemsSold = validOrders.reduce((sum, o) => {
                return sum + (o.items ? o.items.reduce((iSum, item) => iSum + (parseInt(item.quantity, 10) || 1), 0) : 1);
            }, 0);

            salesData = {
                filter: period,
                grossSales,
                grossSalesFormatted: `₱${grossSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                totalOrders: filtered.length,
                validSalesOrdersCount: validOrders.length,
                totalItemsSold,
                orders: validOrders
            };
        }

        const activeFilter = period || 'all';
        const ordersList = (salesData && salesData.orders) ? salesData.orders : [];

        let periodLabel = 'All Time';
        if (activeFilter === 'today') periodLabel = 'Today';
        else if (activeFilter === 'week') periodLabel = 'This Week';
        else if (activeFilter === 'month') periodLabel = 'This Month';
        else if (activeFilter === 'year') periodLabel = 'This Year';
        else if (activeFilter === 'custom') periodLabel = `${customStart || ''} to ${customEnd || ''}`;

        bodyEl.innerHTML = `
            <!-- Top Hero KPI Card -->
            <div class="gross-sales-hero-card">
                <div class="gross-sales-hero-title-group">
                    <div class="gross-sales-hero-tag">TOTAL GROSS SALES (${periodLabel.toUpperCase()})</div>
                    <div class="gross-sales-hero-value" id="gross-sales-main-display">
                        ${salesData.grossSalesFormatted || formatMoney(salesData.grossSales)}
                    </div>
                    <div class="gross-sales-hero-note">
                        Strictly calculated from real confirmed, processing, shipped, and delivered customer orders in Firestore. Cancelled &amp; refunded orders are excluded.
                    </div>
                </div>
                <div class="gross-sales-metric-badges">
                    <div class="gross-metric-badge">
                        <span class="gross-metric-badge-label">CONTRIBUTING ORDERS</span>
                        <span class="gross-metric-badge-value">${salesData.validSalesOrdersCount || ordersList.length}</span>
                    </div>
                    <div class="gross-metric-badge">
                        <span class="gross-metric-badge-label">ITEMS PURCHASED</span>
                        <span class="gross-metric-badge-value" style="color: #38bdf8;">${salesData.totalItemsSold || 0}</span>
                    </div>
                    <div class="gross-metric-badge">
                        <span class="gross-metric-badge-label">AVG ORDER VALUE</span>
                        <span class="gross-metric-badge-value" style="color: #fbbf24;">
                            ${formatMoney((salesData.validSalesOrdersCount || ordersList.length) > 0 ? (salesData.grossSales / (salesData.validSalesOrdersCount || ordersList.length)) : 0)}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Dynamic Date Filter Controls -->
            <div class="admin-card" style="margin-bottom: 24px; padding: 18px 24px;">
                <div style="font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Filter Sales Period</span>
                    <span style="font-size: 0.75rem; font-weight: 600; color: #10b981;"> Real-time Dynamic Recalculation</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="sales-period-pill-group">
                    <button type="button" class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.renderGrossSalesLedger('all')">All Time</button>
                    <button type="button" class="btn btn-sm ${activeFilter === 'today' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.renderGrossSalesLedger('today')">Today</button>
                    <button type="button" class="btn btn-sm ${activeFilter === 'week' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.renderGrossSalesLedger('week')">This Week</button>
                    <button type="button" class="btn btn-sm ${activeFilter === 'month' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.renderGrossSalesLedger('month')">This Month</button>
                    <button type="button" class="btn btn-sm ${activeFilter === 'year' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.renderGrossSalesLedger('year')">This Year</button>
                    <button type="button" class="btn btn-sm ${activeFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}" style="font-weight: 700; border-radius: 20px; padding: 6px 14px;" onclick="Admin.toggleSalesCustomDateRange()">Custom Date Range </button>
                </div>

                <!-- Custom Date Range Picker Container -->
                <div id="sales-custom-date-container" style="display: ${activeFilter === 'custom' ? 'flex' : 'none'}; gap: 12px; align-items: flex-end; margin-top: 14px; background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; flex-wrap: wrap;">
                    <div>
                        <label style="font-size: 0.75rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 4px;">Start Date</label>
                        <input type="date" id="sales-custom-start" class="form-control" style="padding: 6px 10px; font-size: 0.85rem; background: #1e293b; border-color: #334155; color: #fff;" value="${customStart || ''}">
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 4px;">End Date</label>
                        <input type="date" id="sales-custom-end" class="form-control" style="padding: 6px 10px; font-size: 0.85rem; background: #1e293b; border-color: #334155; color: #fff;" value="${customEnd || ''}">
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" style="padding: 8px 16px; font-weight: 800;" onclick="Admin.applyCustomDateSalesFilter()">Apply Filter</button>
                </div>
            </div>

            <!-- Complete Itemized Ledger Table -->
            <div class="admin-card" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0; text-transform: uppercase;">
                            Itemized Sales Breakdown (${ordersList.length} Records)
                        </h3>
                        <p style="font-size: 0.82rem; color: #94a3b8; margin-top: 4px;">
                            Detailed financial records and order source accounting
                        </p>
                    </div>
                    <div>
                        <span class="badge badge-brand" style="font-size: 0.75rem; padding: 4px 10px;">EST 2016 AUDITED</span>
                    </div>
                </div>

                ${ordersList.length === 0 ? `
                    <div style="text-align: center; padding: 50px 20px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed #334155; color: #94a3b8;">
                        <div style="font-size: 2.2rem; margin-bottom: 10px;"></div>
                        <h4 style="color: #ffffff; margin-bottom: 6px; font-weight: 700;">No Sales Records Found for this Period</h4>
                        <p style="font-size: 0.88rem; max-width: 460px; margin: 0 auto;">Try selecting "All Time" or adjusting your date range filter to inspect contributing customer orders.</p>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="admin-table" style="width: 100%; font-size: 0.85rem;">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer Name &amp; Email</th>
                                    <th>Order Date</th>
                                    <th>Products Ordered &amp; Qty</th>
                                    <th>Subtotal</th>
                                    <th>Delivery Fee</th>
                                    <th>Discounts</th>
                                    <th style="text-align: right;">Final Order Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ordersList.map(o => {
                                    const itemsHtml = (o.items || []).map(it => `
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                            <img src="${it.imageUrl || 'images/runner-x1-black-main.png'}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; background: #0f172a; border: 1px solid #334155;" alt="Product">
                                            <div>
                                                <div style="font-weight: 700; color: #ffffff;">${escapeHtml(it.productName || 'Product')}</div>
                                                <div style="font-size: 0.76rem; color: #94a3b8;">
                                                    ${it.size ? `Size: ${escapeHtml(it.size)}` : ''} • Qty: <strong>${it.quantity || 1}</strong> @ ${formatMoney(it.price)}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') || '<span style="color:#94a3b8;">Direct Purchase</span>';

                                    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                                    const subtotalVal = parseFloat(o.subtotal) || (parseFloat(o.totalAmount) - (parseFloat(o.shippingFee) || 0)) || parseFloat(o.totalAmount) || 0;
                                    const shippingVal = parseFloat(o.shippingFee) || 0;
                                    const discountVal = parseFloat(o.discount) || 0;
                                    const totalVal = parseFloat(o.totalAmount) || (subtotalVal + shippingVal - discountVal);

                                    return `
                                        <tr>
                                            <td>
                                                <strong style="color: #e11d48; font-weight: 800; font-family: monospace; font-size: 0.9rem;">
                                                    #${escapeHtml(o.orderNumber || o.id)}
                                                </strong>
                                            </td>
                                            <td>
                                                <div style="font-weight: 700; color: #ffffff;">${escapeHtml(o.customerName || 'Customer')}</div>
                                                <div style="font-size: 0.76rem; color: #94a3b8;">${escapeHtml(o.customerEmail || '')}</div>
                                            </td>
                                            <td style="white-space: nowrap; color: #cbd5e1;">${dateStr}</td>
                                            <td style="min-width: 200px;">${itemsHtml}</td>
                                            <td style="color: #cbd5e1; font-weight: 600;">${formatMoney(subtotalVal)}</td>
                                            <td style="color: #94a3b8;">${shippingVal > 0 ? formatMoney(shippingVal) : '<span style="color:#10b981;">FREE</span>'}</td>
                                            <td style="color: #94a3b8;">${discountVal > 0 ? `-${formatMoney(discountVal)}` : '₱0.00'}</td>
                                            <td style="text-align: right;">
                                                <strong style="color: #10b981; font-size: 1rem; font-weight: 900;">
                                                    ${formatMoney(totalVal)}
                                                </strong>
                                            </td>
                                            <td>
                                                <span class="badge badge-success" style="font-size: 0.72rem; padding: 4px 8px;">
                                                    ${escapeHtml(o.status || 'CONFIRMED')}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    openSalesBreakdown(period = 'all', customStart = null, customEnd = null) {
        this.switchTab('sales');
        if (period !== 'all' || customStart || customEnd) {
            setTimeout(() => this.renderGrossSalesLedger(period, customStart, customEnd), 50);
        }
    },

    toggleSalesCustomDateRange() {
        const picker = document.getElementById('sales-custom-date-container');
        if (picker) {
            picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
        }
    },

    applyCustomDateSalesFilter() {
        const start = document.getElementById('sales-custom-start') ? document.getElementById('sales-custom-start').value : '';
        const end = document.getElementById('sales-custom-end') ? document.getElementById('sales-custom-end').value : '';
        if (!start || !end) {
            showToast('Please select both start date and end date.', 'warning');
            return;
        }
        this.renderGrossSalesLedger('custom', start, end);
    },

    closeSalesBreakdown() {
        this.switchTab('dashboard');
    },

    filterOrdersByStatus(status) {
        this.switchTab('orders');
        setTimeout(() => {
            const filterEl = document.getElementById('admin-order-filter-status');
            if (filterEl) {
                filterEl.value = status;
                filterEl.dispatchEvent(new Event('change'));
            }
        }, 150);
    }
};
