/**
 * LAZAROPH — Authentication & User State Module
 */

const Auth = {
    currentUser: null,

    async init() {
        const token = API.getToken();
        if (token) {
            try {
                this.currentUser = await API.getMe();
                this.updateUI();
            } catch (e) {
                console.warn('Session expired or invalid:', e);
                API.setToken(null);
                this.currentUser = null;
                this.updateUI();
            }
        } else {
            this.updateUI();
        }
    },

    updateUI() {
        const userBtn = document.getElementById('btn-header-account');
        const adminNavLink = document.getElementById('nav-admin-link');

        if (this.currentUser) {
            if (userBtn) {
                userBtn.title = `Logged in as ${this.currentUser.name}`;
                userBtn.innerHTML = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
            }
            if (adminNavLink) {
                if (this.currentUser.role === 'ADMIN') {
                    adminNavLink.classList.remove('hidden');
                } else {
                    adminNavLink.classList.add('hidden');
                }
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
        const modal = document.getElementById('modal-auth');
        if (!modal) return;
        this.switchAuthTab(defaultTab);
        modal.classList.add('active');
    },

    closeAuthModal() {
        const modal = document.getElementById('modal-auth');
        if (modal) modal.classList.remove('active');
    },

    switchAuthTab(tab) {
        const loginForm = document.getElementById('auth-login-form');
        const registerForm = document.getElementById('auth-register-form');
        const tabLoginBtn = document.getElementById('tab-btn-login');
        const tabRegisterBtn = document.getElementById('tab-btn-register');

        if (tab === 'login') {
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
            if (tabLoginBtn) tabLoginBtn.classList.add('active');
            if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
        } else {
            if (loginForm) loginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
            if (tabLoginBtn) tabLoginBtn.classList.remove('active');
            if (tabRegisterBtn) tabRegisterBtn.classList.add('active');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await API.login(email, password);
            API.setToken(data.token);
            this.currentUser = data.user;
            this.updateUI();
            this.closeAuthModal();
            showToast(`Welcome back, ${data.user.name}!`, 'success');

            if (data.user.role === 'ADMIN' && window.location.hash === '#admin') {
                App.navigate('admin');
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const city = document.getElementById('reg-city').value;
        const province = document.getElementById('reg-province').value;
        const zipCode = document.getElementById('reg-zip').value;

        try {
            const data = await API.register({ name, email, password, phone, address, city, province, zipCode });
            API.setToken(data.token);
            this.currentUser = data.user;
            this.updateUI();
            this.closeAuthModal();
            showToast(`Account created successfully! Welcome to LAZAROPH.`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async logout() {
        try {
            await API.logout();
        } catch (ignored) {}
        API.setToken(null);
        this.currentUser = null;
        this.updateUI();
        showToast('Logged out successfully.', 'info');
        App.navigate('home');
    }
};
