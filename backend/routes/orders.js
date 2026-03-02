const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db, nextId } = require('../db');
const { verifyToken } = require('../middleware/auth');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

// Helper: send email notification to editor when new order arrives
async function notifyNewOrder(order) {
    const s = db.get('site_settings').value() || {};
    const smtpEmail = s.smtp_email || process.env.SMTP_EMAIL || '';
    const smtpPass = s.smtp_password || process.env.SMTP_PASSWORD || '';
    const notifyTo = s.notify_email || s.smtp_email || process.env.NOTIFY_EMAIL || smtpEmail;
    if (!smtpEmail || !smtpPass || smtpPass === 'your_gmail_app_password') return;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpEmail, pass: smtpPass }
        });
        await transporter.sendMail({
            from: `"ProEditor Orders" <${smtpEmail}>`,
            to: notifyTo,
            subject: `🎬 New Order #${order.id} — ${order.project_type}`,
            html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0d14;color:#f5f5f7;padding:32px;border-radius:12px;border:1px solid #d4af3733">
          <h2 style="color:#d4af37;margin-bottom:24px">📋 New Order Received!</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#9999aa;width:140px">Order ID</td><td style="padding:8px 0;font-weight:600">#${order.id}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Client Name</td><td style="padding:8px 0;font-weight:600">${order.name}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Mobile</td><td style="padding:8px 0">${order.mobile}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Email</td><td style="padding:8px 0">${order.email}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Project Type</td><td style="padding:8px 0;color:#d4af37;font-weight:600">${order.project_type}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Amount</td><td style="padding:8px 0;font-size:1.2em;font-weight:700;color:#d4af37">₹${order.amount || 'Custom'}</td></tr>
             <tr><td style="padding:8px 0;color:#9999aa">Payment</td><td style="padding:8px 0">${order.payment_status === 'paid' ? '✅ Paid' : order.payment_status === 'pending_verification' ? '🕐 UPI - Pending Verification' : '⏳ Unpaid'}</td></tr>
             ${order.payment_screenshot ? `<tr><td style="padding:8px 0;color:#9999aa">UPI Screenshot</td><td style="padding:8px 0"><a href="${order.payment_screenshot}" style="color:#d4af37">View Screenshot</a></td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#9999aa">Deadline</td><td style="padding:8px 0">${order.deadline || 'Not specified'}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Instructions</td><td style="padding:8px 0">${order.instructions || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">File</td><td style="padding:8px 0">${order.file_name || 'Not uploaded'}</td></tr>
            <tr><td style="padding:8px 0;color:#9999aa">Placed At</td><td style="padding:8px 0">${new Date(order.created_at).toLocaleString('en-IN')}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#12121c;border-radius:8px;border-left:3px solid #d4af37">
            <p style="margin:0;color:#9999aa;font-size:0.88em">Reply to this email or WhatsApp the client to confirm their order.</p>
          </div>
        </div>
      `
        });
        console.log(`📧 Order notification email sent for Order #${order.id}`);
    } catch (err) {
        console.warn('Email notification failed (check SMTP config):', err.message);
    }
}

// POST /api/orders — Create a new order
router.post('/', async (req, res) => {
    try {
        const {
            name, mobile, email, project_type,
            deadline, instructions, amount,
            file_path, file_name,
            razorpay_order_id, razorpay_payment_id,
            payment_screenshot, payment_status: providedPaymentStatus
        } = req.body;

        if (!name || !mobile || !email || !project_type) {
            return res.status(400).json({ error: 'Name, mobile, email, and project type are required' });
        }

        // Determine payment status: Razorpay paid → paid, UPI submitted → pending_verification, else unpaid
        const payment_status = razorpay_payment_id ? 'paid'
            : (providedPaymentStatus || 'unpaid');
        const id = nextId('orders');
        const now = new Date().toISOString();

        const order = {
            id,
            name, mobile, email, project_type,
            deadline: deadline || null,
            instructions: instructions || null,
            file_path: file_path || null,
            file_name: file_name || null,
            amount: amount || 0,
            status: 'pending',
            payment_status,
            payment_screenshot: payment_screenshot || null,
            razorpay_order_id: razorpay_order_id || null,
            razorpay_payment_id: razorpay_payment_id || null,
            created_at: now,
            updated_at: now
        };

        db.get('orders').push(order).write();

        // Send email notification to editor (non-blocking)
        notifyNewOrder(order);

        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});


// GET /api/orders — Admin: List all orders
router.get('/', verifyToken, (req, res) => {
    try {
        const orders = db.get('orders').orderBy('created_at', 'desc').value();
        res.json({ success: true, orders, total: orders.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — Get single order
router.get('/:id', verifyToken, (req, res) => {
    try {
        const order = db.get('orders').find({ id: parseInt(req.params.id) }).value();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', verifyToken, (req, res) => {
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

module.exports = router;
