const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;
let auth = null;
let storage = null;

if (!getApps().length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        };

        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            console.warn('[Firebase Admin] Missing credentials. Firestore will fail.');
            initializeApp();
        } else {
            initializeApp({ credential: cert(serviceAccount) });
            console.log('[Firebase Admin] Initialized securely.');
        }

        db = getFirestore();
    } catch (error) {
        console.error('[Firebase Admin] Critical Initialization Error:', error.message);
    }
} else {
    try {
        db = getFirestore();
    } catch(e) {}
}

module.exports = { db, auth, storage };
