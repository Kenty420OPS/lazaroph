/**
 * LAZAROPH — Complete Customer & Administrator Authentication System
 * 
 * Strict logical, visual, and architectural separation between Customer and Admin domains.
 */

// =========================================================================
// 1. CUSTOMER AUTHENTICATION (POWERED BY FIREBASE AUTH & FIRESTORE)
// =========================================================================
const CustomerAuth = {
    TOKEN_KEY: 'lazaroph_customer_token',
    USER_KEY: 'lazaroph_customer_user',
    currentCustomer: null,
    cooldownInterval: null,

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || '';
    },

    setToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            if (!AdminAuth.getToken()) {
                localStorage.setItem('lazaroph_token', token);
            }
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
            if (!AdminAuth.getToken()) {
                localStorage.removeItem('lazaroph_token');
            }
        }
    },

    getCustomer() {
        if (this.currentCustomer) return this.currentCustomer;
        const saved = localStorage.getItem(this.USER_KEY);
        if (saved) {
            try { this.currentCustomer = JSON.parse(saved); } catch (e) {}
        }
        return this.currentCustomer;
    },

    setCustomer(user) {
        this.currentCustomer = user;
        if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.USER_KEY);
        }
        Auth.updateUI();
    },

    isLoggedIn() {
        return !!this.getCustomer();
    },

    isEmailVerified() {
        return true;
    },

    async init() {
        // Initialize Firebase SDK
        if (typeof LazarophFirebase !== 'undefined') {
            LazarophFirebase.init();
            if (LazarophFirebase.auth) {
                LazarophFirebase.auth.onAuthStateChanged(async (fbUser) => {
                    if (fbUser) {
                        const token = await fbUser.getIdToken().catch(() => 'fb_' + fbUser.uid);
                        this.setToken(token);
                        const isVerified = Boolean(fbUser.emailVerified);
                        const existing = this.getCustomer() || {};
                        const customer = {
                            id: fbUser.uid,
                            uid: fbUser.uid,
                            name: fbUser.displayName || existing.name || fbUser.email.split('@')[0],
                            email: fbUser.email,
                            phone: existing.phone || '',
                            address: existing.address || '',
                            city: existing.city || 'Marikina',
                            province: existing.province || 'Metro Manila',
                            zipCode: existing.zipCode || '1805',
                            role: 'CUSTOMER',
                            emailVerified: isVerified
                        };
                        this.setCustomer(customer);
                    } else {
                        // Only clear customer if not admin session
                        if (!AdminAuth.isVerified()) {
                            this.setCustomer(null);
                            this.setToken(null);
                        }
                    }
                });
            }
        }

        // Start real-time cooldown button monitor
        this.startCooldownWatcher();
    },

    startCooldownWatcher() {
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);
        const updateButtons = () => {
            const remaining = typeof LazarophFirebase !== 'undefined' ? LazarophFirebase.getRemainingCooldown() : 0;
            const buttons = [
                document.getElementById('btn-pending-resend-verification'),
                document.getElementById('btn-reg-resend-verification'),
                document.getElementById('btn-account-resend-verification')
            ];

            buttons.forEach(btn => {
                if (!btn) return;
                if (remaining > 0) {
                    btn.disabled = true;
                    btn.classList.add('btn-cooldown');
                    btn.innerHTML = `Resend available in ${remaining} seconds`;
                } else {
                    btn.disabled = false;
                    btn.classList.remove('btn-cooldown');
                    btn.innerHTML = `Resend Verification Email`;
                }
            });
        };
        updateButtons();
        this.cooldownInterval = setInterval(updateButtons, 1000);
    },

    // Customer Login Handler
    async handleLogin(event) {
        if (event) event.preventDefault();
        const emailEl = document.getElementById('cust-login-email');
        const passEl = document.getElementById('cust-login-password');
        const alertEl = document.getElementById('cust-login-alert');
        const btn = document.getElementById('cust-login-btn');

        if (!emailEl || !passEl) return;
        const email = emailEl.value.trim();
        const password = passEl.value;

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> LOGGING IN...';
        }

        try {
            const res = await LazarophFirebase.loginCustomer(email, password);
            const token = await res.user.getIdToken().catch(() => 'fb_' + res.user.uid);
            this.setToken(token);
            this.setCustomer(res.customer);

            showToast(`Welcome back, ${res.customer.name}!`, 'success');
            if (typeof Auth !== 'undefined' && typeof Auth.closeAuthModal === 'function') {
                Auth.closeAuthModal();
            }
            App.navigate('account');
        } catch (err) {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message || 'Invalid email or password.')}</span>`;
            } else {
                showToast(err.message, 'error');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'LOGIN';
            }
        }
    },

    resetRegistrationForm() {
        this.registrationCompleted = false;
        const formContainer = document.getElementById('cust-reg-form-container');
        const successContainer = document.getElementById('cust-reg-success-container');
        if (formContainer) formContainer.style.display = 'block';
        if (successContainer) successContainer.style.display = 'none';
        const alertEl = document.getElementById('cust-reg-alert');
        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }
    },

    showRegError(alertEl, msg) {
        if (alertEl) {
            alertEl.style.display = 'block';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.innerHTML = `<span>❌ ${escapeHtml(msg)}</span>`;
        } else {
            showToast(msg, 'error');
        }
    },

    // Customer Registration Handler
    async handleRegister(event) {
        if (event) event.preventDefault();
        const nameEl = document.getElementById('cust-reg-name');
        const emailEl = document.getElementById('cust-reg-email');
        const passEl = document.getElementById('cust-reg-password');
        const confirmEl = document.getElementById('cust-reg-confirm');
        const phoneEl = document.getElementById('cust-reg-phone');
        const addressEl = document.getElementById('cust-reg-address');
        const alertEl = document.getElementById('cust-reg-alert');
        const btn = document.getElementById('cust-reg-btn');

        if (!nameEl || !emailEl || !passEl || !confirmEl) return;
        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const password = passEl.value;
        const confirmPassword = confirmEl.value;
        const phone = phoneEl ? phoneEl.value.trim() : '';
        const address = addressEl ? addressEl.value.trim() : '';

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }

        // Field validation
        if (!name) {
            this.showRegError(alertEl, 'Please enter your full name.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showRegError(alertEl, 'Please enter a valid email address (e.g. yourname@gmail.com).');
            return;
        }
        if (!password || password.length < 6) {
            this.showRegError(alertEl, 'Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            this.showRegError(alertEl, 'Passwords do not match. Please re-enter your password.');
            return;
        }

        // 1. Immediately show loading state & disable inputs to prevent multiple clicks
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> Creating your account...';
        }
        const inputs = [nameEl, emailEl, passEl, confirmEl, phoneEl, addressEl].filter(Boolean);
        inputs.forEach(input => input.disabled = true);

        try {
            // 2. Sequential async registration with dynamic progress status updates
            const res = await LazarophFirebase.registerCustomer({
                name,
                email,
                password,
                confirmPassword,
                phone,
                address,
                onProgress: (statusText) => {
                    if (btn) {
                        btn.innerHTML = `<span class="btn-spinner"></span> ${statusText}`;
                    }
                }
            });

            // 3. Mark registration completed & update application auth state immediately
            this.registrationCompleted = true;
            const token = await res.user.getIdToken().catch(() => 'fb_' + res.user.uid);
            this.setToken(token);
            this.setCustomer({
                id: res.user.uid,
                uid: res.user.uid,
                name: name,
                email: res.email,
                phone: phone,
                address: address,
                role: 'CUSTOMER',
                emailVerified: true
            });

            showToast('Account created successfully! A verification email has been sent to your email address. Please check your inbox.', 'success');
            App.navigate('account');
        } catch (err) {
            inputs.forEach(input => input.disabled = false);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'CREATE ACCOUNT';
            }
            this.showRegError(alertEl, err.message);
        }
    },

    // Customer Google Sign-In & Sign-Up Handler
    async handleGoogleSignIn(source = 'login') {
        const alertEl = document.getElementById(source === 'register' ? 'cust-reg-alert' : 'cust-login-alert');
        const btns = [
            document.getElementById('cust-google-login-btn'),
            document.getElementById('cust-google-reg-btn')
        ];

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }

        btns.forEach(b => {
            if (b) {
                b.disabled = true;
                b.innerHTML = `<span class="btn-spinner" style="width:16px; height:16px; margin-right:8px; display:inline-block;"></span> Connecting to Google...`;
            }
        });

        try {
            const res = await LazarophFirebase.signInWithGoogle();
            const token = await res.user.getIdToken().catch(() => 'fb_google_' + res.user.uid);
            this.setToken(token);
            this.setCustomer(res.customer);

            showToast(`Signed in successfully as ${res.customer.name}!`, 'success');

            if (window.location.hash === '#login' || window.location.hash === '#register' || window.location.hash.startsWith('#login') || window.location.hash.startsWith('#register')) {
                App.navigate('account');
            } else {
                App.navigate('home');
            }
        } catch (err) {
            console.error('[CustomerAuth] Google Sign-In error:', err);
            const errStr = (err.message || '').toLowerCase();
            if (errStr.includes('closed-by-user') || errStr.includes('cancelled') || errStr.includes('popup-closed')) {
                console.log('[CustomerAuth] Google popup closed by user.');
            } else {
                if (alertEl) {
                    alertEl.style.display = 'block';
                    alertEl.className = 'auth-alert auth-alert-error';
                    alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message || 'Google authentication failed. Please try again.')}</span>`;
                } else {
                    showToast(err.message || 'Google authentication failed.', 'error');
                }
            }
        } finally {
            btns.forEach(b => {
                if (b) {
                    b.disabled = false;
                    b.innerHTML = `
                        <svg class="google-icon" width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Continue with Google</span>
                    `;
                }
            });
        }
    },

    // Check Verification Status Button
    async checkStatus() {
        const alertPending = document.getElementById('cust-pending-alert');
        const alertReg = document.getElementById('cust-reg-alert');
        try {
            showToast('Checking verification status with Firebase...', 'info');
            const res = await LazarophFirebase.checkVerificationStatus();

            if (res.emailVerified) {
                const cust = this.getCustomer() || {};
                cust.emailVerified = true;
                this.setCustomer(cust);
                showToast('Email verified successfully! Full customer access unlocked.', 'success');
                App.navigate('account');
            } else {
                showToast('Email not verified yet. Please check your inbox and click the verification link.', 'warning');
                if (alertPending) {
                    alertPending.style.display = 'block';
                    alertPending.className = 'auth-alert auth-alert-warning';
                    alertPending.innerHTML = `<span>⚠️ Your email <strong>${escapeHtml(res.email)}</strong> is not verified yet. Please open your inbox (or spam folder) and click the verification link, then click "Check Verification Status" again.</span>`;
                }
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // Resend Verification Email (with anti-abuse rate limit)
    async resendVerification() {
        const btn = document.getElementById('btn-reg-resend-verification') || document.getElementById('btn-pending-resend-verification');
        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="btn-spinner"></span> Sending verification email...';
            }
            const res = await LazarophFirebase.resendVerificationEmail();
            if (res.alreadyVerified) {
                showToast(res.message, 'success');
                const cust = this.getCustomer() || {};
                cust.emailVerified = true;
                this.setCustomer(cust);
                App.navigate('account');
                return;
            }
            showToast('A verification email has been sent to your email address. Please check your inbox or spam folder.', 'success');
            this.startCooldownWatcher();
        } catch (err) {
            showToast(err.message, 'error');
            this.startCooldownWatcher();
        }
    },

    // Verify Email Execution (when customer clicks official verification link)
    async runVerifyEmail(actionCode) {
        const loadingCard = document.getElementById('verify-loading-card');
        const successCard = document.getElementById('verify-success-card');
        const errorCard = document.getElementById('verify-error-card');
        const errorMsg = document.getElementById('verify-error-message');

        if (loadingCard) loadingCard.style.display = 'block';
        if (successCard) successCard.style.display = 'none';
        if (errorCard) errorCard.style.display = 'none';

        try {
            await LazarophFirebase.applyEmailActionCode(actionCode);
            if (loadingCard) loadingCard.style.display = 'none';
            if (successCard) successCard.style.display = 'block';

            const cust = this.getCustomer();
            if (cust) {
                cust.emailVerified = true;
                this.setCustomer(cust);
            }
            showToast('Email verified successfully! Full customer access unlocked.', 'success');
        } catch (err) {
            if (loadingCard) loadingCard.style.display = 'none';
            if (errorCard) {
                errorCard.style.display = 'block';
                if (errorMsg) errorMsg.textContent = err.message || 'Invalid or expired verification link.';
            }
            showToast(err.message, 'error');
        }
    },

    handlePostVerifyAction() {
        if (this.isLoggedIn() && this.isEmailVerified()) {
            App.navigate('account');
        } else {
            App.navigate('login');
        }
    },

    // Customer Forgot Password
    async handleForgotPassword(event) {
        if (event) event.preventDefault();
        const emailEl = document.getElementById('cust-forgot-email');
        const alertEl = document.getElementById('cust-forgot-alert');
        const btn = document.getElementById('cust-forgot-btn');
        if (!emailEl) return;

        const email = emailEl.value.trim();
        if (!email) return;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> SENDING...';
        }

        try {
            const res = await LazarophFirebase.sendPasswordReset(email);
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-success';
                alertEl.innerHTML = `
                    <div style="font-weight: 700; margin-bottom: 4px;">✅ Check Your Email</div>
                    <div>${escapeHtml(res.message)}</div>
                `;
            }
            showToast('Password reset email sent. Please check your inbox.', 'success');
        } catch (err) {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message)}</span>`;
            } else {
                showToast(err.message, 'error');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'SEND PASSWORD RESET LINK';
            }
        }
    },

    // Customer Reset Password
    async handleResetPassword(event, actionCode) {
        if (event) event.preventDefault();
        const passEl = document.getElementById('cust-reset-pass');
        const confirmEl = document.getElementById('cust-reset-confirm');
        const alertEl = document.getElementById('cust-reset-alert');
        const btn = document.getElementById('cust-reset-btn');

        if (!passEl || !confirmEl) return;
        const newPassword = passEl.value;
        const confirmPassword = confirmEl.value;

        if (newPassword !== confirmPassword) {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = '<span>❌ Passwords do not match. Please re-enter your password.</span>';
            }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> RESETTING PASSWORD...';
        }

        try {
            await LazarophFirebase.confirmPasswordReset(actionCode, newPassword);
            const formCard = document.getElementById('cust-reset-form-card');
            const successCard = document.getElementById('cust-reset-success-card');
            if (formCard && successCard) {
                formCard.style.display = 'none';
                successCard.style.display = 'block';
            } else {
                showToast('Password reset successfully! You can now log in.', 'success');
                App.navigate('login');
            }
        } catch (err) {
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message)}</span>`;
            } else {
                showToast(err.message, 'error');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'RESET PASSWORD';
            }
        }
    },

    // Customer Logout
    async logout() {
        try {
            await LazarophFirebase.logoutCustomer();
        } catch (ignored) {}
        this.setToken(null);
        this.setCustomer(null);
        showToast('Logged out of customer account.', 'info');
        App.navigate('login');
    }
};

// =========================================================================
// 2. ADMINISTRATOR TWO-STEP AUTHENTICATION
// =========================================================================
const AdminAuth = {
    TOKEN_KEY: 'lazaroph_admin_token',
    PRETOKEN_KEY: 'lazaroph_admin_pretoken',
    ADMIN_USER_KEY: 'lazaroph_admin_user',
    currentAdmin: null,

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || '';
    },

    setToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem('lazaroph_token', token); // Set main API bearer
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
            // Revert main API bearer to customer token if logged in, else null
            const custToken = CustomerAuth.getToken();
            if (custToken) {
                localStorage.setItem('lazaroph_token', custToken);
            } else {
                localStorage.removeItem('lazaroph_token');
            }
        }
    },

    getPreToken() {
        return sessionStorage.getItem(this.PRETOKEN_KEY) || '';
    },

    setPreToken(token) {
        if (token) {
            sessionStorage.setItem(this.PRETOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(this.PRETOKEN_KEY);
        }
    },

    getAdmin() {
        if (this.currentAdmin) return this.currentAdmin;
        const saved = localStorage.getItem(this.ADMIN_USER_KEY);
        if (saved) {
            try { this.currentAdmin = JSON.parse(saved); } catch (e) {}
        }
        return this.currentAdmin;
    },

    setAdmin(user) {
        this.currentAdmin = user;
        if (user) {
            localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.ADMIN_USER_KEY);
        }
        Auth.updateUI();
    },

    isVerified() {
        const token = this.getToken();
        const admin = this.getAdmin();
        return !!token && !!admin && (admin.role === 'SUPER_ADMIN' || admin.role === 'ADMIN');
    },

    async init() {
        const token = this.getToken();
        if (token) {
            try {
                API.setToken(token);
                const admin = await API.adminGetMe();
                this.setAdmin(admin);
            } catch (err) {
                console.warn('[AdminAuth] Admin session expired:', err.message);
                this.setToken(null);
                this.setAdmin(null);
            }
        } else {
            this.setAdmin(null);
        }
    },

    // Step 1: Email + Login Password
    async handleStep1(event) {
        if (event) event.preventDefault();
        const emailEl = document.getElementById('admin-login-email');
        const passEl = document.getElementById('admin-login-password');
        const alertEl = document.getElementById('admin-login-alert');
        const btn = document.getElementById('admin-login-btn');

        if (!emailEl || !passEl) return;
        const email = emailEl.value.trim();
        const password = passEl.value;

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> VERIFYING STEP 1...';
        }

        try {
            const data = await API.adminLoginStep1(email, password);
            const preToken = data && data.preAuthToken ? data.preAuthToken : '';
            if (!preToken) {
                throw new Error((data && (data.error || data.message)) || 'Administrator verification failed.');
            }
            this.setPreToken(preToken);
            sessionStorage.setItem('lazaroph_admin_pre_name', data.adminName || 'Super Admin');
            sessionStorage.setItem('lazaroph_admin_pre_email', data.adminEmail || email);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'CONTINUE TO STEP 2';
            }

            showToast('Step 1 verified. Please enter your Security Password.', 'info');
            App.navigate('admin/security-verification');
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'CONTINUE TO STEP 2';
            }
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message || 'Invalid administrator credentials.')}</span>`;
            } else {
                showToast(err.message, 'error');
            }
        }
    },

    // Step 2: Security Password / PIN Verification
    async handleStep2(event) {
        if (event) event.preventDefault();
        const pinEl = document.getElementById('admin-security-pin');
        const alertEl = document.getElementById('admin-security-alert');
        const btn = document.getElementById('admin-security-btn');
        const preToken = this.getPreToken();

        if (!preToken) {
            showToast('Session expired. Please restart login from Step 1.', 'error');
            App.navigate('admin/login');
            return;
        }

        if (!pinEl) return;
        const securityPassword = pinEl.value.trim();

        if (alertEl) {
            alertEl.style.display = 'none';
            alertEl.innerHTML = '';
        }
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-spinner"></span> VERIFYING PIN...';
        }

        try {
            const data = await API.adminVerifyStep2(preToken, securityPassword);
            const token = (data && (data.adminToken || data.token)) || '';
            const admin = (data && (data.admin || data.user)) || null;

            if (!token || !admin) {
                throw new Error('Authentication failed: Missing admin token.');
            }

            this.setToken(token);
            this.setAdmin(admin);
            this.setPreToken(null);
            sessionStorage.removeItem('lazaroph_admin_pre_name');
            sessionStorage.removeItem('lazaroph_admin_pre_email');

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'VERIFY SECURITY ACCESS';
            }

            showToast(`Welcome, ${admin.name}! Two-step security verified.`, 'success');
            App.navigate('admin/dashboard');
        } catch (err) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'VERIFY SECURITY ACCESS';
            }
            if (alertEl) {
                alertEl.style.display = 'block';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.innerHTML = `<span>❌ ${escapeHtml(err.message || 'Incorrect security password.')}</span>`;
            } else {
                showToast(err.message, 'error');
            }
        }
    },

    // Admin Logout
    async logout() {
        const token = this.getToken();
        if (token) {
            try {
                API.setToken(token);
                await API.adminLogout();
            } catch (ignored) {}
        }
        this.setToken(null);
        this.setAdmin(null);
        this.setPreToken(null);
        showToast('Administrator session ended securely.', 'info');
        App.navigate('admin/login');
    }
};

// =========================================================================
// 3. LIVE EMAIL SIMULATOR (DEV / LOCAL TESTING MODAL)
// =========================================================================
const EmailSimulator = {
    emails: [],
    lastCheckedId: null,

    async checkNewEmail() {
        const isLocal = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:'
        );
        if (!isLocal) return;

        try {
            const emails = await API.getSimulatedEmails();
            if (emails && emails.length > 0) {
                this.emails = emails;
                const latest = emails[0];
                if (latest && latest.token && latest.token !== this.lastCheckedId) {
                    this.lastCheckedId = latest.token;
                    this.showNotification(latest);
                }
            }
        } catch (e) {}
    },

    showNotification(email) {
        const isLocal = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:'
        );
        if (!isLocal || !email || !email.token) return;
        const isVerify = email.type === 'VERIFICATION';
        const actionLabel = isVerify ? 'VERIFY MY EMAIL' : 'RESET MY PASSWORD';
        const actionHash = isVerify ? `#verify-email?token=${email.token}` : `#reset-password?token=${email.token}`;

        // Show prominent toast with direct action link
        const toastId = 'toast-email-' + Date.now();
        const toast = document.createElement('div');
        toast.className = 'toast toast-email-preview';
        toast.id = toastId;
        toast.style.cssText = 'background: #0f172a; border: 1px solid #00c853; box-shadow: 0 10px 25px rgba(0,200,83,0.3); padding: 14px 18px; border-radius: 8px; margin-bottom: 10px; max-width: 420px;';
        toast.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 1.5rem;">📬</span>
                <div style="flex: 1;">
                    <div style="font-size: 0.75rem; color: #00c853; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                        Simulated Email Delivered
                    </div>
                    <div style="font-size: 0.92rem; font-weight: 600; color: #ffffff; margin: 2px 0;">
                        ${escapeHtml(email.subject)}
                    </div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">
                        To: <strong>${escapeHtml(email.toEmail)}</strong>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="${actionHash}" class="btn btn-sm" style="background: #00c853; color: #000; font-weight: 700; padding: 4px 10px;" onclick="document.getElementById('${toastId}').remove()">
                            ${actionLabel}
                        </a>
                        <button class="btn btn-sm btn-secondary" style="padding: 4px 8px;" onclick="EmailSimulator.openModal()">
                            View Email
                        </button>
                    </div>
                </div>
                <button onclick="document.getElementById('${toastId}').remove()" style="background: none; border: none; color: #64748b; font-size: 1.1rem; cursor: pointer;">&times;</button>
            </div>
        `;
        const container = document.getElementById('toast-container');
        if (container) container.appendChild(toast);
    },

    async openModal() {
        try {
            const emails = await API.getSimulatedEmails();
            this.emails = emails || [];
        } catch (e) {}

        let modal = document.getElementById('modal-email-simulator');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-email-simulator';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        const latest = this.emails.length > 0 ? this.emails[0] : null;
        if (!latest) {
            modal.innerHTML = `
                <div class="modal-backdrop" onclick="EmailSimulator.closeModal()"></div>
                <div class="modal-content" style="max-width: 520px; text-align: center; padding: 30px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">📭</div>
                    <h3 style="margin-bottom: 8px;">No Emails Sent Yet</h3>
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">
                        Register a customer account or request a password reset to see simulated emails here.
                    </p>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="EmailSimulator.closeModal()">Close</button>
                </div>
            `;
            modal.classList.add('active');
            return;
        }

        const isVerify = latest.type === 'VERIFICATION';
        const actionLabel = isVerify ? 'VERIFY MY EMAIL' : 'RESET MY PASSWORD';
        const actionHash = isVerify ? `#verify-email?token=${latest.token}` : `#reset-password?token=${latest.token}`;

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="EmailSimulator.closeModal()"></div>
            <div class="modal-content" style="max-width: 560px; padding: 0; overflow: hidden; border: 1px solid var(--color-border); background: #0f172a;">
                <div style="background: #1e293b; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">📬</span>
                        <strong style="color: #fff; font-size: 0.95rem;">LAZAROPH Email Simulator</strong>
                    </div>
                    <button type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;" onclick="EmailSimulator.closeModal()">&times;</button>
                </div>
                <div style="padding: 24px; background: #0b0f19;">
                    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 20px;">
                        <div style="border-bottom: 1px solid #1f2937; padding-bottom: 12px; margin-bottom: 16px;">
                            <div style="font-size: 0.8rem; color: #9ca3af;">FROM: <strong style="color: #fff;">LAZAROPH &lt;support@lazaroph.com&gt;</strong></div>
                            <div style="font-size: 0.8rem; color: #9ca3af;">TO: <strong style="color: #fff;">${escapeHtml(latest.toName)} &lt;${escapeHtml(latest.toEmail)}&gt;</strong></div>
                            <div style="font-size: 0.8rem; color: #9ca3af;">SUBJECT: <strong style="color: #60a5fa;">${escapeHtml(latest.subject)}</strong></div>
                        </div>
                        <div style="text-align: center; padding: 10px 0;">
                            <div style="font-size: 1.3rem; font-weight: 800; letter-spacing: 0.05em; color: #fff; margin-bottom: 6px;">LAZAROPH</div>
                            <div style="font-size: 0.72rem; color: var(--color-accent); font-weight: 700; letter-spacing: 0.1em; margin-bottom: 18px;">
                                AUTHENTIC • LEGIT • BELOW MARKET PRICE
                            </div>
                            <p style="font-size: 0.95rem; color: #e5e7eb; margin-bottom: 20px;">
                                ${escapeHtml(latest.snippet)}
                            </p>
                            <a href="${actionHash}" class="btn btn-primary btn-lg" style="display: inline-block; font-weight: 800; letter-spacing: 0.05em; padding: 12px 28px;" onclick="EmailSimulator.closeModal()">
                                ${actionLabel}
                            </a>
                            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 20px;">
                                Or copy this link to your browser:<br>
                                <span style="word-break: break-all; color: #9ca3af; font-family: monospace;">${latest.actionUrl}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('modal-email-simulator');
        if (modal) modal.classList.remove('active');
    }
};

// =========================================================================
// 4. LEGACY / SHARED AUTH INTERFACE (FOR HEADER CHROME & COMPATIBILITY)
// =========================================================================
const Auth = {
    get currentUser() {
        if (AdminAuth.isVerified()) {
            const admin = AdminAuth.getAdmin();
            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: 'ADMIN',
                isAdmin: true
            };
        }
        if (CustomerAuth.isLoggedIn()) {
            const cust = CustomerAuth.getCustomer();
            return {
                id: cust.id,
                name: cust.name,
                email: cust.email,
                role: 'CUSTOMER',
                isAdmin: false,
                emailVerified: CustomerAuth.isEmailVerified()
            };
        }
        return null;
    },

    async init() {
        await Promise.all([
            CustomerAuth.init(),
            AdminAuth.init()
        ]);
        this.updateUI();
    },

    updateUI() {
        const userBtn = document.getElementById('btn-header-account');
        const adminNavLink = document.getElementById('nav-admin-link');

        if (AdminAuth.isVerified()) {
            const admin = AdminAuth.getAdmin();
            if (userBtn) {
                userBtn.title = `Admin: ${admin.name}`;
                userBtn.innerHTML = `<svg width="20" height="20" fill="var(--color-accent)" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            }
            if (adminNavLink) {
                adminNavLink.classList.remove('hidden');
            }
        } else if (CustomerAuth.isLoggedIn()) {
            const customer = CustomerAuth.getCustomer();
            const verified = CustomerAuth.isEmailVerified();
            if (userBtn) {
                userBtn.title = verified ? `Account: ${customer.name}` : `Account (Email Verification Required): ${customer.name}`;
                userBtn.innerHTML = verified
                    ? `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
                    : `<span style="position: relative; display: inline-block;">
                         <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                         <span style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; background: #d97706; border: 2px solid #ffffff; border-radius: 50%;" title="Verification Required"></span>
                       </span>`;
            }
            if (adminNavLink) {
                adminNavLink.classList.add('hidden');
            }
        } else {
            if (userBtn) {
                userBtn.title = 'Login / Register';
                userBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
            }
            if (adminNavLink) {
                adminNavLink.classList.add('hidden');
            }
        }
    },

    openAuthModal(defaultTab = 'login') {
        // Direct to dedicated /login or /register view as requested!
        if (defaultTab === 'register') {
            App.navigate('register');
        } else {
            App.navigate('login');
        }
    },

    closeAuthModal() {
        const modal = document.getElementById('modal-auth');
        if (modal) modal.classList.remove('active');
    },

    switchAuthTab(tab) {
        if (tab === 'register') {
            App.navigate('register');
        } else {
            App.navigate('login');
        }
    },

    handleLogin(e) {
        return CustomerAuth.handleLogin(e);
    },

    handleRegister(e) {
        return CustomerAuth.handleRegister(e);
    },

    async logout() {
        if (AdminAuth.isVerified()) {
            await AdminAuth.logout();
        } else {
            await CustomerAuth.logout();
        }
    }
};

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
