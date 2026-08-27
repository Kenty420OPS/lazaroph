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

            this.auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
            this.db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
            this.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

            // Set session persistence to LOCAL so customers stay signed in across browser reloads
            if (this.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
                this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
                    console.warn('[LazarophFirebase] Persistence warning:', err);
                });
            }

            this.isReady = true;
            console.log('[LazarophFirebase] Initialized successfully. Project:', config.projectId, '| Storage ready:', Boolean(this.storage));
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
    },

    // =========================================================================
    // 9. CRYPTOGRAPHIC PASSWORD HASHING (SALTED SHA-256)
    // Zero plaintext passwords stored across the entire platform
    // =========================================================================
    SALT: "LAZAROPH_AUTHENTIC_2026",

    sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;
        var result = '';
        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;
        var hash = [];
        var k = [];
        var primeCounter = 0;
        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) {
                    isComposite[i] = candidate;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return;
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength);
        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16);
            var oldHash = hash;
            hash = hash.slice(0, 8);
            for (i = 0; i < 64; i++) {
                var w15 = w[i - 15], w2 = w[i - 2];
                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ ((~e) & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0
                    );
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }
            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }
        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    },

    hashPassword(plainText) {
        if (!plainText) return '';
        return this.sha256(plainText + this.SALT);
    },

    verifyPassword(plainText, storedHash) {
        if (!plainText || !storedHash) return false;
        return this.hashPassword(plainText).toLowerCase() === storedHash.toLowerCase();
    },

    // =========================================================================
    // 10. FIREBASE STORAGE — PRODUCT IMAGE UPLOADS
    // =========================================================================
    async uploadProductImage(file) {
        this.init();
        if (!file) throw new Error('No image file selected.');

        const cleanName = (file.name || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `products/${Date.now()}_${cleanName}`;

        if (this.storage) {
            try {
                const storageRef = this.storage.ref(storagePath);
                const metadata = { contentType: file.type || 'image/jpeg' };
                const snapshot = await storageRef.put(file, metadata);
                const downloadURL = await snapshot.ref.getDownloadURL();
                console.log('[LazarophFirebase] Image uploaded to Firebase Storage:', downloadURL);
                return downloadURL;
            } catch (storageErr) {
                console.warn('[LazarophFirebase] Firebase Storage upload error, falling back to persistent Data URL:', storageErr.message);
            }
        }

        // Reliable persistent Data URL fallback
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
        });
    },

    // =========================================================================
    // 11. CLOUD FIRESTORE — PERSISTENT PRODUCTS DATABASE
    // Source of truth: once deleted in Firestore, products NEVER return on refresh!
    // =========================================================================
    async getProducts(filters = {}) {
        this.init();
        if (!this.db) {
            if (typeof FallbackStore !== 'undefined') {
                return FallbackStore.getProducts();
            }
            return [];
        }

        try {
            // Check initialization metadata
            const metaDoc = await this.db.collection('_metadata').doc('store_init').get().catch(() => null);
            const isInitialized = metaDoc && metaDoc.exists && metaDoc.data().initialized;

            const snapshot = await this.db.collection('products').get();
            let products = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.isDeleted && data.status !== 'DELETED') {
                    products.push({ ...data, id: data.id || parseInt(doc.id, 10) || doc.id });
                }
            });

            // Seed initial products ONCE if and only if Firestore was never initialized before
            if (products.length === 0 && !isInitialized && typeof FallbackStore !== 'undefined') {
                console.log('[LazarophFirebase] First-time Firestore setup: seeding baseline catalog...');
                const initial = FallbackStore.getInitialProducts();
                const batch = this.db.batch();
                initial.forEach(p => {
                    const ref = this.db.collection('products').doc(String(p.id));
                    batch.set(ref, { ...p, isDeleted: false, updatedAt: new Date().toISOString() });
                });
                await batch.commit();
                await this.db.collection('_metadata').doc('store_init').set({
                    initialized: true,
                    seededAt: new Date().toISOString()
                });
                products = initial;
            }

            // In-memory filter processing
            let list = [...products];
            if (filters.category && filters.category !== 'all') {
                const catLower = filters.category.toLowerCase();
                list = list.filter(p => (p.categoryName || '').toLowerCase() === catLower);
            }
            if (filters.gender && filters.gender !== 'all') {
                list = list.filter(p => (p.gender || '').toUpperCase() === filters.gender.toUpperCase() || p.gender === 'UNISEX');
            }
            if (filters.brand && filters.brand !== 'all') {
                const brandLower = filters.brand.toLowerCase();
                list = list.filter(p => (p.brandName || '').toLowerCase() === brandLower);
            }
            if (filters.q && filters.q.trim()) {
                const query = filters.q.toLowerCase().trim();
                list = list.filter(p =>
                    (p.name || '').toLowerCase().includes(query) ||
                    (p.brandName || '').toLowerCase().includes(query) ||
                    (p.sku || '').toLowerCase().includes(query) ||
                    (p.categoryName || '').toLowerCase().includes(query)
                );
            }
            if (filters.sort === 'newest') {
                list.sort((a, b) => (b.id || 0) - (a.id || 0));
            } else if (filters.sort === 'price_asc') {
                list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
            } else if (filters.sort === 'price_desc') {
                list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
            }

            // Sync with local memory cache so offline operations stay accurate
            if (typeof FallbackStore !== 'undefined') {
                FallbackStore.saveProducts(products);
            }

            return list;
        } catch (err) {
            console.warn('[LazarophFirebase] Firestore getProducts error, using cached fallback:', err.message);
            if (typeof FallbackStore !== 'undefined') {
                return FallbackStore.getProducts();
            }
            return [];
        }
    },

    async saveProduct(product) {
        this.init();
        if (!this.db) {
            if (typeof FallbackStore !== 'undefined') {
                return FallbackStore.saveProduct(product);
            }
            return { success: true, product };
        }

        try {
            let id = product.id;
            if (!id) {
                const snapshot = await this.db.collection('products').get();
                let maxId = 0;
                snapshot.forEach(d => {
                    const num = parseInt(d.id, 10);
                    if (!isNaN(num) && num > maxId) maxId = num;
                });
                id = maxId + 1;
            }

            const cleanProduct = {
                ...product,
                id: id,
                sku: product.sku || ('LZPH-PRD-' + id),
                status: product.status || 'ACTIVE',
                isDeleted: false,
                updatedAt: new Date().toISOString()
            };

            await this.db.collection('products').doc(String(id)).set(cleanProduct, { merge: true });
            console.log('[LazarophFirebase] Product saved to Firestore:', id, cleanProduct.name);

            // Update FallbackStore cache
            if (typeof FallbackStore !== 'undefined') {
                FallbackStore.updateCachedProduct(cleanProduct);
            }

            return { success: true, product: cleanProduct, message: 'Product saved successfully to Firestore.' };
        } catch (err) {
            console.error('[LazarophFirebase] Error saving product to Firestore:', err);
            throw err;
        }
    },

    async deleteProduct(id) {
        this.init();
        const strId = String(id);

        if (!this.db) {
            if (typeof FallbackStore !== 'undefined') {
                return FallbackStore.deleteProduct(id);
            }
            return { success: true };
        }

        try {
            // Delete document permanently from Firestore
            await this.db.collection('products').doc(strId).delete();
            console.log('[LazarophFirebase] Product permanently deleted from Firestore:', strId);

            // Ensure FallbackStore removes it permanently so refresh never restores it
            if (typeof FallbackStore !== 'undefined') {
                FallbackStore.removeCachedProduct(id);
            }

            return { success: true, message: 'Product deleted permanently from Firestore.' };
        } catch (err) {
            console.error('[LazarophFirebase] Error deleting product from Firestore:', err);
            throw err;
        }
    },

    // =========================================================================
    // 12. CLOUD FIRESTORE — BRANDS PERSISTENCE
    // =========================================================================
    async getBrands() {
        this.init();
        if (!this.db) {
            return typeof FallbackStore !== 'undefined' ? FallbackStore.brands : [];
        }
        try {
            const snapshot = await this.db.collection('brands').get();
            if (snapshot.empty && typeof FallbackStore !== 'undefined') {
                // Seed initial brands once
                const batch = this.db.batch();
                FallbackStore.brands.forEach(b => {
                    batch.set(this.db.collection('brands').doc(String(b.id)), b);
                });
                await batch.commit();
                return FallbackStore.brands;
            }
            const list = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.data().id || d.id }));
            return list;
        } catch (e) {
            return typeof FallbackStore !== 'undefined' ? FallbackStore.brands : [];
        }
    },

    async saveBrand(brand) {
        this.init();
        if (!this.db) return brand;
        const id = brand.id || Date.now();
        const clean = { ...brand, id };
        await this.db.collection('brands').doc(String(id)).set(clean, { merge: true });
        return clean;
    },

    async deleteBrand(id) {
        this.init();
        if (!this.db) return { success: true };
        await this.db.collection('brands').doc(String(id)).delete();
        return { success: true };
    },

    // =========================================================================
    // 13. CLOUD FIRESTORE — ORDERS PERSISTENCE
    // =========================================================================
    async getOrders() {
        this.init();
        if (!this.db) {
            return typeof FallbackStore !== 'undefined' ? FallbackStore.getOrders() : [];
        }
        try {
            const snapshot = await this.db.collection('orders').orderBy('createdAt', 'desc').get();
            const list = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.data().id || d.id }));
            return list;
        } catch (e) {
            return typeof FallbackStore !== 'undefined' ? FallbackStore.getOrders() : [];
        }
    },

    async saveOrder(order) {
        this.init();
        if (!this.db) {
            return order;
        }
        const id = order.id || Date.now();
        const cleanOrder = {
            ...order,
            id,
            createdAt: order.createdAt || new Date().toISOString()
        };
        await this.db.collection('orders').doc(String(id)).set(cleanOrder, { merge: true });
        return cleanOrder;
    },

    async updateOrderStatus(id, status) {
        this.init();
        if (!this.db) return { success: true };
        await this.db.collection('orders').doc(String(id)).update({
            status,
            updatedAt: new Date().toISOString()
        });
        return { success: true, status };
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.LazarophFirebase = LazarophFirebase;
}
