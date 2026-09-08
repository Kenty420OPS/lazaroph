const fb = require('./firebase-admin.js'); module.exports = (req, res) => res.status(200).json({ success: true, db: !!fb.db });
