/**
 * LAZAROPH — Firebase Authentication & Firestore Integration Module
 * 
 * Scope: CUSTOMER ACCOUNTS ONLY
 * Handles:
 * - Firebase Web SDK Initialization (Auth & Firestore)
 * - Email & Password Customer Account Creation
 * - Official Firebase Email Verification (Gmail & all supported providers)
 * - Anti-Abuse Rate-Limited Verification Resend (60s cooldown)
 * - Authoritative Server Verification Status Checking (user.reload())
 * - Firestore Customer Profile Storage (ZERO passwords stored)
 * - Official Firebase Password Reset
 */

const LazarophFirebase = {
    app: null,
    auth: null,
    db: null,
    isReady: false,
    initError: null,

    // Anti-Abuse Cooldown tracking (60 seconds)
    COOLDOWN_SECONDS: 60,
    COOLDOWN_STORAGE_KEY: 'lazaroph_verify_resend_cooldown',

    // Default Firebase Configuration for LAZAROPH
    // Can be overridden via window.LAZAROPH_FIREBASE_CONFIG or localStorage
    defaultConfig: {
        apiKey: "AIzaSyDemoKeyLazarophAuthentic2026",
        authDomain: "lazaroph-store.firebaseapp.com",
        projectId: "lazaroph-store",
        storageBucket: "lazaroph-store.appspot.com",
        messagingSenderId: "109823471092",
        appId: "1:109823471092:web:a1b2c3d4e5f6g7h8i9j0"
    },

    getConfig() {
        if (typeof window !== 'undefined' && window.LAZAROPH_FIREBASE_CONFIG) {
            return window.LAZAROPH_FIREBASE_CONFIG;
        }
        try {
            const stored = localStorage.getItem('lazaroph_firebase_config');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {}
        return this.defaultConfig;
    },

    setConfig(customConfig) {
        if (customConfig && typeof customConfig === 'object') {
            localStorage.setItem('lazaroph_firebase_config', JSON.stringify(customConfig));
            window.location.reload();
        }
    },

    init() {
        if (this.isReady) return true;

        if (typeof firebase === 'undefined') {
            console.warn('[LazarophFirebase] Firebase SDK scripts not loaded yet.');
            this.initError = 'Firebase SDK scripts not loaded. Check internet connection.';
            return false;
        }

        try {
            const config = this.getConfig();
            if (!firebase.apps || firebase.apps.length === 0) {
                this.app = firebase.initializeApp(config);
            } else {
                this.app = firebase.app();
            }

            this.auth = firebase.auth();
            this.db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;

            // Set session persistence to LOCAL so customers stay signed in across browser reloads
            if (this.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
                this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
                    console.warn('[LazarophFirebase] Persistence warning:', err);
                });
            }

            this.isReady = true;
            console.log('[LazarophFirebase] Initialized successfully. Project:', config.projectId);
            return true;
        } catch (err) {
            console.error('[LazarophFirebase] Initialization error:', err);
            this.initError = err.message;
            return false;
        }
    },

    getCurrentUser() {
        return this.auth ? this.auth.currentUser : null;
    },

    isEmailVerified() {
        const user = this.getCurrentUser();
        return Boolean(user && user.emailVerified);
    },

    // =========================================================================
    // 1. CUSTOMER REGISTRATION WITH EMAIL VERIFICATION
    // =========================================================================
    async registerCustomer({ name, email, password, confirmPassword, phone, address, city, province, zipCode }) {
        if (!this.init()) {
            throw new Error(this.initError || 'Firebase Authentication is not available.');
        }

        // 1. Validate fields
        if (!name || !name.trim()) {
            throw new Error('Please enter your full name.');
        }
        if (!email || !email.trim()) {
            throw new Error('Please enter your email address.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();
        if (!emailRegex.test(normalizedEmail)) {
            throw new Error('Please enter a valid email address (e.g. yourname@gmail.com).');
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match. Please re-enter your password.');
        }

        // 2. Create account in Firebase Authentication
        let userCredential;
        try {
            userCredential = await this.auth.createUserWithEmailAndPassword(normalizedEmail, password);
        } catch (firebaseErr) {
            throw new Error(this.mapAuthError(firebaseErr));
        }

        const user = userCredential.user;

        // 3. Update Firebase display name
        try {
            await user.updateProfile({
                displayName: name.trim()
            });
        } catch (e) {
            console.warn('[LazarophFirebase] Could not update profile displayName:', e);
        }

        // 4. Create customer profile in Firestore (SECURITY: NO PASSWORDS STORED!)
        if (this.db) {
            try {
                await this.db.collection('customers').doc(user.uid).set({
                    uid: user.uid,
                    name: name.trim(),
                    email: normalizedEmail,
                    phone: phone ? phone.trim() : '',
                    address: address ? address.trim() : '',
                    city: city ? city.trim() : 'Marikina',
                    province: province ? province.trim() : 'Metro Manila',
                    zipCode: zipCode ? zipCode.trim() : '1805',
                    role: 'CUSTOMER',
                    emailVerified: false,
                    createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
                    updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                });
                console.log('[LazarophFirebase] Customer profile saved to Firestore for UID:', user.uid);
            } catch (fsErr) {
                console.warn('[LazarophFirebase] Firestore write warning (auth succeeded):', fsErr.message);
            }
        }

        // 5. Automatically send official Firebase email verification
        try {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname + '#verify-email',
                handleCodeInApp: true
            };
            await user.sendEmailVerification(actionCodeSettings);
            this.setCooldownTimestamp();
            console.log('[LazarophFirebase] Official verification email sent to:', normalizedEmail);
        } catch (mailErr) {
            console.warn('[LazarophFirebase] sendEmailVerification warning:', mailErr.message);
        }

        return {
            user,
            email: normalizedEmail,
            name: name.trim(),
            emailVerified: false,
            message: 'Your account has been created. Please check your email and verify your email address before continuing.'
        };
    },

    // =========================================================================
    // 2. CUSTOMER LOGIN WITH AUTHORITATIVE VERIFICATION STATUS CHECK
    // =========================================================================
    async loginCustomer(email, password) {
        if (!this.init()) {
            throw new Error(this.initError || 'Firebase Authentication is not available.');
        }

        if (!email || !email.trim()) {
            throw new Error('Please enter your registered email address.');
        }
        if (!password) {
            throw new Error('Please enter your password.');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Authenticate with Firebase Authentication
        let userCredential;
        try {
            userCredential = await this.auth.signInWithEmailAndPassword(normalizedEmail, password);
        } catch (firebaseErr) {
            throw new Error(this.mapAuthError(firebaseErr));
        }

        const user = userCredential.user;

        // 2. Force reload user from Firebase server to get the authoritative emailVerified status
        try {
            await user.reload();
        } catch (reloadErr) {
            console.warn('[LazarophFirebase] User reload error:', reloadErr);
        }

        const isVerified = Boolean(this.auth.currentUser && this.auth.currentUser.emailVerified);

        // 3. Sync verification status with Firestore if verified
        if (isVerified && this.db) {
            try {
                await this.db.collection('customers').doc(user.uid).update({
                    emailVerified: true,
                    updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                });
            } catch (fsErr) {
                // Ignore missing document error or permission rule
            }
        }

        // 4. Fetch customer profile data from Firestore if available
        let profile = null;
        if (this.db) {
            try {
                const docSnap = await this.db.collection('customers').doc(user.uid).get();
                if (docSnap.exists) {
                    profile = docSnap.data();
                }
            } catch (e) {}
        }

        const customerData = {
            id: user.uid,
            uid: user.uid,
            name: (profile && profile.name) || user.displayName || user.email.split('@')[0],
            email: user.email,
            phone: (profile && profile.phone) || '',
            address: (profile && profile.address) || '',
            city: (profile && profile.city) || 'Marikina',
            province: (profile && profile.province) || 'Metro Manila',
            zipCode: (profile && profile.zipCode) || '1805',
            role: 'CUSTOMER',
            emailVerified: isVerified
        };

        return {
            user: this.auth.currentUser,
            customer: customerData,
            emailVerified: isVerified
        };
    },

    // =========================================================================
    // 3. AUTHORITATIVE VERIFICATION STATUS CHECK (CHECK BUTTON)
    // =========================================================================
    async checkVerificationStatus() {
        if (!this.init()) {
            throw new Error('Firebase Authentication is not initialized.');
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('No customer is currently signed in. Please sign in to check your verification status.');
        }

        // Force server reload
        await user.reload();
        const updatedUser = this.auth.currentUser;
        const isVerified = Boolean(updatedUser && updatedUser.emailVerified);

        // Keep Firestore synchronized
        if (isVerified && this.db) {
            try {
                await this.db.collection('customers').doc(updatedUser.uid).update({
                    emailVerified: true,
                    updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                });
            } catch (e) {}
        }

        return {
            emailVerified: isVerified,
            email: updatedUser.email,
            name: updatedUser.displayName || updatedUser.email.split('@')[0]
        };
    },

    // =========================================================================
    // 4. RESEND VERIFICATION EMAIL WITH ANTI-ABUSE COOLDOWN
    // =========================================================================
    async resendVerificationEmail() {
        if (!this.init()) {
            throw new Error('Firebase Authentication is not initialized.');
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('Please enter your email and password to log in before requesting a verification email.');
        }

        // Check if already verified
        await user.reload();
        if (user.emailVerified) {
            return {
                alreadyVerified: true,
                message: 'Your email address is already verified! You have full access to customer features.'
            };
        }

        // Check rate limiting cooldown
        const remaining = this.getRemainingCooldown();
        if (remaining > 0) {
            throw new Error(`Please wait ${remaining} second${remaining === 1 ? '' : 's'} before resending another verification email.`);
        }

        try {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname + '#verify-email',
                handleCodeInApp: true
            };
            await user.sendEmailVerification(actionCodeSettings);
            this.setCooldownTimestamp();

            return {
                success: true,
                message: 'Verification email sent. Please check your inbox and spam folder.'
            };
        } catch (err) {
            throw new Error(this.mapAuthError(err));
        }
    },

    // Anti-Abuse Cooldown Utilities
    getRemainingCooldown() {
        try {
            const raw = sessionStorage.getItem(this.COOLDOWN_STORAGE_KEY);
            if (!raw) return 0;
            const targetTime = parseInt(raw, 10);
            const now = Date.now();
            if (now >= targetTime) {
                sessionStorage.removeItem(this.COOLDOWN_STORAGE_KEY);
                return 0;
            }
            return Math.ceil((targetTime - now) / 1000);
        } catch (e) {
            return 0;
        }
    },

    setCooldownTimestamp(seconds = this.COOLDOWN_SECONDS) {
        try {
            const targetTime = Date.now() + (seconds * 1000);
            sessionStorage.setItem(this.COOLDOWN_STORAGE_KEY, targetTime.toString());
        } catch (e) {}
    },

    // =========================================================================
    // 5. OFFICIAL FIREBASE FORGOT PASSWORD
    // =========================================================================
    async sendPasswordReset(email) {
        if (!this.init()) {
            throw new Error('Firebase Authentication is not initialized.');
        }

        if (!email || !email.trim()) {
            throw new Error('Please enter your registered email address.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new Error('Please enter a valid email address.');
        }

        try {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname + '#login',
                handleCodeInApp: true
            };
            await this.auth.sendPasswordResetEmail(normalizedEmail, actionCodeSettings);
            return {
                success: true,
                message: 'If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.'
            };
        } catch (err) {
            // For security, do not expose whether the account exists or not unless rate-limited
            if (err.code === 'auth/too-many-requests') {
                throw new Error('Too many requests. Please wait a few minutes before requesting another reset email.');
            }
            // Return success message regardless to prevent email enumeration
            return {
                success: true,
                message: 'If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.'
            };
        }
    },

    // =========================================================================
    // 6. ACTION CODE HANDLER (Link clicked in customer email)
    // =========================================================================
    async applyEmailActionCode(actionCode) {
        if (!this.init()) {
            throw new Error('Firebase Authentication is not initialized.');
        }
        if (!actionCode) {
            throw new Error('Missing verification action code.');
        }

        try {
            await this.auth.applyActionCode(actionCode);
            if (this.auth.currentUser) {
                await this.auth.currentUser.reload();
                if (this.db) {
                    try {
                        await this.db.collection('customers').doc(this.auth.currentUser.uid).update({
                            emailVerified: true,
                            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                        });
                    } catch (e) {}
                }
            }
            return {
                success: true,
                message: 'Email verified successfully! You now have full customer access.'
            };
        } catch (err) {
            throw new Error(this.mapAuthError(err));
        }
    },

    async confirmPasswordReset(actionCode, newPassword) {
        if (!this.init()) {
            throw new Error('Firebase Authentication is not initialized.');
        }
        if (!actionCode) {
            throw new Error('Missing password reset action code.');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long.');
        }

        try {
            await this.auth.confirmPasswordReset(actionCode, newPassword);
            return {
                success: true,
                message: 'Your password has been successfully reset. You can now log in with your new password.'
            };
        } catch (err) {
            throw new Error(this.mapAuthError(err));
        }
    },

    // =========================================================================
    // 7. CUSTOMER LOGOUT
    // =========================================================================
    async logoutCustomer() {
        if (this.auth) {
            try {
                await this.auth.signOut();
            } catch (e) {
                console.warn('[LazarophFirebase] signOut warning:', e);
            }
        }
        localStorage.removeItem('lazaroph_customer_token');
        localStorage.removeItem('lazaroph_customer_user');
        sessionStorage.removeItem(this.COOLDOWN_STORAGE_KEY);
    },

    // =========================================================================
    // 8. ERROR MAPPING UTILITY
    // =========================================================================
    mapAuthError(error) {
        if (!error) return 'An unexpected error occurred. Please try again.';
        const code = error.code || '';
        const msg = error.message || '';

        switch (code) {
            case 'auth/email-already-in-use':
                return 'An account with this email address already exists. Please log in or reset your password.';
            case 'auth/invalid-email':
                return 'The email address format is invalid. Please check your email and try again.';
            case 'auth/operation-not-allowed':
                return 'Email/Password sign-in is not enabled in Firebase Console. Please contact the administrator.';
            case 'auth/weak-password':
                return 'The password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
            case 'auth/user-disabled':
                return 'This customer account has been disabled. Please contact customer support.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
                return 'Invalid email or password. Please verify your credentials and try again.';
            case 'auth/too-many-requests':
                return 'Access to this account has been temporarily disabled due to many failed attempts. Please try again later or reset your password.';
            case 'auth/expired-action-code':
                return 'This verification link has expired. Please log in and request a new verification email.';
            case 'auth/invalid-action-code':
                return 'This verification link is invalid or has already been used.';
            case 'auth/network-request-failed':
                return 'Network connection error. Please check your internet connection and try again.';
            default:
                return msg || 'Authentication failed. Please try again.';
        }
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.LazarophFirebase = LazarophFirebase;
}
