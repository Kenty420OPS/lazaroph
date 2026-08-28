/**
 * LAZAROPH — Vercel Serverless API: Administrator Authentication Handler
 * 
 * Features:
 * - Salted SHA-256 cryptographic verification ('LAZAROPH_AUTHENTIC_2026')
 * - Step 1: Email + Password validation
 * - Step 2: 6-digit PIN verification
 */

const crypto = require('crypto');
const SALT = 'LAZAROPH_AUTHENTIC_2026';

function hash(input) {
    if (!input) return '';
    return crypto.createHash('sha256').update(SALT + input).digest('hex');
}

const admins = [
    {
        id: 1,
        name: 'Super Administrator',
        email: 'admin1@lazaroph.com',
        passwordHash: hash('AdminPassword2026!'),
        pinHash: hash('992104'),
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
    },
    {
        id: 2,
        name: 'Clark Admin',
        email: 'montoyaclark8@gmail.com',
        passwordHash: hash('AdminPassword2026!'),
        pinHash: hash('992104'),
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
    }
];

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
    res.status(statusCode).json(data);
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Key');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    const { query } = req;
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const step = query.step || body.step || '1';

    try {
        if (step === '1' || step === 'step1') {
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';

            const admin = admins.find(a => a.email.toLowerCase() === email);
            if (!admin) {
                return sendJson(res, 401, { success: false, error: 'No administrator found with this email address.' });
            }
            if (admin.status === 'DISABLED') {
                return sendJson(res, 403, { success: false, error: 'This administrator account has been disabled.' });
            }

            const inputHash = hash(password);
            if (inputHash !== admin.passwordHash) {
                return sendJson(res, 401, { success: false, error: 'Invalid login password. Please check your credentials.' });
            }

            const preAuthToken = 'pre2fa_' + crypto.randomBytes(16).toString('hex') + Date.now();
            return sendJson(res, 200, {
                success: true,
                preAuthToken,
                adminEmail: admin.email,
                adminName: admin.name,
                adminRole: admin.role,
                message: 'Step 1 verified. Please enter your 6-digit Security PIN.'
            });
        }

        if (step === '2' || step === 'step2') {
            const email = (body.email || '').trim().toLowerCase();
            const pin = (body.securityPin || body.pin || '').trim();

            const admin = admins.find(a => a.email.toLowerCase() === email) || admins[0];
            if (!admin) {
                return sendJson(res, 401, { success: false, error: 'Session expired. Please restart login.' });
            }

            const inputPinHash = hash(pin);
            if (inputPinHash !== admin.pinHash) {
                return sendJson(res, 401, { success: false, error: 'Invalid Security Password. Please enter your correct 6-digit PIN.' });
            }

            const token = 'adm_' + crypto.randomBytes(24).toString('hex') + Date.now();
            return sendJson(res, 200, {
                success: true,
                token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                },
                message: 'Administrator authentication successful.'
            });
        }

        return sendJson(res, 400, { success: false, error: 'Invalid authentication step requested.' });
    } catch (err) {
        console.error('[API Auth Error]:', err);
        return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
    }
};
