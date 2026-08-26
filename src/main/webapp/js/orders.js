/**
 * LAZAROPH — Customer Order Tracking & History Module
 * Manual Delivery Tracking & Direct Customer-to-Admin Order Chat Link
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
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #000000; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 16px; color: var(--color-text-secondary); font-weight: 600;">Loading order details for #${orderNumber}...</p>
            </div>
        `;

        try {
            const order = await API.trackOrder(orderNumber);
            this.renderTrackingDetails(container, order);
        } catch (err) {
            container.innerHTML = `
                <div class="container" style="max-width: 600px; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
                    <h2 style="margin-bottom: 8px; color: #000000;">Order Not Found</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">No order matches "<strong>${orderNumber}</strong>". Please verify your Order Number.</p>
                    <button class="btn btn-primary" onclick="Orders.renderLookupForm(document.getElementById('view-order-track'))">Track Another Order</button>
                </div>
            `;
        }
    },

    renderLookupForm(container) {
        container.innerHTML = `
            <div class="container" style="max-width: 580px; padding: 60px 20px;">
                <div class="checkout-section-card" style="text-align: center; border: 1.5px solid #e5e7eb;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">📦</div>
                    <h1 style="font-size: 1.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; color: #000000;">ORDER TRACKING</h1>
                    <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 24px;">
                        Enter your LAZAROPH Order Number to view real-time delivery updates, rider information, and chat with an admin.
                    </p>

                    <form onsubmit="event.preventDefault(); Orders.track(document.getElementById('track-input-id').value);">
                        <div class="form-group">
                            <input type="text" class="form-control" id="track-input-id" required placeholder="LZPH-20260825-0001" style="text-align: center; font-size: 1.1rem; text-transform: uppercase; font-weight: 700; height: 50px; border-color: #000000;">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" style="width: 100%; background: #000000; color: #ffffff; font-weight: 800; padding: 14px;">
                            LOOKUP ORDER STATUS
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    renderTrackingDetails(container, order) {
        const courier = order.courier || 'LALAMOVE';
        const isFeeConfirmed = order.deliveryFeeConfirmed || courier === 'STORE_PICKUP';
        const formattedFee = isFeeConfirmed ? (order.shippingFee && order.shippingFee > 0 ? formatMoney(order.shippingFee) : 'FREE') : 'Delivery Fee: To be Confirmed';

        let courierBadgeHtml = '';
        let courierDetailsHtml = '';

        if (courier === 'LALAMOVE') {
            courierBadgeHtml = `<span class="courier-badge badge-lalamove">🚚 LALAMOVE</span>`;
            courierDetailsHtml = `
                <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-left: 5px solid #d97706; border-radius: 6px; padding: 16px; margin-top: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <div style="font-size: 0.82rem; color: #b45309; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;">
                                🚚 Lalamove Delivery Details
                            </div>
                            <div style="font-size: 0.95rem; font-weight: 700; color: #000000; margin-top: 6px;">
                                ${order.riderName ? `<strong>Rider:</strong> ${order.riderName}` : 'Rider: <em>To be assigned by admin</em>'}
                            </div>
                            ${order.riderPhone ? `<div style="font-size: 0.9rem; color: #1f2937; margin-top: 3px;"><strong>Contact:</strong> ${order.riderPhone}</div>` : ''}
                            ${order.estimatedDeliveryTime ? `<div style="font-size: 0.85rem; color: #4b5563; margin-top: 3px;"><strong>Est. Delivery Time:</strong> ${order.estimatedDeliveryTime}</div>` : ''}
                        </div>
                        <div>
                            <span class="status-pill status-${order.status ? order.status.toLowerCase().replace(/\\s+/g, '-') : 'pending'}" style="font-size: 0.82rem;">
                                ${order.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        } else if (courier === 'LBC') {
            courierBadgeHtml = `<span class="courier-badge badge-lbc">📦 LBC EXPRESS</span>`;
            courierDetailsHtml = `
                <div style="background: #fff5f5; border: 1.5px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 6px; padding: 16px; margin-top: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <div style="font-size: 0.82rem; color: #991b1b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;">
                                📦 LBC Express Shipping Details
                            </div>
                            <div style="font-size: 1rem; font-weight: 800; color: #000000; margin-top: 6px;">
                                ${order.lbcTrackingNumber || order.courierTrackingNumber ? `
                                    LBC Tracking Number: <code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px; color: #000000;">${order.lbcTrackingNumber || order.courierTrackingNumber}</code>
                                ` : 'LBC Tracking Number: <em>Pending dispatch</em>'}
                            </div>
                            ${order.shippingDate ? `<div style="font-size: 0.85rem; color: #1f2937; margin-top: 3px;"><strong>Shipping Date:</strong> ${order.shippingDate}</div>` : ''}
                            ${order.estimatedDeliveryDate ? `<div style="font-size: 0.85rem; color: #1f2937; margin-top: 3px;"><strong>Est. Delivery Date:</strong> ${order.estimatedDeliveryDate}</div>` : ''}
                        </div>
                        <div>
                            <span class="status-pill status-${order.status ? order.status.toLowerCase().replace(/\\s+/g, '-') : 'pending'}" style="font-size: 0.82rem;">
                                ${order.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            courierBadgeHtml = `<span class="courier-badge badge-pickup">🏪 STORE PICKUP</span>`;
            courierDetailsHtml = `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-left: 5px solid #000000; border-radius: 6px; padding: 16px; margin-top: 16px;">
                    <div style="font-size: 0.82rem; color: #0f172a; font-weight: 800; text-transform: uppercase;">
                        🏪 In-Store Claiming Branch
                    </div>
                    <div style="font-size: 1rem; font-weight: 800; color: #000000; margin-top: 4px;">
                        ${order.pickupBranch || 'Branch 1 — Concepcion Uno (911 J.P. Rizal St, Marikina)'}
                    </div>
                    <div style="font-size: 0.85rem; color: #4b5563; margin-top: 4px;">
                        Schedule: Mon–Sun 11:00 AM – 8:00 PM • Store Hotline: 282948572
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="container">
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: #6b7280;">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: #4b5563;">Home</a> / 
                    <span style="color: #000000; font-weight: 600;">Order #${order.orderNumber}</span>
                </div>

                <div class="tracking-card" style="background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                    <!-- Order Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; border-bottom: 1.5px solid #f3f4f6; padding-bottom: 16px;">
                        <div>
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
                                <span class="badge" style="background: #000000; color: #ffffff; font-weight: 800; font-size: 0.75rem; padding: 3px 8px; border-radius: 3px;">LAZAROPH</span>
                                ${courierBadgeHtml}
                            </div>
                            <h1 style="font-size: 1.85rem; font-weight: 900; color: #000000; margin-bottom: 2px;">ORDER #${order.orderNumber}</h1>
                            <div style="color: #6b7280; font-size: 0.85rem;">Submitted on ${new Date(order.createdAt).toLocaleString()}</div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <span class="status-pill status-${order.status ? order.status.toLowerCase().replace(/\\s+/g, '-') : 'pending'}" style="font-size: 0.9rem; padding: 6px 14px; font-weight: 800;">
                                ${order.status}
                            </span>
                            <button class="btn btn-primary btn-sm" onclick="Chat.openOrderChat(${order.id}, '${order.orderNumber}')" style="background: #000000; color: #ffffff; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px;">
                                💬 Chat with Admin
                            </button>
                        </div>
                    </div>

                    <!-- Courier Live Card -->
                    ${courierDetailsHtml}

                    <!-- Delivery Notes (if any) -->
                    ${order.deliveryNotes ? `
                        <div style="margin-top: 14px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                            <div style="font-size: 0.8rem; font-weight: 800; color: #475569; text-transform: uppercase;">Delivery Notes</div>
                            <div style="font-size: 0.88rem; color: #1e293b; margin-top: 2px;">${order.deliveryNotes}</div>
                        </div>
                    ` : ''}

                    <!-- Order Details Grid -->
                    <div class="form-grid-2" style="margin-top: 24px; padding-top: 20px; border-top: 1.5px solid #e5e7eb;">
                        <!-- Left: Customer & Delivery Info -->
                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #000000;">Recipient Information</h4>
                            <div style="font-size: 0.9rem; color: #374151; line-height: 1.6;">
                                <div><strong style="color: #000000;">${order.customerName}</strong></div>
                                <div>📞 ${order.customerPhone}</div>
                                <div>✉️ ${order.customerEmail}</div>
                                <div style="margin-top: 6px;">📍 ${order.shippingAddress}</div>
                                <div>${order.shippingCity}, ${order.shippingProvince} ${order.shippingZip}</div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6;">
                                    Payment Method: <strong style="color: #000000;">${order.paymentMethod}</strong>
                                    ${order.paymentReference ? `<div style="font-size: 0.82rem; color: #4b5563;">Ref #: <strong style="color: #000000;">${order.paymentReference}</strong></div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Right: Product Items & Financials -->
                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #000000;">Purchased Products</h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${order.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 4px;">
                                        <div>
                                            <strong style="color: #000000;">${item.productName}</strong>
                                            <div style="font-size: 0.78rem; color: #6b7280;">Size: ${item.size} • Qty: ${item.quantity}</div>
                                        </div>
                                        <div style="font-weight: 800; color: #000000;">${formatMoney(item.subtotal)}</div>
                                    </div>
                                `).join('')}

                                <div style="border-top: 1.5px solid #e5e7eb; padding-top: 10px; margin-top: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">
                                        <span>Subtotal:</span>
                                        <span style="color: #000000; font-weight: 700;">${formatMoney(order.subtotal)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">
                                        <span>Delivery Fee (${courier}):</span>
                                        <span style="font-weight: 700; color: ${isFeeConfirmed ? '#000000' : '#e11d48'};">
                                            ${formattedFee}
                                        </span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.15rem; color: #000000; margin-top: 8px; border-top: 1.5px solid #000000; padding-top: 8px;">
                                        <span>Total:</span>
                                        <span style="color: #000000; font-weight: 900;">${formatMoney(order.total)}</span>
                                    </div>
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
            container.innerHTML = '<p style="color: var(--color-text-muted);">Please log in to view your orders.</p>';
            return;
        }

        container.innerHTML = '<p style="color: var(--color-text-muted);">Loading your order history...</p>';

        try {
            const orders = typeof API.getUserOrders === 'function' ? await API.getUserOrders() : await API.getMyOrders();

            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <p style="color: var(--color-text-muted); margin-bottom: 16px;">You haven't placed any orders yet.</p>
                        <button class="btn btn-primary" onclick="App.navigate('shop')">Start Shopping</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${orders.map(o => {
                        const courier = o.courier || 'LALAMOVE';
                        const isFeeConfirmed = o.deliveryFeeConfirmed || courier === 'STORE_PICKUP';
                        const feeText = isFeeConfirmed ? (o.shippingFee && o.shippingFee > 0 ? formatMoney(o.shippingFee) : 'FREE') : 'Fee: To be Confirmed';
                        const totalFormatted = formatMoney(o.totalAmount !== undefined ? o.totalAmount : (o.total !== undefined ? o.total : o.subtotal));
                        const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent';
                        const items = o.items || [];

                        let courierBadge = '';
                        if (courier === 'LALAMOVE') courierBadge = '<span class="courier-badge badge-lalamove">🚚 Lalamove</span>';
                        else if (courier === 'LBC') courierBadge = '<span class="courier-badge badge-lbc">📦 LBC Express</span>';
                        else courierBadge = '<span class="courier-badge badge-pickup">🏪 Store Pickup</span>';

                        return `
                            <div class="admin-card" style="padding: 20px; border: 1.5px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                                    <div>
                                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
                                            <strong style="font-size: 1.1rem; color: #000000;">#${o.orderNumber}</strong>
                                            ${courierBadge}
                                            <span style="font-size: 0.78rem; font-weight: 700; color: ${isFeeConfirmed ? '#059669' : '#e11d48'};">(${feeText})</span>
                                        </div>
                                        <div style="font-size: 0.8rem; color: #6b7280;">Placed on ${orderDate}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span class="status-pill status-${o.status ? o.status.toLowerCase().replace(/\\s+/g, '-') : 'pending'}">${o.status || 'Pending'}</span>
                                        <div style="font-size: 1.1rem; font-weight: 900; color: #000000; margin-top: 4px;">${totalFormatted}</div>
                                    </div>
                                </div>

                                <div style="font-size: 0.85rem; color: #374151; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-bottom: 12px;">
                                    ${items.length > 0 ? items.map(it => `${it.productName || 'Authentic Item'} (${it.size || 'Std'}) × ${it.quantity || 1}`).join(' • ') : 'Authentic items'}
                                </div>

                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid #f3f4f6; padding-top: 10px;">
                                    <div style="font-size: 0.82rem; color: #4b5563;">
                                        ${courier === 'LBC' && (o.lbcTrackingNumber || o.courierTrackingNumber) ? 
                                            `LBC Tracking: <strong style="color: #000000;">${o.lbcTrackingNumber || o.courierTrackingNumber}</strong>` : 
                                            (courier === 'LALAMOVE' && o.riderName ? `Rider: <strong style="color: #000000;">${o.riderName}</strong> (${o.riderPhone || 'No phone'})` : `Method: ${courier}`)
                                        }
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-secondary btn-sm" style="color: #000000; font-weight: 700; border: 1px solid #d1d5db;" onclick="Orders.track('${o.orderNumber}')">
                                            View Details →
                                        </button>
                                        <button class="btn btn-primary btn-sm" style="background: #000000; color: #ffffff; font-weight: 700; border: none;" onclick="Chat.openOrderChat(${o.id}, '${o.orderNumber}')">
                                            💬 Chat with Admin
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            container.innerHTML = `
                <div style="text-align: center; color: #dc2626; padding: 24px; background: #ffffff; border: 1px solid #fee2e2; border-radius: 6px;">
                    <p style="margin-bottom: 8px;">Failed to load orders: ${err.message}</p>
                    <button class="btn btn-secondary btn-sm" onclick="Orders.loadUserOrders()">🔄 Retry</button>
                </div>
            `;
        }
    }
};
