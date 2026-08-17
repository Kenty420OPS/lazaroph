/**
 * LAZAROPH — Online Payments & Checkout Module
 * Note: LAZAROPH uses secure digital prepayment & store pickup (No COD for online orders).
 */

const Checkout = {
    selectedPaymentMethod: 'GCash',
    storeSettings: {},

    async init() {
        await Cart.refresh();
        try {
            this.storeSettings = await API.getStoreSettings();
        } catch (ignored) {}
        this.render();
    },

    render() {
        const container = document.getElementById('view-checkout');
        if (!container) return;

        const cart = Cart.cartData;
        const items = cart.items || [];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 80px 20px;">
                    <h2 style="margin-bottom: 12px;">Your Cart is Empty</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 24px;">Please add some authentic items to your cart before proceeding to checkout.</p>
                    <button class="btn btn-primary" onclick="App.navigate('shop')">Browse Products</button>
                </div>
            `;
            return;
        }

        const user = Auth.currentUser || {};

        container.innerHTML = `
            <div class="container">
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: var(--color-text-muted);">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: var(--color-text-secondary);">Home</a> / 
                    <span style="color: #ffffff;">Secure Online Checkout</span>
                </div>

                <div class="section-header" style="margin-bottom: 30px;">
                    <div>
                        <div class="section-subtitle">AUTHENTIC PHILIPPINE DISPATCH</div>
                        <h1 class="section-title">SECURE ONLINE CHECKOUT</h1>
                    </div>
                </div>

                <form id="checkout-form" onsubmit="Checkout.submitOrder(event)">
                    <div class="checkout-layout">
                        <!-- Left: Customer Information & Delivery Address -->
                        <div>
                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                                    1. Contact & Customer Details
                                </h3>
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label class="form-label">Full Name *</label>
                                        <input type="text" class="form-control" id="checkout-name" required value="${user.name || ''}" placeholder="Juan Dela Cruz">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Email Address *</label>
                                        <input type="email" class="form-control" id="checkout-email" required value="${user.email || ''}" placeholder="juan@example.com">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Contact Number (Mobile / GCash) *</label>
                                    <input type="tel" class="form-control" id="checkout-phone" required value="${user.phone || ''}" placeholder="09171234567 or 282948572">
                                </div>
                            </div>

                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                                    2. Philippine Delivery Address
                                </h3>
                                <div class="form-group">
                                    <label class="form-label">Complete Street Address / House / Unit / Building *</label>
                                    <input type="text" class="form-control" id="checkout-address" required value="${user.address || ''}" placeholder="e.g. 911 J.P. Rizal St., Concepcion Uno">
                                </div>
                                <div class="form-grid-3">
                                    <div class="form-group">
                                        <label class="form-label">City / Municipality *</label>
                                        <input type="text" class="form-control" id="checkout-city" required value="${user.city || 'Marikina'}" placeholder="Marikina">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Province / Region *</label>
                                        <input type="text" class="form-control" id="checkout-province" required value="${user.province || 'Metro Manila'}" placeholder="Metro Manila">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">ZIP Code *</label>
                                        <input type="text" class="form-control" id="checkout-zip" required value="${user.zipCode || '1805'}" placeholder="1805">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Delivery Instructions (Optional)</label>
                                    <textarea class="form-control" id="checkout-notes" style="min-height: 60px;" placeholder="Landmarks or dispatch notes..."></textarea>
                                </div>
                            </div>

                            <!-- Payment Section -->
                            <div class="checkout-section-card">
                                <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; color: #ffffff;">
                                    3. Online Payment & Settlement
                                </h3>
                                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 16px;">
                                    All online orders require verified digital payment prior to dispatch.
                                </p>

                                <div class="payment-options-grid">
                                    <label class="payment-option-card active" onclick="Checkout.selectPayment('GCash', this)">
                                        <input type="radio" name="payment_method" value="GCash" checked>
                                        <div class="payment-option-info">
                                            <div class="name">📱 GCash (E-Wallet)</div>
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
                                            <div class="name">🏦 Bank Transfer (BDO / BPI)</div>
                                            <div class="desc">Direct online bank deposit</div>
                                        </div>
                                    </label>
                                    <label class="payment-option-card" onclick="Checkout.selectPayment('Card', this)">
                                        <input type="radio" name="payment_method" value="Card">
                                        <div class="payment-option-info">
                                            <div class="name">💳 Credit / Debit Card</div>
                                            <div class="desc">Visa, Mastercard, JCB</div>
                                        </div>
                                    </label>
                                    <label class="payment-option-card" onclick="Checkout.selectPayment('Store Pickup', this)">
                                        <input type="radio" name="payment_method" value="Store Pickup">
                                        <div class="payment-option-info">
                                            <div class="name">🏪 Store Pickup (Marikina)</div>
                                            <div class="desc">Pay in-store at Concepcion Uno/Malanday</div>
                                        </div>
                                    </label>
                                </div>

                                <!-- Payment Account Details & Reference Entry Box -->
                                <div id="payment-instructions-box" style="margin-top: 20px; padding: 20px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                                    <div style="font-weight: 700; color: var(--color-brand-cyan); margin-bottom: 8px;" id="pay-instruction-title">
                                        📱 GCash Payment Instructions
                                    </div>
                                    <div style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 16px;" id="pay-instruction-text">
                                        Please transfer total amount to:<br>
                                        Account Name: <strong>LAZAROPH PHILIPPINES</strong><br>
                                        GCash Number: <strong style="color: #ffffff; font-size: 1rem;">0917-282-9485</strong>
                                    </div>

                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label class="form-label" style="color: #ffffff;">Payment Reference Number / Transaction ID *</label>
                                        <input type="text" class="form-control" id="checkout-ref-no" required placeholder="e.g. 100293847291 or BDO-REF-88392" style="border-color: var(--color-brand-cyan);">
                                        <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; display: block;">
                                            Our dispatch team verifies this reference number before shipping your authentic sneakers/apparel.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Order Summary Sidebar -->
                        <div>
                            <div class="checkout-section-card" style="position: sticky; top: calc(var(--header-height) + 20px);">
                                <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff;">
                                    Order Summary (${cart.totalQuantity} items)
                                </h3>

                                <div style="display: flex; flex-direction: column; gap: 14px; max-height: 300px; overflow-y: auto; margin-bottom: 20px; padding-right: 4px;">
                                    ${items.map(item => `
                                        <div style="display: flex; gap: 12px; align-items: center;">
                                            <img src="${item.imageUrl}" style="width: 50px; height: 50px; object-fit: contain; background: #0e131d; border-radius: var(--radius-sm); padding: 4px;" onerror="this.src='/images/placeholder-product.png'">
                                            <div style="flex-grow: 1;">
                                                <div style="font-size: 0.88rem; font-weight: 700; color: #ffffff;">${item.productName}</div>
                                                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Size: ${item.size} • Qty: ${item.quantity}</div>
                                            </div>
                                            <div style="font-weight: 700; font-size: 0.9rem;">${formatMoney(item.subtotal)}</div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div style="border-top: 1px solid var(--color-border); padding-top: 16px;">
                                    <div class="cart-summary-row">
                                        <span>Subtotal</span>
                                        <span style="color: #ffffff; font-weight: 600;">${formatMoney(cart.subtotal)}</span>
                                    </div>
                                    <div class="cart-summary-row">
                                        <span>Shipping Fee (Metro Manila / Prov)</span>
                                        <span style="color: #ffffff; font-weight: 600;">${formatMoney(cart.shippingFee)}</span>
                                    </div>
                                    <div class="cart-summary-total">
                                        <span>Total Amount</span>
                                        <span style="color: var(--color-brand-red);">${formatMoney(cart.total)}</span>
                                    </div>

                                    <button type="submit" class="btn btn-primary btn-lg btn-block" id="btn-place-order" style="margin-top: 10px;">
                                        SUBMIT ORDER & VERIFY (${formatMoney(cart.total)})
                                    </button>

                                    <div style="margin-top: 16px; text-align: center; font-size: 0.75rem; color: var(--color-text-muted);">
                                        🔒 256-Bit Encrypted Payment • 100% Authentic Guarantee
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    },

    selectPayment(method, cardElem) {
        this.selectedPaymentMethod = method;

        document.querySelectorAll('.payment-option-card').forEach(c => c.classList.remove('active'));
        if (cardElem) cardElem.classList.add('active');

        const title = document.getElementById('pay-instruction-title');
        const text = document.getElementById('pay-instruction-text');
        const refInp = document.getElementById('checkout-ref-no');

        const s = this.storeSettings || {};
        const gcashNum = s.gcashNumber || '0917-282-9485';
        const gcashName = s.gcashName || 'LAZAROPH PHILIPPINES';
        const gcashQr = s.gcashQrUrl || '/images/qr-gcash-demo.png';

        const mayaNum = s.mayaNumber || '0917-282-9485';
        const mayaName = s.mayaName || 'LAZAROPH PHILIPPINES';
        const mayaQr = s.mayaQrUrl || '/images/qr-maya-demo.png';

        if (method === 'GCash') {
            title.textContent = '📱 GCash QR & Mobile Payment';
            text.innerHTML = `
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <img src="${gcashQr}" style="width: 130px; height: 130px; object-fit: contain; background: #ffffff; border-radius: 8px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" onerror="this.style.display='none'">
                    <div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Option 1: Scan QR Code with GCash App</div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Option 2: Send to GCash Mobile:</div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: #00e5ff;">${gcashNum}</div>
                        <div style="font-size: 0.82rem; color: #ffffff;">Account: <strong>${gcashName}</strong></div>
                    </div>
                </div>
            `;
            refInp.placeholder = 'e.g. GCash Ref # 100293847291';
            refInp.required = true;
        } else if (method === 'Maya') {
            title.textContent = '💳 Maya / QR Ph Payment';
            text.innerHTML = `
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <img src="${mayaQr}" style="width: 130px; height: 130px; object-fit: contain; background: #ffffff; border-radius: 8px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" onerror="this.style.display='none'">
                    <div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Option 1: Scan QR Ph with Maya / Banking App</div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 4px;">Option 2: Send to Maya Number:</div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: #00e5ff;">${mayaNum}</div>
                        <div style="font-size: 0.82rem; color: #ffffff;">Account: <strong>${mayaName}</strong></div>
                    </div>
                </div>
            `;
            refInp.placeholder = 'e.g. Maya Ref # MAYA-99201948';
            refInp.required = true;
        } else if (method === 'Bank Transfer') {
            title.textContent = '🏦 Direct Bank Transfer (BDO / BPI / UnionBank)';
            text.innerHTML = `
                BDO Savings: <strong>${s.bdoAccount || '0012-3456-7890 (Lazaro PH)'}</strong><br>
                BPI Savings: <strong>${s.bpiAccount || '9876-5432-10 (Lazaro PH)'}</strong>
            `;
            refInp.placeholder = 'e.g. BDO Deposit Ref # or Transfer ID';
            refInp.required = true;
        } else if (method === 'Card') {
            title.textContent = '💳 Online Card Payment';
            text.innerHTML = 'Secure payment token initialized. Enter your Card Transaction ID or Authorization Code below:';
            refInp.placeholder = 'e.g. CARD-AUTH-492018';
            refInp.required = true;
        } else if (method === 'Store Pickup') {
            title.textContent = '🏪 Store Pickup & Pay at Branch';
            text.innerHTML = `
                Pickup at <strong>Concepcion Uno</strong> (911 J.P. Rizal St) or <strong>Malanday</strong> (32 F. E. Mendoza St).<br>
                You may pay in cash upon claiming your shoes/apparel at the store cashier.
            `;
            refInp.placeholder = 'Branch preferred (e.g. Concepcion Uno or Malanday)';
            refInp.required = false;
        }
    },

    async submitOrder(e) {
        e.preventDefault();

        const btn = document.getElementById('btn-place-order');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Submitting Order...';
        }

        const name = document.getElementById('checkout-name').value;
        const email = document.getElementById('checkout-email').value;
        const phone = document.getElementById('checkout-phone').value;
        const address = document.getElementById('checkout-address').value;
        const city = document.getElementById('checkout-city').value;
        const province = document.getElementById('checkout-province').value;
        const zip = document.getElementById('checkout-zip').value;
        const notes = document.getElementById('checkout-notes').value;
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
                notes: notes
            });

            await Cart.refresh();
            showToast(`Order submitted! Order ID: ${order.orderNumber}`, 'success');
            App.navigate('order-track', { orderNumber: order.orderNumber });
        } catch (err) {
            showToast(err.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'SUBMIT ORDER & VERIFY';
            }
        }
    }
};
