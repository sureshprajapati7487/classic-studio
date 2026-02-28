const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, nextId } = require('../db');
const { verifyToken } = require('../middleware/auth');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

// POST /api/admin/register — Create new admin account with invite code
router.post('/register', async (req, res) => {
    try {
        const { name, mobile, email, username, brand_name, password, confirm_password, invite_code } = req.body;

        // Validate required fields
        if (!name || !mobile || !email || !username || !brand_name || !password || !confirm_password || !invite_code) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate invite code
        const s = db.get('site_settings').value() || {};
        const validCode = s.admin_invite_code || process.env.ADMIN_INVITE_CODE || 'SURESH8824';

        if (invite_code.trim() !== validCode) {
            return res.status(403).json({ error: 'Invalid invite code. Access denied.' });
        }

        // Validate passwords match
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check duplicate email
        const existing = db.get('admins').find({ email }).value();
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Check duplicate username
        const existingUser = db.get('admins').find({ username }).value();
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Hash password & save
        const hashed = bcrypt.hashSync(password, 10);
        const id = nextId('admins');
        db.get('admins').push({
            id,
            name: name.trim(),
            mobile: mobile.trim(),
            email: email.trim().toLowerCase(),
            username: username.trim().toLowerCase(),
            brand_name: brand_name.trim(),
            password: hashed,
            created_at: new Date().toISOString(),
        }).write();

        // Issue token so user is logged in immediately after register
        const token = jwt.sign({ id, email, username }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: `Welcome, ${name}! Account created successfully.`,
            token,
            admin: { id, name, email, username, brand_name },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/admin/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const admin = db.get('admins').find({ email }).value();
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const isValid = bcrypt.compareSync(password, admin.password);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({ success: true, token, admin: { id: admin.id, email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/admin/orders — All orders with stats
router.get('/orders', verifyToken, (req, res) => {
    try {
        const orders = db.get('orders').orderBy('created_at', 'desc').value();
        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            in_progress: orders.filter(o => o.status === 'in_progress').length,
            done: orders.filter(o => o.status === 'done').length,
            paid: orders.filter(o => o.payment_status === 'paid').length,
            total_revenue: orders
                .filter(o => o.payment_status === 'paid')
                .reduce((sum, o) => sum + (o.amount || 0), 0)
        };
        res.json({ success: true, orders, stats });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/messages — All contact messages
router.get('/messages', verifyToken, (req, res) => {
    try {
        const messages = db.get('contact_messages').orderBy('created_at', 'desc').value();
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// PATCH /api/admin/messages/:id/read
router.patch('/messages/:id/read', verifyToken, (req, res) => {
    try {
        db.get('contact_messages')
            .find({ id: parseInt(req.params.id) })
            .assign({ is_read: true })
            .write();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', verifyToken, (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in_progress', 'done', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        db.get('orders')
            .find({ id: parseInt(req.params.id) })
            .assign({ status, updated_at: new Date().toISOString() })
            .write();
        const updated = db.get('orders').find({ id: parseInt(req.params.id) }).value();
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// GET /api/admin/verify — Verify token
router.get('/verify', verifyToken, (req, res) => {
    res.json({ success: true, admin: req.admin });
});

// GET /api/admin/settings — read current settings (admin)
router.get('/settings', verifyToken, (req, res) => {
    try {
        const settings = db.get('site_settings').value();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PATCH /api/admin/settings — update site settings
router.patch('/settings', verifyToken, (req, res) => {
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

// PATCH /api/admin/change-password — change logged-in admin's password
router.patch('/change-password', verifyToken, async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (new_password !== confirm_password) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }
        if (new_password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const admin = db.get('admins').find({ email: req.admin.email }).value();
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const valid = bcrypt.compareSync(current_password, admin.password);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const hashed = bcrypt.hashSync(new_password, 10);
        db.get('admins').find({ email: req.admin.email }).assign({ password: hashed, updated_at: new Date().toISOString() }).write();

        res.json({ success: true, message: 'Password changed successfully!' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ══════════════════════════════════════════════
// ADMIN ACCOUNTS MANAGEMENT
// ══════════════════════════════════════════════

// GET /api/admin/admins — List all admin accounts (passwords hidden)
router.get('/admins', verifyToken, (req, res) => {
    try {
        const admins = db.get('admins').value().map(a => ({
            id: a.id,
            name: a.name || '—',
            email: a.email,
            username: a.username || '—',
            brand_name: a.brand_name || '—',
            mobile: a.mobile || '—',
            created_at: a.created_at,
        }));
        res.json({ success: true, admins });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// DELETE /api/admin/admins/:id — Remove an admin account
router.delete('/admins/:id', verifyToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const target = db.get('admins').find({ id }).value();
        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (target.email === req.admin.email) {
            return res.status(400).json({ error: 'Aap apna khud ka account delete nahi kar sakte!' });
        }
        db.get('admins').remove({ id }).write();
        res.json({ success: true, message: `Admin "${target.name || target.email}" removed.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete admin' });
    }
});

// PATCH /api/admin/admins/:id/reset-password — Reset any admin's password
router.patch('/admins/:id/reset-password', verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { new_password } = req.body;
        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        const target = db.get('admins').find({ id }).value();
        if (!target) return res.status(404).json({ error: 'Admin not found' });
        const hashed = bcrypt.hashSync(new_password, 10);
        db.get('admins').find({ id }).assign({ password: hashed, updated_at: new Date().toISOString() }).write();
        res.json({ success: true, message: `Password reset for "${target.name || target.email}"` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// PATCH /api/admin/invite-code — Change the registration invite code
router.patch('/invite-code', verifyToken, (req, res) => {
    try {
        const { invite_code } = req.body;
        if (!invite_code || invite_code.trim().length < 4) {
            return res.status(400).json({ error: 'Invite code must be at least 4 characters' });
        }
        db.get('site_settings').assign({ admin_invite_code: invite_code.trim() }).write();
        res.json({ success: true, message: 'Invite code updated!', invite_code: invite_code.trim() });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update invite code' });
    }
});

module.exports = router;
