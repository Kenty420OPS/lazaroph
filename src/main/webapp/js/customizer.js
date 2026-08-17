/**
 * LAZAROPH — Interactive Customized Jersey Studio Module
 */

const Customizer = {
    currentStyle: 'pro-elite', // pro-elite, striker, team-set
    currentView: 'front', // front, back
    primaryColor: '#111111',
    accentColor: '#ffb800',
    textColor: '#ffffff',
    
    playerName: 'DELA CRUZ',
    playerNumber: '24',
    teamName: 'MANILA KINGS',
    selectedSize: 'L',
    logoUrl: null,
    specialNotes: '',
    productId: 9, // LAZAROPH Pro Elite Custom Jersey default

    init(productId) {
        if (productId) this.productId = productId;
        this.render();
    },

    render() {
        const container = document.getElementById('view-customizer');
        if (!container) return;

        container.innerHTML = `
            <div class="container">
                <div style="padding: 24px 0 10px; font-size: 0.85rem; color: var(--color-text-muted);">
                    <a href="javascript:void(0)" onclick="App.navigate('home')" style="color: var(--color-text-secondary);">Home</a> / 
                    <a href="javascript:void(0)" onclick="App.navigate('shop', { category: 'Customized' })" style="color: var(--color-text-secondary);">Customized Sportswear</a> / 
                    <span style="color: #ffffff;">Jersey Design Studio</span>
                </div>

                <div class="section-header" style="margin-bottom: 24px;">
                    <div>
                        <div class="section-subtitle">CUSTOM UNIFORM STUDIO</div>
                        <h1 class="section-title">CUSTOMIZE YOUR TEAM JERSEY</h1>
                    </div>
                    <div class="customizer-badge-tag">
                        ✨ HD Full Sublimation Printing • ₱1,199.00
                    </div>
                </div>

                <div class="customizer-layout">
                    <!-- Live Visual Mockup Stage -->
                    <div class="customizer-stage-card">
                        <div class="stage-view-toggle">
                            <button type="button" class="stage-toggle-btn ${this.currentView === 'front' ? 'active' : ''}" onclick="Customizer.switchView('front')">
                                Front View
                            </button>
                            <button type="button" class="stage-toggle-btn ${this.currentView === 'back' ? 'active' : ''}" onclick="Customizer.switchView('back')">
                                Back View
                            </button>
                        </div>

                        <!-- SVG Jersey Visual Render -->
                        <div class="jersey-graphic-wrapper" id="jersey-svg-wrapper">
                            ${this.generateJerseySVG()}
                        </div>

                        <div style="text-align: center;">
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 6px;">Live Sublimation Mockup Preview</div>
                            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-brand-cyan);">
                                ${this.teamName || 'TEAM'} • #${this.playerNumber || '00'} ${this.playerName || 'NAME'} (${this.selectedSize})
                            </div>
                        </div>
                    </div>

                    <!-- Customizer Form Controls Panel -->
                    <div class="customizer-controls-panel">
                        <!-- Step 1: Design Pattern -->
                        <div class="customizer-section-title">
                            <span class="step-num">1</span> Choose Template & Silhouette
                        </div>
                        <div class="design-cards-grid">
                            <div class="design-option-card ${this.currentStyle === 'pro-elite' ? 'active' : ''}" onclick="Customizer.setStyle('pro-elite')">
                                <div style="font-size: 1.5rem;">🏀</div>
                                <div class="design-card-name">Pro Elite Basketball</div>
                            </div>
                            <div class="design-option-card ${this.currentStyle === 'striker' ? 'active' : ''}" onclick="Customizer.setStyle('striker')">
                                <div style="font-size: 1.5rem;">⚽</div>
                                <div class="design-card-name">Striker Multi-Sport</div>
                            </div>
                            <div class="design-option-card ${this.currentStyle === 'team-set' ? 'active' : ''}" onclick="Customizer.setStyle('team-set')">
                                <div style="font-size: 1.5rem;">🎽</div>
                                <div class="design-card-name">Full Team Uniform Set</div>
                            </div>
                        </div>

                        <!-- Step 2: Color Presets -->
                        <div class="customizer-section-title">
                            <span class="step-num">2</span> Select Color Palette
                        </div>
                        <div class="color-presets-row">
                            <div class="color-preset-pill ${this.primaryColor === '#111111' ? 'active' : ''}" onclick="Customizer.setColorTheme('#111111', '#ffb800', '#ffffff')">
                                <span class="color-preset-dot" style="background: #111111; border: 1px solid #ffb800;"></span>
                                <span>Gold & Black</span>
                            </div>
                            <div class="color-preset-pill ${this.primaryColor === '#b91c1c' ? 'active' : ''}" onclick="Customizer.setColorTheme('#b91c1c', '#ffffff', '#ffffff')">
                                <span class="color-preset-dot" style="background: #b91c1c;"></span>
                                <span>Crimson Red</span>
                            </div>
                            <div class="color-preset-pill ${this.primaryColor === '#1d4ed8' ? 'active' : ''}" onclick="Customizer.setColorTheme('#1d4ed8', '#fbbf24', '#ffffff')">
                                <span class="color-preset-dot" style="background: #1d4ed8;"></span>
                                <span>Royal & Gold</span>
                            </div>
                            <div class="color-preset-pill ${this.primaryColor === '#064e3b' ? 'active' : ''}" onclick="Customizer.setColorTheme('#064e3b', '#34d399', '#ffffff')">
                                <span class="color-preset-dot" style="background: #064e3b;"></span>
                                <span>Emerald</span>
                            </div>
                        </div>

                        <!-- Step 3: Player Details -->
                        <div class="customizer-section-title">
                            <span class="step-num">3</span> Player & Team Personalization
                        </div>

                        <div class="form-group">
                            <label class="form-label">Team Name (Chest Front)</label>
                            <input type="text" class="form-control" id="custom-team-name" maxlength="18" value="${this.teamName}" placeholder="e.g. MANILA KINGS" oninput="Customizer.updateText('teamName', this.value)">
                        </div>

                        <div class="form-grid-2">
                            <div class="form-group">
                                <label class="form-label">Player Name (Back)</label>
                                <input type="text" class="form-control" id="custom-player-name" maxlength="14" value="${this.playerName}" placeholder="e.g. DELA CRUZ" oninput="Customizer.updateText('playerName', this.value)">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Jersey Number (00-99)</label>
                                <input type="text" class="form-control" id="custom-player-number" maxlength="3" value="${this.playerNumber}" placeholder="e.g. 24" oninput="Customizer.updateText('playerNumber', this.value)">
                            </div>
                        </div>

                        <!-- Step 4: Size Selection -->
                        <div class="customizer-section-title">
                            <span class="step-num">4</span> Select Apparel Size
                        </div>
                        <div class="sizes-matrix-grid" style="margin-bottom: 24px;">
                            ${['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => `
                                <button type="button" class="size-select-btn ${sz === this.selectedSize ? 'active' : ''}" onclick="Customizer.setSize('${sz}')">
                                    <span class="size-name">${sz}</span>
                                </button>
                            `).join('')}
                        </div>

                        <!-- Step 5: Special Notes -->
                        <div class="form-group">
                            <label class="form-label">Special Instructions & Logo Placement</label>
                            <textarea class="form-control" id="custom-special-notes" placeholder="e.g. Arched font style on chest, include Philippine flag badge on nape..." oninput="Customizer.specialNotes = this.value">${this.specialNotes}</textarea>
                        </div>

                        <!-- Add to Cart CTA -->
                        <div style="margin-top: 30px;">
                            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="Customizer.addCustomToCart()">
                                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                ADD CUSTOMIZED JERSEY TO CART (₱1,199.00)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateJerseySVG() {
        const isFront = this.currentView === 'front';

        return `
            <svg viewBox="0 0 320 420" class="jersey-svg-container" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${this.primaryColor}"/>
                        <stop offset="100%" stop-color="${this.darken(this.primaryColor, 30)}"/>
                    </linearGradient>
                    <pattern id="jerseyTexture" width="6" height="6" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.06)"/>
                    </pattern>
                </defs>

                <!-- Jersey Main Body Silhouette -->
                <path d="M 90 20 L 130 50 C 145 60, 175 60, 190 50 L 230 20 L 290 85 L 255 125 L 245 110 L 245 390 C 245 400, 235 410, 225 410 L 95 410 C 85 410, 75 400, 75 390 L 75 110 L 65 125 L 30 85 Z" 
                      fill="url(#jerseyGrad)" stroke="${this.accentColor}" stroke-width="3"/>

                <!-- Fabric Mesh Texture Overlay -->
                <path d="M 90 20 L 130 50 C 145 60, 175 60, 190 50 L 230 20 L 290 85 L 255 125 L 245 110 L 245 390 C 245 400, 235 410, 225 410 L 95 410 C 85 410, 75 400, 75 390 L 75 110 L 65 125 L 30 85 Z" 
                      fill="url(#jerseyTexture)"/>

                <!-- Side Trim Panels -->
                <path d="M 75 120 L 90 120 L 90 410 L 75 410 Z" fill="${this.accentColor}" opacity="0.85"/>
                <path d="M 230 120 L 245 120 L 245 410 L 230 410 Z" fill="${this.accentColor}" opacity="0.85"/>

                <!-- Ribbed Collar Trim -->
                <path d="M 130 50 C 145 62, 175 62, 190 50 C 180 35, 140 35, 130 50 Z" fill="${this.accentColor}"/>

                ${isFront ? `
                    <!-- Front View Text & Graphics -->
                    <!-- Brand Crest -->
                    <circle cx="160" cy="95" r="14" fill="${this.accentColor}" opacity="0.9"/>
                    <text x="160" y="99" font-size="10" font-weight="900" text-anchor="middle" fill="#111111" font-family="Outfit">LZPH</text>

                    <!-- Team Name -->
                    <text x="160" y="160" class="jersey-text-team" fill="${this.textColor}">${this.teamName.toUpperCase()}</text>

                    <!-- Front Number -->
                    <text x="160" y="260" class="jersey-text-number" fill="${this.accentColor}">${this.playerNumber}</text>

                    <!-- Authentic Tag at Hem -->
                    <rect x="200" y="370" width="34" height="24" fill="#000000" stroke="${this.accentColor}" rx="2"/>
                    <text x="217" y="385" font-size="7" font-weight="800" text-anchor="middle" fill="#ffffff" font-family="Outfit">LEGIT</text>
                ` : `
                    <!-- Back View Text & Graphics -->
                    <!-- Player Name -->
                    <text x="160" y="145" class="jersey-text-name" fill="${this.textColor}">${this.playerName.toUpperCase()}</text>

                    <!-- Large Back Number -->
                    <text x="160" y="270" font-size="96" font-family="Outfit" font-weight="900" text-anchor="middle" fill="${this.accentColor}" stroke="#111111" stroke-width="3">
                        ${this.playerNumber}
                    </text>

                    <!-- Small Brand Logo on Nape -->
                    <text x="160" y="80" font-size="9" font-weight="800" text-anchor="middle" fill="${this.accentColor}" font-family="Outfit">LAZAROPH PRO</text>
                `}
            </svg>
        `;
    },

    updateVisual() {
        const wrapper = document.getElementById('jersey-svg-wrapper');
        if (wrapper) {
            wrapper.innerHTML = this.generateJerseySVG();
        }
    },

    switchView(view) {
        this.currentView = view;
        this.render();
    },

    setStyle(style) {
        this.currentStyle = style;
        this.render();
    },

    setColorTheme(primary, accent, text) {
        this.primaryColor = primary;
        this.accentColor = accent;
        this.textColor = text;
        this.render();
    },

    updateText(field, val) {
        this[field] = val;
        this.updateVisual();
    },

    setSize(size) {
        this.selectedSize = size;
        this.render();
    },

    darken(hex, pct) {
        let num = parseInt(hex.replace('#', ''), 16),
            amt = Math.round(2.55 * pct),
            R = (num >> 16) - amt,
            G = (num >> 8 & 0x00FF) - amt,
            B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },

    async addCustomToCart() {
        if (!this.teamName.trim() || !this.playerName.trim() || !this.playerNumber.trim()) {
            showToast('Please fill in Team Name, Player Name, and Number.', 'error');
            return;
        }

        const customPayload = {
            jerseyName: this.playerName.trim().toUpperCase(),
            jerseyNumber: this.playerNumber.trim(),
            teamName: this.teamName.trim().toUpperCase(),
            design: this.currentStyle === 'pro-elite' ? 'Pro Elite Basketball Pattern' : (this.currentStyle === 'striker' ? 'Striker Multi-Sport' : 'Full Team Uniform Set'),
            size: this.selectedSize,
            color: this.primaryColor === '#111111' ? 'Gold & Black' : (this.primaryColor === '#b91c1c' ? 'Crimson Red' : (this.primaryColor === '#1d4ed8' ? 'Royal & Gold' : 'Emerald')),
            notes: this.specialNotes
        };

        try {
            // Find variant for selected size for product 9
            const product = await API.getProductById(this.productId);
            const variant = product.variants ? product.variants.find(v => v.size === this.selectedSize) : null;
            const variantId = variant ? variant.id : (product.variants && product.variants[0] ? product.variants[0].id : 36);

            await API.addToCart(this.productId, variantId, 1, JSON.stringify(customPayload));
            showToast(`Custom jersey for "${this.playerName} #${this.playerNumber}" added to cart!`, 'success');
            Cart.openDrawer();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
