try {
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;
let auth = null;
let storage = null;

if (!getApps().length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            // Handle cases where the private key is wrapped in quotes or contains literal \n
            privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        };

        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            console.warn('[Firebase Admin] Missing required environment variables. Firestore operations may fail.');
            // Initialize without credentials (will fail on actual DB calls but prevents crash)
            initializeApp();
        } else {
            initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (process.env.FIREBASE_PROJECT_ID + '.appspot.com')
            });
            console.log('[Firebase Admin] Initialized securely.');
        }

        // Only assign these if initialization didn't throw
        db = getFirestore();
        
        

    } catch (error) {
        console.error('[Firebase Admin] Critical Initialization Error:', error.message);
        // db remains null. APIs will check for !db and return 500 JSON gracefully.
    }
} else {
    try {
        db = getFirestore();
        
        
    } catch(e) {}
}

module.exports = { db, auth, storage };

} catch (e) { console.error('Global Firebase Admin Crash:', e); module.exports = { db: null, auth: null, storage: null }; }

