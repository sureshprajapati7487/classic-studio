const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/settings — Public: frontend reads this for dynamic config
router.get('/', (req, res) => {
    try {
        const settings = db.get('site_settings').value();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PATCH /api/admin/settings — Admin: update any/all settings
router.patch('/', verifyToken, (req, res) => {
    try {
        const allowed = [
            'editor_name', 'tagline', 'whatsapp', 'instagram', 'youtube', 'email',
            'smtp_email', 'smtp_password', 'notify_email',
            'razorpay_key_id', 'razorpay_key_secret',
            'pricing_plans'
        ];

        const updates = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });
        db.get('site_settings').assign(updates).write();
        const settings = db.get('site_settings').value();
        res.json({ success: true, settings, message: 'Settings saved!' });
    } catch (err) {
        console.error('Settings update error:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router;
