/**
 * LAZAROPH — Order Tracking & Customer Order History Module
 */

const Orders = {
    async track(orderNumber) {
        const container = document.getElementById('view-order-track');
        if (!container) return;

        if (!orderNumber) {
            this.renderLookupForm(container);
            return;
        }

        container.innerHTML = `
            <div class="container" style="text-align: center; padding: 80px 0;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-brand-red); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 16px; color: var(--color-text-secondary);">Tracking order ${orderNumber}...</p>
            </div>
        `;

        try {
            const order = await API.trackOrder(orderNumber);
            this.renderTrackingDetails(container, order);
        } catch (err) {
            container.innerHTML = `
                <div class="container" style="max-width: 600px; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
                    <h2 style="margin-bottom: 8px;">Order Not Found</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">No order matches "<strong>${orderNumber}</strong>". Please check your Order ID and try again.</p>
                    <button class="btn btn-primary" onclick="Orders.renderLookupForm(document.getElementById('view-order-track'))">Track Another Order</button>
                </div>
            `;
        }
    },

    renderLookupForm(container) {
        container.innerHTML = `
            <div class="container" style="max-width: 600px; padding: 60px 20px;">
                <div class="checkout-section-card" style="text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">📦</div>
                    <h1 style="font-size: 1.85rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">TRACK YOUR ORDER</h1>
                    <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 28px;">
                        Enter the unique LAZAROPH Order ID sent to your email or receipt (e.g. LZPH-20260817-0001).
                    </p>

                    <form onsubmit="event.preventDefault(); Orders.track(document.getElementById('track-input-id').value);">
                        <div class="form-group">
                            <input type="text" class="form-control" id="track-input-id" required placeholder="LZPH-20260817-0001" style="text-align: center; font-size: 1.1rem; text-transform: uppercase; font-weight: 700; height: 50px;">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            TRACK ORDER STATUS
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    renderTrackingDetails(container, order) {
        const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
        let currentIndex = statuses.indexOf(order.status.toUpperCase());
        if (currentIndex === -1) currentIndex = 0; // Default or cancelled

        const progressPct = (currentIndex / (statuses.length - 1)) * 100;

        container.innerHTML = `
            <div class="container">
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: var(--color-text-muted);">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: var(--color-text-secondary);">Home</a> / 
                    <span style="color: #ffffff;">Order Tracking: ${order.orderNumber}</span>
                </div>

                <div class="tracking-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
                        <div>
                            <span class="badge badge-brand" style="margin-bottom: 8px;">LAZAROPH OFFICIAL DISPATCH</span>
                            <h1 style="font-size: 2rem; font-weight: 900; text-transform: uppercase;">ORDER #${order.orderNumber}</h1>
                            <div style="color: var(--color-text-muted); font-size: 0.85rem;">Placed on ${new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.82rem; color: var(--color-text-muted);">Current Status</div>
                            <span class="status-pill status-${order.status.toLowerCase()}" style="font-size: 0.9rem; padding: 6px 14px; margin-top: 4px;">
                                ${order.status}
                            </span>
                        </div>
                    </div>

                    <!-- 5-Stage Timeline Tracker -->
                    <div class="timeline-tracker">
                        <div class="timeline-progress-bar" style="width: calc(${progressPct}% - 40px);"></div>
                        
                        <div class="timeline-step ${currentIndex >= 0 ? (currentIndex > 0 ? 'completed' : 'active') : ''}">
                            <div class="timeline-dot">1</div>
                            <div class="timeline-label">Pending</div>
                        </div>
                        <div class="timeline-step ${currentIndex >= 1 ? (currentIndex > 1 ? 'completed' : 'active') : ''}">
                            <div class="timeline-dot">2</div>
                            <div class="timeline-label">Confirmed</div>
                        </div>
                        <div class="timeline-step ${currentIndex >= 2 ? (currentIndex > 2 ? 'completed' : 'active') : ''}">
                            <div class="timeline-dot">3</div>
                            <div class="timeline-label">Processing</div>
                        </div>
                        <div class="timeline-step ${currentIndex >= 3 ? (currentIndex > 3 ? 'completed' : 'active') : ''}">
                            <div class="timeline-dot">4</div>
                            <div class="timeline-label">Shipped</div>
                        </div>
                        <div class="timeline-step ${currentIndex >= 4 ? 'completed' : ''}">
                            <div class="timeline-dot">5</div>
                            <div class="timeline-label">Delivered</div>
                        </div>
                    </div>

                    <!-- Order Details Grid -->
                    <div class="form-grid-2" style="margin-top: 40px; padding-top: 30px; border-top: 1px solid var(--color-border);">
                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #ffffff;">Delivery Information</h4>
                            <div style="font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.6;">
                                <div><strong>${order.customerName}</strong></div>
                                <div>${order.customerPhone}</div>
                                <div>${order.shippingAddress}</div>
                                <div>${order.shippingCity}, ${order.shippingProvince} ${order.shippingZip}</div>
                                <div style="margin-top: 8px;">Payment: <strong>${order.paymentMethod}</strong></div>
                                ${order.paymentReference ? `<div style="color: var(--color-brand-cyan); font-size: 0.82rem; margin-top: 2px;">Ref #: <strong>${order.paymentReference}</strong></div>` : ''}
                            </div>
                        </div>

                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #ffffff;">Purchased Items</h4>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${order.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; font-size: 0.88rem; background: var(--color-bg-card); padding: 10px 14px; border-radius: var(--radius-sm);">
                                        <div>
                                            <strong>${item.productName}</strong>
                                            <div style="font-size: 0.78rem; color: var(--color-text-muted);">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</div>
                                        </div>
                                        <div style="font-weight: 700;">${formatMoney(item.subtotal)}</div>
                                    </div>
                                `).join('')}

                                <div style="border-top: 1px solid var(--color-border); padding-top: 10px; margin-top: 4px; display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem;">
                                    <span>Total Paid / Due:</span>
                                    <span style="color: var(--color-brand-red);">${formatMoney(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadUserOrders() {
        const container = document.getElementById('user-order-history-list');
        if (!container) return;

        if (!Auth.currentUser) {
            container.innerHTML = '<p style="color: var(--color-text-muted);">Please log in to view your order history.</p>';
            return;
        }

        try {
            const orders = await API.getMyOrders();
            if (orders.length === 0) {
                container.innerHTML = '<p style="color: var(--color-text-muted);">You have not placed any orders yet.</p>';
                return;
            }

            container.innerHTML = orders.map(o => `
                <div style="background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <div style="font-weight: 800; font-size: 0.95rem; color: #ffffff;">Order #${o.orderNumber}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted);">${new Date(o.createdAt).toLocaleDateString()} • ${o.items.length} item${o.items.length === 1 ? '' : 's'}</div>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span>
                        <div style="font-weight: 800; margin-top: 4px;">${formatMoney(o.total)}</div>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="App.navigate('order-track', { orderNumber: '${o.orderNumber}' })">
                        Track
                    </button>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<p style="color: var(--color-danger);">Failed to load orders: ${err.message}</p>`;
        }
    }
};
