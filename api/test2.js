const fb = require('firebase-admin/app'); module.exports = (req, res) => res.status(200).json({ success: true, keys: Object.keys(fb) });
