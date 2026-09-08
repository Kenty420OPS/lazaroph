const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

if (!getApps().length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        };

        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            console.warn('[Firebase Admin] Missing required environment variables. Firestore operations may fail.');
            initializeApp();
        } else {
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (process.env.FIREBASE_PROJECT_ID + '.appspot.com')
            });
            console.log('[Firebase Admin] Initialized securely.');
        }
    } catch (error) {
        console.error('[Firebase Admin] Initialization error', error.stack);
    }
}

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

module.exports = { db, auth, storage };
