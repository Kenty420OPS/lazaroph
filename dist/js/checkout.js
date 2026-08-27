/**
 * LAZAROPH — Online Payments & Manual Delivery Checkout Module
 * Manual Delivery Selection: Lalamove, LBC Express, and Store Pickup
 */

const Checkout = {
    selectedPaymentMethod: 'GCash',
    selectedCourier: 'LALAMOVE',
    selectedPickupBranch: 'Concepcion Uno, Marikina (911 J.P. Rizal St)',
    storeSettings: {},

    async init() {
        await Cart.refresh();
        try {
            this.storeSettings = await API.getStoreSettings();
        } catch (ignored) {}

        this.render();
    },

    selectCourier(courier) {
        this.selectedCourier = courier;

        // Adjust UI visibility for pickup vs delivery
        const deliveryFields = document.getElementById('shipping-address-container');
        const pickupFields = document.getElementById('pickup-branch-container');

        if (deliveryFields && pickupFields) {
            if (courier === 'STORE_PICKUP') {
                deliveryFields.style.display = 'none';
                pickupFields.style.display = 'block';
            } else {
                deliveryFields.style.display = 'block';
                pickupFields.style.display = 'none';
            }
        }

        // Update courier cards active class
        document.querySelectorAll('.courier-option-card').forEach(c => {
            if (c.getAttribute('data-courier') === courier) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });

        this.updateOrderSummary();
    },

    updateOrderSummary() {
        const cart = Cart.cartData;
        const subtotal = parseFloat(cart.subtotal) || 0;

        const feeElem = document.getElementById('summary-shipping-fee');
        const courierElem = document.getElementById('summary-courier-name');
        const totalElem = document.getElementById('summary-grand-total');
        const btnElem = document.getElementById('btn-place-order');

        if (courierElem) {
            if (this.selectedCourier === 'LALAMOVE') courierElem.textContent = 'Lalamove Delivery';
            else if (this.selectedCourier === 'LBC') courierElem.textContent = 'LBC Express';
            else courierElem.textContent = 'Store Pickup (Marikina)';
        }

        if (feeElem) {
            if (this.selectedCourier === 'STORE_PICKUP') {
                feeElem.textContent = 'FREE';
                feeElem.style.color = 'var(--color-success)';
            } else {
                feeElem.textContent = 'To be Confirmed';
                feeElem.style.color = '#e11d48';
            }
        }

        if (totalElem) {
            totalElem.innerHTML = `${formatMoney(subtotal)} <span style="font-size: 0.8rem; font-weight: 500; color: #6b7280;">(${this.selectedCourier === 'STORE_PICKUP' ? 'Free Pickup' : '+ Delivery Fee TBD'})</span>`;
        }

        if (btnElem) {
            btnElem.textContent = `SUBMIT ORDER (${formatMoney(subtotal)})`;
        }
    },

    render() {
        const container = document.getElementById('view-checkout');
        if (!container) return;

        const cart = Cart.cartData;
        const items = cart.items || [];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <h2 style="margin-bottom: 12px; color: #000000;">Your Cart is Empty</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">Please add some authentic items to your cart before proceeding to checkout.</p>
                    <button class="btn btn-primary" onclick="App.navigate('shop')">Browse Products</button>
                </div>
            `;
            return;
        }

        const user = Auth.currentUser || {};
        const subtotal = parseFloat(cart.subtotal) || 0;

        container.innerHTML = `
            <div class="container">
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: var(--color-text-muted);">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: var(--color-text-secondary);">Home</a> / 
                    <span style="color: #000000; font-weight: 600;">Secure Checkout</span>
                </div>

                <div class="section-header" style="margin-bottom: 28px;">
                    <div>
                        <div class="section-subtitle">MANUAL DELIVERY & ORDER VERIFICATION</div>
                        <h1 class="section-title" style="color: #000000;">SECURE ONLINE CHECKOUT</h1>
                    </div>
                </div>

                <form id="checkout-form" onsubmit="Checkout.submitOrder(event)">
                    <div class="checkout-layout">
                        <!-- Left: Customer Information, Logistics & Delivery Address -->
                        <div>
                            <!-- 1. Customer Details -->
                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; margin-bottom: 18px; color: #000000; display: flex; align-items: center; gap: 8px;">
                                    <span class="step-num">1</span> Contact & Customer Details
                                </h3>
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">Full Name *</label>
                                        <input type="text" class="form-control" id="checkout-name" required value="${user.name || ''}" placeholder="Juan Dela Cruz">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">Email Address *</label>
                                        <input type="email" class="form-control" id="checkout-email" required value="${user.email || ''}" placeholder="juan@example.com">
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label" style="color: #000000; font-weight: 700;">Mobile Number (for Delivery / Confirmation Calls) *</label>
                                    <input type="tel" class="form-control" id="checkout-phone" required value="${user.phone || ''}" placeholder="09171234567">
                                    <span style="font-size: 0.75rem; color: #4b5563; margin-top: 4px; display: block;">
                                        LAZAROPH or the delivery rider will contact this number regarding your order.
                                    </span>
                                </div>
                            </div>

                            <!-- 2. Delivery Method Section -->
                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; color: #000000; display: flex; align-items: center; gap: 8px;">
                                    <span class="step-num">2</span> Delivery Method
                                </h3>
                                <p style="font-size: 0.85rem; color: #4b5563; margin-bottom: 18px;">
                                    Please select your preferred delivery or claiming method. The customer can select only one method.
                                </p>

                                <!-- 3 Manual Delivery Selection Cards -->
                                <div class="courier-options-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                                    
                                    <!-- 1. Lalamove Card -->
                                    <div class="courier-option-card ${this.selectedCourier === 'LALAMOVE' ? 'active' : ''}"
                                         data-courier="LALAMOVE"
                                         onclick="Checkout.selectCourier('LALAMOVE')">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                                <div class="courier-icon-box" style="font-size: 1.5rem;">🚚</div>
                                                <div>
                                                    <div style="display: flex; gap: 8px; align-items: center;">
                                                        <strong style="color: #000000; font-size: 1.05rem;">Lalamove</strong>
                                                        <span class="courier-badge badge-lalamove">SAME-DAY DELIVERY</span>
                                                    </div>
                                                    <div style="font-size: 0.84rem; color: #374151; margin-top: 6px; line-height: 1.45;">
                                                        Your order will be delivered through Lalamove. The delivery fee will be confirmed by LAZAROPH after your order is submitted.
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="text-align: right; min-width: 100px;">
                                                <span style="font-size: 0.8rem; font-weight: 700; color: #e11d48; background: #ffe4e6; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                                                    Fee: To be Confirmed
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 2. LBC Express Card -->
                                    <div class="courier-option-card ${this.selectedCourier === 'LBC' ? 'active' : ''}"
                                         data-courier="LBC"
                                         onclick="Checkout.selectCourier('LBC')">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                                <div class="courier-icon-box" style="font-size: 1.5rem;">📦</div>
                                                <div>
                                                    <div style="display: flex; gap: 8px; align-items: center;">
                                                        <strong style="color: #000000; font-size: 1.05rem;">LBC Express</strong>
                                                        <span class="courier-badge badge-lbc">NATIONWIDE SHIPPING</span>
                                                    </div>
                                                    <div style="font-size: 0.84rem; color: #374151; margin-top: 6px; line-height: 1.45;">
                                                        Your order will be shipped through LBC Express. The shipping fee and tracking information will be confirmed by LAZAROPH after your order is submitted.
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="text-align: right; min-width: 100px;">
                                                <span style="font-size: 0.8rem; font-weight: 700; color: #e11d48; background: #ffe4e6; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                                                    Fee: To be Confirmed
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 3. Store Pickup Card -->
                                    <div class="courier-option-card ${this.selectedCourier === 'STORE_PICKUP' ? 'active' : ''}"
                                         data-courier="STORE_PICKUP"
                                         onclick="Checkout.selectCourier('STORE_PICKUP')">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                                <div class="courier-icon-box" style="font-size: 1.5rem;">🏪</div>
                                                <div>
                                                    <div style="display: flex; gap: 8px; align-items: center;">
                                                        <strong style="color: #000000; font-size: 1.05rem;">Store Pickup</strong>
                                                        <span class="courier-badge badge-pickup">FREE CLAIMING</span>
                                                    </div>
                                                    <div style="font-size: 0.84rem; color: #374151; margin-top: 6px; line-height: 1.45;">
                                                        Your order will be prepared for pickup. LAZAROPH will contact you when your order is ready.
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="text-align: right; min-width: 100px;">
                                                <span style="font-size: 0.9rem; font-weight: 800; color: var(--color-success); background: #ecfdf5; padding: 4px 10px; border-radius: 4px; display: inline-block;">
                                                    FREE
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <!-- Delivery Address Fields (Shown for Lalamove & LBC) -->
                                <div id="shipping-address-container" style="display: ${this.selectedCourier === 'STORE_PICKUP' ? 'none' : 'block'}; background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: var(--radius-md); padding: 18px; margin-top: 10px;">
                                    <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 14px; color: #000000;">
                                        📍 Shipping / Delivery Destination
                                    </h4>

                                    <div class="form-grid-3">
                                        <div class="form-group">
                                            <label class="form-label" style="color: #000000; font-weight: 700;">City / Municipality *</label>
                                            <input type="text" class="form-control" id="checkout-city" required value="${user.city || 'Marikina'}" placeholder="Marikina">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label" style="color: #000000; font-weight: 700;">Province / Region *</label>
                                            <input type="text" class="form-control" id="checkout-province" required value="${user.province || 'Metro Manila'}" placeholder="Metro Manila">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label" style="color: #000000; font-weight: 700;">ZIP Code *</label>
                                            <input type="text" class="form-control" id="checkout-zip" required value="${user.zipCode || '1805'}" placeholder="1805">
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">House / Unit No., Building, Street Name, Barangay *</label>
                                        <input type="text" class="form-control" id="checkout-address" required value="${user.address || ''}" placeholder="e.g. 911 J.P. Rizal St., Concepcion Uno">
                                    </div>

                                    <div class="form-group" style="margin-top: 14px; margin-bottom: 0;">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">Delivery Notes & Special Instructions (Optional)</label>
                                        <textarea class="form-control" id="checkout-notes" style="min-height: 55px;" placeholder="e.g. Near church landmark, please call before arriving..."></textarea>
                                    </div>
                                </div>

                                <!-- Marikina Branch Selection (Shown only for Store Pickup) -->
                                <div id="pickup-branch-container" style="display: ${this.selectedCourier === 'STORE_PICKUP' ? 'block' : 'none'}; background: #f8fafc; border: 1.5px solid #cbd5e1; border-left: 4px solid #000000; border-radius: var(--radius-md); padding: 18px; margin-top: 10px;">
                                    <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #000000;">
                                        🏪 Select Preferred Marikina Claiming Hub
                                    </h4>
                                    <div class="form-group" style="margin-bottom: 8px;">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">Pickup Hub Location *</label>
                                        <select class="form-control" id="checkout-pickup-branch" onchange="Checkout.selectedPickupBranch = this.value">
                                            <option value="Concepcion Uno, Marikina (911 J.P. Rizal St)">LAZAROPH Store — Concepcion Uno (911 J.P. Rizal St, Marikina)</option>
                                        </select>
                                    </div>
                                    <div style="font-size: 0.82rem; color: #4b5563; line-height: 1.5;">
                                        Store Hours: <strong style="color: #000000;">Mon–Sun 11:00 AM – 8:00 PM</strong> • Hotline: <strong style="color: #000000;">282948572</strong><br>
                                        We will send you a message on the chat and SMS once your items are prepared and ready for claiming.
                                    </div>
                                </div>
                            </div>

                            <!-- 3. Payment Section -->
                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; color: #000000; display: flex; align-items: center; gap: 8px;">
                                    <span class="step-num">3</span> Payment Method
                                </h3>
                                <p style="font-size: 0.85rem; color: #4b5563; margin-bottom: 16px;">
                                    Select your preferred payment channel for order settlement:
                                </p>

                                <div class="payment-options-grid">
                                    <label class="payment-option-card active" onclick="Checkout.selectPayment('GCash', this)">
                                        <input type="radio" name="payment_method" value="GCash" checked>
                                        <div class="payment-option-info">
                                            <div class="name">📱 GCash</div>
                                            <div class="desc">Scan or send to 0917-282-9485</div>
                                        </div>
                                    </label>
                                    <label class="payment-option-card" onclick="Checkout.selectPayment('Maya', this)">
                                        <input type="radio" name="payment_method" value="Maya">
                                        <div class="payment-option-info">
                                            <div class="name">💳 Maya / QR Ph</div>
                                            <div class="desc">Send to 0917-282-9485</div>
                                        </div>
                                    </label>
                                    <label class="payment-option-card" onclick="Checkout.selectPayment('Bank Transfer', this)">
                                        <input type="radio" name="payment_method" value="Bank Transfer">
                                        <div class="payment-option-info">
                                            <div class="name">🏦 Bank Transfer</div>
                                            <div class="desc">BDO or BPI Online / QR Ph</div>
                                        </div>
                                    </label>
                                    <label class="payment-option-card" onclick="Checkout.selectPayment('Store Pickup', this)">
                                        <input type="radio" name="payment_method" value="Store Pickup">
                                        <div class="payment-option-info">
                                            <div class="name">🏪 Cash on Store Pickup</div>
                                            <div class="desc">Pay at physical branch cashier</div>
                                        </div>
                                    </label>
                                </div>

                                <!-- Payment Account Details & Reference Entry Box -->
                                <div id="payment-instructions-box" style="margin-top: 20px; padding: 18px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: var(--radius-md);">
                                    <div style="font-weight: 800; color: #000000; font-size: 1rem; margin-bottom: 8px;" id="pay-instruction-title">
                                        📱 GCash Payment Instructions
                                    </div>
                                    <div style="font-size: 0.88rem; color: #374151; line-height: 1.6; margin-bottom: 16px;" id="pay-instruction-text">
                                        Please transfer order amount to:<br>
                                        Account Name: <strong style="color: #000000;">LAZAROPH PHILIPPINES</strong><br>
                                        GCash Number: <strong style="color: #000000; font-size: 1.1rem;">0917-282-9485</strong>
                                    </div>

                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label class="form-label" style="color: #000000; font-weight: 700;">Payment Reference Number / Transaction ID *</label>
                                        <input type="text" class="form-control" id="checkout-ref-no" required placeholder="e.g. 100293847291 or BDO-REF-88392" style="border-color: #000000; font-weight: 700;">
                                        <span style="font-size: 0.75rem; color: #4b5563; margin-top: 4px; display: block;">
                                            Our dispatch team verifies this payment reference prior to dispatching your items.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Order Summary Sidebar -->
                        <div>
                            <div class="checkout-section-card" style="position: sticky; top: calc(var(--header-height) + 20px);">
                                <h3 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; margin-bottom: 18px; color: #000000;">
                                    Order Summary (${cart.totalQuantity} items)
                                </h3>

                                <div style="display: flex; flex-direction: column; gap: 14px; max-height: 280px; overflow-y: auto; margin-bottom: 18px; padding-right: 4px;">
                                    ${items.map(item => `
                                        <div style="display: flex; gap: 12px; align-items: center;">
                                            <img src="${item.imageUrl}" style="width: 48px; height: 48px; object-fit: contain; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px;" onerror="this.src='images/placeholder-product.png'">
                                            <div style="flex-grow: 1;">
                                                <div style="font-size: 0.88rem; font-weight: 700; color: #000000;">${item.productName}</div>
                                                <div style="font-size: 0.75rem; color: #4b5563;">Size: ${item.size} • Qty: ${item.quantity}</div>
                                            </div>
                                            <div style="font-weight: 800; font-size: 0.95rem; color: #000000;">${formatMoney(item.subtotal)}</div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div style="border-top: 1.5px solid #e5e7eb; padding-top: 14px;">
                                    <div class="cart-summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="color: #4b5563; font-weight: 600;">Subtotal</span>
                                        <span style="color: #000000; font-weight: 700;">${formatMoney(subtotal)}</span>
                                    </div>
                                    <div class="cart-summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span id="summary-courier-name" style="color: #4b5563; font-weight: 600;">Lalamove Delivery</span>
                                        <span id="summary-shipping-fee" style="color: #e11d48; font-weight: 700;">To be Confirmed</span>
                                    </div>
                                    <div class="cart-summary-total" style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid #000000; padding-top: 12px; margin-top: 10px; margin-bottom: 16px;">
                                        <span style="color: #000000; font-weight: 800; font-size: 1.05rem;">Total Amount</span>
                                        <span id="summary-grand-total" style="color: #000000; font-weight: 900; font-size: 1.25rem;">${formatMoney(subtotal)}</span>
                                    </div>

                                    <button type="submit" class="btn btn-primary btn-lg btn-block" id="btn-place-order" style="width: 100%; padding: 14px; background: #000000; color: #ffffff; font-weight: 800; font-size: 0.95rem; border: none; border-radius: 4px; cursor: pointer;">
                                        SUBMIT ORDER (${formatMoney(subtotal)})
                                    </button>

                                    <div style="margin-top: 14px; text-align: center; font-size: 0.75rem; color: #6b7280; line-height: 1.4;">
                                        💬 You can chat directly with LAZAROPH admin anytime after submitting your order to confirm delivery and rider details.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.selectPayment(this.selectedPaymentMethod);
        this.updateOrderSummary();
    },

    selectPayment(method, cardElem) {
        this.selectedPaymentMethod = method;

        document.querySelectorAll('.payment-option-card').forEach(c => c.classList.remove('active'));
        if (cardElem) cardElem.classList.add('active');

        const title = document.getElementById('pay-instruction-title');
        const text = document.getElementById('pay-instruction-text');
        const refInp = document.getElementById('checkout-ref-no');

        if (!title || !text || !refInp) return;

        const s = this.storeSettings || {};
        const gcashNum = s.gcashNumber || '0917-282-9485';
        const gcashName = s.gcashName || 'LAZAROPH PHILIPPINES';
        const gcashQr = s.gcashQrUrl || 'images/qr-gcash-demo.png';

        const mayaNum = s.mayaNumber || '0917-282-9485';
        const mayaName = s.mayaName || 'LAZAROPH PHILIPPINES';
        const mayaQr = s.mayaQrUrl || 'images/qr-maya-demo.png';

        if (method === 'GCash') {
            title.textContent = '📱 GCash QR & Mobile Payment';
            text.innerHTML = `
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <img src="${gcashQr}" style="width: 120px; height: 120px; object-fit: contain; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px;" onerror="this.style.display='none'">
                    <div>
                        <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">Option 1: Scan QR Code with GCash App</div>
                        <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">Option 2: Send to GCash Mobile:</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: #000000;">${gcashNum}</div>
                        <div style="font-size: 0.82rem; color: #111827;">Account: <strong>${gcashName}</strong></div>
                    </div>
                </div>
            `;
            refInp.placeholder = 'e.g. GCash Ref # 100293847291';
            refInp.required = true;
        } else if (method === 'Maya') {
            title.textContent = '💳 Maya / QR Ph Payment';
            text.innerHTML = `
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <img src="${mayaQr}" style="width: 120px; height: 120px; object-fit: contain; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px;" onerror="this.style.display='none'">
                    <div>
                        <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">Option 1: Scan QR Ph with Maya App</div>
                        <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 4px;">Option 2: Send to Maya Number:</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: #000000;">${mayaNum}</div>
                        <div style="font-size: 0.82rem; color: #111827;">Account: <strong>${mayaName}</strong></div>
                    </div>
                </div>
            `;
            refInp.placeholder = 'e.g. Maya Ref # MAYA-99201948';
            refInp.required = true;
        } else if (method === 'Bank Transfer') {
            title.textContent = '🏦 Direct Bank Transfer (BDO & BPI QR Ph)';
            text.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
                    <!-- BDO Card -->
                    <div style="display: flex; gap: 14px; align-items: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;">
                        ${s.bdoQrUrl ? `<img src="${s.bdoQrUrl}" style="width: 65px; height: 65px; object-fit: contain; background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px;" alt="BDO QR">` : '<div style="font-size: 1.5rem; width: 44px; text-align: center;">🏦</div>'}
                        <div>
                            <div style="font-weight: 800; color: #003882; font-size: 0.92rem;">BDO Unibank (Scan / Transfer)</div>
                            <div style="font-size: 1rem; font-weight: 900; color: #000000; letter-spacing: 0.02em;">${s.bdoAccount || '0012-3456-7890 (Lazaro PH)'}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">BDO Savings Account / QR Ph</div>
                        </div>
                    </div>

                    <!-- BPI Card -->
                    <div style="display: flex; gap: 14px; align-items: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;">
                        ${s.bpiQrUrl ? `<img src="${s.bpiQrUrl}" style="width: 65px; height: 65px; object-fit: contain; background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px;" alt="BPI QR">` : '<div style="font-size: 1.5rem; width: 44px; text-align: center;">🏦</div>'}
                        <div>
                            <div style="font-weight: 800; color: #b11116; font-size: 0.92rem;">BPI — Bank of the Philippine Islands</div>
                            <div style="font-size: 1rem; font-weight: 900; color: #000000; letter-spacing: 0.02em;">${s.bpiAccount || '9876-5432-10 (Lazaro PH)'}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">BPI Savings Account / QR Ph</div>
                        </div>
                    </div>
                </div>
            `;
            refInp.placeholder = 'e.g. BDO/BPI Confirmation # or Deposit Ref';
            refInp.required = true;
        } else if (method === 'Store Pickup') {
            title.textContent = '🏪 Store Pickup & Pay at Branch';
            text.innerHTML = `
                <div style="color: #374151;">
                    Pickup at LAZAROPH Store in <strong style="color: #000000;">Concepcion Uno</strong> (911 J.P. Rizal St., Marikina).<br>
                    You may pay cash upon claiming your order at the store cashier.
                </div>
            `;
            refInp.placeholder = 'Claiming note (e.g. Pickup date or time)';
            refInp.required = false;
        }
    },

    async submitOrder(e) {
        e.preventDefault();

        const btn = document.getElementById('btn-place-order');

        // Customer Email Verification Security Check: Must be verified to place orders
        if (typeof CustomerAuth !== 'undefined' && CustomerAuth.isLoggedIn() && !CustomerAuth.isEmailVerified()) {
            showToast('Email verification required: Please verify your email address before placing an order.', 'error');
            if (btn) {
                btn.disabled = false;
                this.updateOrderSummary();
            }
            App.navigate('verify-pending');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Submitting Order...';
        }

        const name = document.getElementById('checkout-name').value;
        const email = document.getElementById('checkout-email').value;
        const phone = document.getElementById('checkout-phone').value;

        let address = '';
        let city = 'Marikina';
        let province = 'Metro Manila';
        let zip = '1805';

        if (this.selectedCourier === 'STORE_PICKUP') {
            address = `Store Pickup at ${this.selectedPickupBranch}`;
        } else {
            address = document.getElementById('checkout-address') ? document.getElementById('checkout-address').value : '';
            city = document.getElementById('checkout-city') ? document.getElementById('checkout-city').value : 'Marikina';
            province = document.getElementById('checkout-province') ? document.getElementById('checkout-province').value : 'Metro Manila';
            zip = document.getElementById('checkout-zip') ? document.getElementById('checkout-zip').value : '1805';
        }

        const notes = document.getElementById('checkout-notes') ? document.getElementById('checkout-notes').value : '';
        const refNo = document.getElementById('checkout-ref-no') ? document.getElementById('checkout-ref-no').value : '';

        try {
            const order = await API.checkout({
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                shippingAddress: address,
                shippingCity: city,
                shippingProvince: province,
                shippingZip: zip,
                paymentMethod: this.selectedPaymentMethod,
                paymentReference: refNo,
                notes: notes,
                courier: this.selectedCourier,
                pickupBranch: this.selectedPickupBranch
            });

            await Cart.refresh();
            showToast(`Order submitted successfully! (#${order.orderNumber})`, 'success');
            
            // Navigate to order details and notify user about chat
            App.navigate('order-track', { orderNumber: order.orderNumber });

            // Refresh chat widget so conversation is ready
            if (window.Chat) {
                Chat.checkUnread();
            }
        } catch (err) {
            showToast(err.message, 'error');
            if (btn) {
                btn.disabled = false;
                this.updateOrderSummary();
            }
        }
    }
};
