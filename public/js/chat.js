/**
 * LAZAROPH — Native Customer ↔ Admin Real-Time Chat Module
 * Self-contained messaging system with order association & polling
 */

function escapeChatHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeChatHtml = escapeChatHtml;

const Chat = {
    escapeHtml: escapeChatHtml,
    isOpen: false,
    activeConversationId: null,
    activeOrderNumber: null,
    activeOrderId: null,
    pollInterval: null,
    unreadCount: 0,

    init() {
        this.renderWidgetContainers();
        this.checkUnread();

        // Background unread checker every 10 seconds
        setInterval(() => {
            if (!this.isOpen) {
                this.checkUnread();
            }
        }, 10000);
    },

    renderWidgetContainers() {
        if (document.getElementById('chat-launcher-btn')) return;

        // 1. Floating Launcher Button
        const launcher = document.createElement('div');
        launcher.id = 'chat-launcher-btn';
        launcher.className = 'chat-launcher-btn';
        launcher.title = 'Chat with LAZAROPH Admin';
        launcher.onclick = () => this.toggle();
        launcher.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
            <span class="chat-launcher-badge" id="chat-launcher-badge" style="display: none;">0</span>
        `;
        document.body.appendChild(launcher);

        // 2. Chat Widget Box
        const widget = document.createElement('div');
        widget.id = 'chat-widget-box';
        widget.className = 'chat-widget-box hidden';
        widget.innerHTML = `
            <div class="chat-widget-header">
                <div class="admin-info">
                    <div class="admin-avatar">L</div>
                    <div>
                        <div class="admin-name">LAZAROPH SUPPORT</div>
                        <div class="online-indicator">
                            <span class="online-dot"></span> Admin Online
                        </div>
                    </div>
                </div>
                <button class="close-btn" onclick="Chat.toggle()" title="Close chat">✕</button>
            </div>

            <div class="chat-order-bar" id="chat-order-bar" style="display: none;">
                <span>Topic: <strong id="chat-order-tag">General Inquiry</strong></span>
                <span id="chat-order-status" style="font-size: 0.72rem; color: #4b5563;"></span>
            </div>

            <div class="chat-quick-chips">
                <span class="chat-chip" onclick="Chat.sendQuick('Hi, can I know how much is the Lalamove delivery fee?')">🚚 Delivery Fee</span>
                <span class="chat-chip" onclick="Chat.triggerPaymentUpload()">💳 Payment Confirmation</span>
                <span class="chat-chip" onclick="Chat.sendQuick('Can I get an update on my order status?')">⏱️ Order Status</span>
                <span class="chat-chip" onclick="Chat.sendQuick('May I ask for the LBC tracking number?')">📦 LBC Tracking</span>
            </div>

            <div class="chat-messages-feed" id="chat-messages-feed">
                <div style="text-align: center; color: #9ca3af; font-size: 0.8rem; margin: auto;">
                    Loading messages...
                </div>
            </div>

            <div class="chat-widget-footer">
                <form class="chat-input-form" onsubmit="Chat.handleInputSubmit(event)">
                    <input type="file" id="chat-file-input" accept="image/jpeg,image/png,image/webp,image/jpg" style="display: none;" onchange="Chat.handleFileSelected(this)">
                    <button type="button" class="chat-attach-btn" id="chat-attach-btn" title="Upload Proof of Payment / Image" onclick="Chat.triggerPaymentUpload()">+</button>
                    <input type="text" class="chat-text-input" id="chat-text-input" placeholder="Type your message..." autocomplete="off">
                    <button type="submit" class="chat-send-btn" id="chat-send-btn">Send</button>
                </form>
            </div>
        `;
        document.body.appendChild(widget);
    },

    async toggle() {
        const widget = document.getElementById('chat-widget-box');
        if (!widget) return;

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            widget.classList.remove('hidden');
            if (!this.activeConversationId) {
                await this.loadOrCreateConversation();
            } else {
                await this.loadMessages();
            }
            this.startPolling();
            this.focusInput();
        } else {
            widget.classList.add('hidden');
            this.stopPolling();
            this.checkUnread();
        }
    },

    focusInput() {
        setTimeout(() => {
            const input = document.getElementById('chat-text-input');
            if (input) input.focus();
        }, 150);
    },

    async openOrderChat(orderId, orderNumber) {
        this.activeOrderId = orderId;
        this.activeOrderNumber = orderNumber;

        if (!this.isOpen) {
            const widget = document.getElementById('chat-widget-box');
            if (widget) widget.classList.remove('hidden');
            this.isOpen = true;
        }

        try {
            const conv = await API.startConversation({ orderId: orderId });
            this.activeConversationId = conv.id;
            this.updateOrderContextBar(conv);
            await this.loadMessages();
            this.startPolling();
            this.focusInput();
        } catch (err) {
            console.error('Failed to open order chat:', err);
            showToast('Please log in to chat with support.', 'info');
        }
    },

    async loadOrCreateConversation() {
        try {
            const conv = await API.startConversation({});
            this.activeConversationId = conv.id;
            this.updateOrderContextBar(conv);
            await this.loadMessages();
        } catch (err) {
            const feed = document.getElementById('chat-messages-feed');
            if (feed) {
                feed.innerHTML = `
                    <div style="text-align: center; padding: 40px 10px; color: #4b5563;">
                        <p style="font-size: 0.9rem; font-weight: 700; color: #000000; margin-bottom: 6px;">Sign in to Chat</p>
                        <p style="font-size: 0.8rem; margin-bottom: 16px;">Please log in to message our support team regarding orders and delivery fees.</p>
                        <button class="btn btn-primary btn-sm" onclick="Auth.showLoginModal(); Chat.toggle();" style="background: #000000; color: #ffffff;">Log In</button>
                    </div>
                `;
            }
        }
    },

    updateOrderContextBar(conv) {
        const bar = document.getElementById('chat-order-bar');
        const tag = document.getElementById('chat-order-tag');
        const status = document.getElementById('chat-order-status');

        if (!bar || !tag) return;

        if (conv.orderNumber) {
            bar.style.display = 'flex';
            tag.textContent = `Order #${conv.orderNumber}`;
            if (status) status.textContent = conv.status || 'Active';
        } else {
            bar.style.display = 'flex';
            tag.textContent = 'Customer Support Inquiry';
            if (status) status.textContent = 'General';
        }
    },

    async loadMessages() {
        if (!this.activeConversationId) return;

        try {
            const data = await API.getConversationMessages(this.activeConversationId);
            this.renderMessages(data.messages || []);
        } catch (err) {
            console.warn('Failed to load chat messages:', err);
        }
    },

    renderMessages(messages) {
        const feed = document.getElementById('chat-messages-feed');
        if (!feed) return;

        if (messages.length === 0) {
            feed.innerHTML = `
                <div style="text-align: center; color: #6b7280; font-size: 0.82rem; margin: auto; padding: 20px;">
                    👋 Hello! How can LAZAROPH assist you with your order today?
                </div>
            `;
            return;
        }

        const isScrolledToBottom = feed.scrollHeight - feed.clientHeight <= feed.scrollTop + 50;

        feed.innerHTML = messages.map(m => {
            const role = (m.senderRole || 'CUSTOMER').toLowerCase();
            const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const readStatus = m.isRead ? '✓✓ Read' : '✓ Sent';
            const isPaymentProof = m.messageType === 'PAYMENT_PROOF';
            const isPaymentVerified = m.messageType === 'PAYMENT_VERIFIED';

            if (isPaymentVerified) {
                return `
                    <div class="chat-bubble-row system" style="background: rgba(16,185,129,0.08); border-left: 4px solid #10b981; border-radius: 6px; padding: 6px 12px; margin: 4px auto; max-width: 85%;">
                        <div style="font-weight: 800; color: #15803d; font-size: 0.8rem; line-height: 1.35;">
                            ${escapeChatHtml(m.message)}
                        </div>
                        <div class="chat-meta" style="color: #059669; font-weight: 700; margin-top: 2px;">${timeStr}</div>
                    </div>
                `;
            }

            if (role === 'system') {
                return `
                    <div class="chat-bubble-row system">
                        <div class="chat-bubble">
                            <strong>📢 LAZAROPH UPDATE:</strong><br>${escapeChatHtml(m.message)}
                        </div>
                        <div class="chat-meta">${timeStr}</div>
                    </div>
                `;
            }

            const hasImage = m.imageUrl && m.imageUrl !== 'null' && m.imageUrl !== 'undefined' && m.imageUrl.trim() !== '';

            let bubbleContent = '';
            if (isPaymentProof) {
                bubbleContent += '<div class="payment-proof-badge pending">💳 PROOF OF PAYMENT • PENDING VERIFICATION</div>';
            }
            if (m.message && m.message.trim() !== '') {
                bubbleContent += `<div class="chat-text">${escapeChatHtml(m.message.trim())}</div>`;
            }
            if (hasImage) {
                bubbleContent += `<div class="chat-image-attachment" onclick="Chat.openLightbox('${escapeChatHtml(m.imageUrl)}')"><img src="${escapeChatHtml(m.imageUrl)}" alt="Payment Proof / Attachment" loading="lazy"><div style="padding: 3px 6px; font-size: 0.65rem; color: #cbd5e1; display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.85);"><span>🔍 Click to view receipt</span><span style="color: #67e8f9; font-weight: 700;">ENLARGE</span></div></div>`;
            }

            return `<div class="chat-bubble-row ${role}"><div class="chat-bubble">${bubbleContent}</div><div class="chat-meta"><span>${timeStr}</span>${role === 'customer' ? `<span>• ${readStatus}</span>` : ''}</div></div>`;
        }).join('');

        if (isScrolledToBottom || messages.length <= 4) {
            feed.scrollTop = feed.scrollHeight;
        }
    },

    async handleInputSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('chat-text-input');
        if (!input || !input.value.trim()) return;

        const text = input.value.trim();
        input.value = '';

        await this.sendMessage(text);
    },

    async sendQuick(text) {
        await this.sendMessage(text);
    },

    async sendMessage(text) {
        if (!text || !text.trim()) return;

        if (!this.activeConversationId) {
            await this.loadOrCreateConversation();
        }

        if (!this.activeConversationId) return;

        try {
            await API.sendChatMessage(this.activeConversationId, text.trim());
            await this.loadMessages();
            this.focusInput();
        } catch (err) {
            showToast(err.message || 'Failed to send message', 'error');
        }
    },

    startPolling() {
        this.stopPolling();
        this.pollInterval = setInterval(() => {
            if (this.isOpen && this.activeConversationId) {
                this.loadMessages();
            }
        }, 3500);
    },

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    },

    async checkUnread() {
        try {
            const data = await API.getUnreadChatCount();
            const count = data.unreadCount || 0;
            this.unreadCount = count;

            const badge = document.getElementById('chat-launcher-badge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (ignored) {}
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

    // =========================================================================
    // PAYMENT PROOF UPLOAD (+) & DOUBLE CONFIRMATION
    // =========================================================================
    stagedPaymentUpload: null,

    async triggerPaymentUpload() {
        if (!this.activeConversationId) {
            await this.loadOrCreateConversation();
        }
        const fileInput = document.getElementById('chat-file-input');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    },

    handleFileSelected(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];

        // Format validation
        const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileName = file.name.toLowerCase();
        const isValid = validExts.some(ext => fileName.endsWith(ext)) || file.type.startsWith('image/');
        if (!isValid) {
            showToast('Unsupported format. Please select a JPG, PNG, or WEBP image of your receipt.', 'error');
            input.value = '';
            return;
        }

        // Size validation (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('Receipt image is too large. Maximum size is 10MB.', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.stagedPaymentUpload = {
                file,
                filename: file.name,
                fileSize: file.size,
                dataUrl
            };
            this.openPaymentConfirmModal(file, dataUrl);
        };
        reader.readAsDataURL(file);
    },

    openPaymentConfirmModal(file, dataUrl) {
        let modal = document.getElementById('modal-customer-payment-confirm');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-customer-payment-confirm';
            modal.className = 'chat-confirm-modal-overlay';
            document.body.appendChild(modal);
        }

        const sizeStr = file.size > 1024 * 1024
            ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
            : (file.size / 1024).toFixed(0) + ' KB';

        const orderInfo = this.activeOrderNumber ? `Order #${this.activeOrderNumber}` : 'Your Order';

        modal.innerHTML = `
            <div class="chat-confirm-modal-card">
                <div class="chat-confirm-modal-header">
                    <h3><span>💳</span> Double Confirmation: Submit Payment Proof</h3>
                    <button type="button" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;" onclick="Chat.closePaymentConfirmModal()">✕</button>
                </div>
                <div class="chat-confirm-modal-body">
                    <div style="font-size: 0.82rem; color: #374151; margin-bottom: 10px; line-height: 1.4;">
                        <strong>Step 1: Check Receipt Preview</strong><br>
                        Verify that all transaction amounts, reference numbers, and dates are clearly visible.
                    </div>

                    <div class="chat-confirm-preview-frame">
                        <img src="${dataUrl}" alt="Payment Proof Preview">
                    </div>

                    <div style="font-size: 0.76rem; color: #6b7280; margin-bottom: 12px;">
                        <strong>File:</strong> ${this.escapeHtml(file.name)} (${sizeStr}) • Target: <strong>${this.escapeHtml(orderInfo)}</strong>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.78rem; font-weight: 700; color: #111827; display: block; margin-bottom: 4px;">Payment Reference / Ref No. (Optional)</label>
                        <input type="text" id="chat-confirm-ref" class="form-control" placeholder="e.g. GCash Ref 100284758291" style="width: 100%; padding: 8px 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box;">
                    </div>

                    <div style="margin-bottom: 14px;">
                        <label style="font-size: 0.78rem; font-weight: 700; color: #111827; display: block; margin-bottom: 4px;">Amount Paid (₱) (Optional)</label>
                        <input type="text" id="chat-confirm-amount" class="form-control" placeholder="e.g. ₱3,499.00" style="width: 100%; padding: 8px 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box;">
                    </div>

                    <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; color: #92400e; line-height: 1.45;">
                        <strong>Step 2 Confirmation:</strong> Are you sure you want to submit this proof of payment to LazaroPH Support? Our team will verify the payment before dispatch.
                    </div>
                </div>

                <div class="chat-confirm-modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="Chat.closePaymentConfirmModal()">Cancel / Change</button>
                    <button type="button" id="btn-submit-payment-confirm" class="btn btn-sm" style="background: #000000; color: #ffffff; font-weight: 800; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;" onclick="Chat.submitPaymentProof()">
                        ✓ Yes, Confirm & Send Proof
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    },

    closePaymentConfirmModal() {
        const modal = document.getElementById('modal-customer-payment-confirm');
        if (modal) modal.style.display = 'none';
        this.stagedPaymentUpload = null;
    },

    async submitPaymentProof() {
        if (!this.stagedPaymentUpload) return;
        const btn = document.getElementById('btn-submit-payment-confirm');
        const refInput = document.getElementById('chat-confirm-ref');
        const amountInput = document.getElementById('chat-confirm-amount');

        const refNo = refInput ? refInput.value.trim() : '';
        const amount = amountInput ? amountInput.value.trim() : '';

        let caption = '💳 [PROOF OF PAYMENT] Payment receipt submitted for order verification.';
        if (refNo || amount) {
            caption += ` (${[amount ? 'Amount: ' + amount : '', refNo ? 'Ref: ' + refNo : ''].filter(Boolean).join(' • ')})`;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="btn-spinner"></span> Submitting...`;
        }

        try {
            await API.uploadChatImage(this.activeConversationId, {
                filename: this.stagedPaymentUpload.filename,
                imageData: this.stagedPaymentUpload.dataUrl,
                message: caption,
                messageType: 'PAYMENT_PROOF',
                referenceNumber: refNo
            });

            this.closePaymentConfirmModal();
            showToast('Proof of payment submitted successfully! Our support team will verify it shortly.', 'success');
            await this.loadMessages();
        } catch (err) {
            showToast(err.message || 'Failed to upload payment proof.', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `✓ Yes, Confirm & Send Proof`;
            }
        }
    },

    openLightbox(imageUrl) {
        let lightbox = document.getElementById('modal-chat-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'modal-chat-lightbox';
            lightbox.className = 'chat-confirm-modal-overlay';
            lightbox.onclick = (e) => {
                if (e.target === lightbox) Chat.closeLightbox();
            };
            document.body.appendChild(lightbox);
        }

        lightbox.innerHTML = `
            <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">
                <button type="button" style="position: absolute; top: -38px; right: 0; background: none; border: none; color: #fff; font-size: 1.8rem; cursor: pointer;" onclick="Chat.closeLightbox()">✕</button>
                <img src="${imageUrl}" style="max-width: 90vw; max-height: 85vh; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); object-fit: contain; background: #000;" alt="Full Receipt">
                <a href="${imageUrl}" download="payment_receipt" target="_blank" style="margin-top: 10px; color: #67e8f9; font-size: 0.82rem; font-weight: 700; text-decoration: underline;">Open Full Resolution / Download ↗</a>
            </div>
        `;
        lightbox.style.display = 'flex';
    },

    closeLightbox() {
        const lightbox = document.getElementById('modal-chat-lightbox');
        if (lightbox) lightbox.style.display = 'none';
    }
};

// Initialize Chat widget on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Chat.init();
});
